import winreg
import time
import uuid
from typing import Dict, Any, Optional
from ..collector.snapshot_diff import SnapshotDiffEngine
from ..engine.normalizer import normalize_raw_event
from ..engine.rule_engine import RuleEngine
from ..storage.repository import EventRepository

class ThreatSimulator:
    def __init__(self, rule_engine: RuleEngine, repository: EventRepository):
        self.rule_engine = rule_engine
        self.repository = repository

    def run_simulation(self, vector_name: str = "RUN_KEY_TEMP", auto_cleanup: bool = True) -> Dict[str, Any]:
        """
        Executes a harmless registry test vector, evaluates detection, and cleans up.
        """
        run_id = str(uuid.uuid4())
        started_at = time.time()
        test_val_name = f"WinReg_Test_{run_id[:8]}"
        test_key_path = r"Software\Microsoft\Windows\CurrentVersion\Run"
        h_root = winreg.HKEY_CURRENT_USER

        if vector_name == "RUN_KEY_TEMP":
            payload_data = r"C:\Users\Public\test_sim_payload.exe"
            expected_rule = "WR-PERSIST-001"
        elif vector_name == "IFEO_DEBUGGER":
            test_key_path = r"Software\Microsoft\Windows NT\CurrentVersion\Image File Execution Options\notepad_sim.exe"
            test_val_name = "Debugger"
            payload_data = "cmd.exe"
            expected_rule = "WR-PERSIST-002"
        elif vector_name == "LOLBIN_STARTUP":
            payload_data = r"powershell.exe -NoProfile -Command Write-Host SimTest"
            expected_rule = "WR-PERSIST-005"
        else:
            payload_data = r"C:\Temp\sim_test.exe"
            expected_rule = "WR-PERSIST-001"

        # 1. Take snapshot before write
        snap_before = SnapshotDiffEngine.snapshot_key("HKCU", test_key_path)

        # 2. Inject harmless test value
        t_inject_start = time.perf_counter()
        try:
            with winreg.CreateKey(h_root, test_key_path) as h_key:
                winreg.SetValueEx(h_key, test_val_name, 0, winreg.REG_SZ, payload_data)
        except Exception as e:
            return {
                "run_id": run_id,
                "status": "FAILED",
                "error": f"Failed to write test registry value: {e}",
                "detected": False
            }

        # 3. Take snapshot after write and compute diff
        snap_after = SnapshotDiffEngine.snapshot_key("HKCU", test_key_path)
        events = SnapshotDiffEngine.diff_snapshots("HKCU", test_key_path, snap_before, snap_after)

        # 4. Evaluate event against RuleEngine
        detected = False
        matched_rule_id = None
        for ev_raw in events:
            ev_raw["source"] = "WIN32_NOTIFY"
            norm_event = normalize_raw_event(ev_raw, {"image_name": "python.exe", "command_line": "python simulation"})
            matches = self.rule_engine.evaluate_event(norm_event)
            if matches:
                detected = True
                matched_rule_id = matches[0].rule_id
                # Record to repository for audit visibility
                self.repository.save_event(norm_event.model_dump())
                break

        t_detect_end = time.perf_counter()
        latency_ms = (t_detect_end - t_inject_start) * 1000.0

        # 5. Cleanup test value
        cleaned = False
        if auto_cleanup:
            try:
                with winreg.OpenKey(h_root, test_key_path, 0, winreg.KEY_SET_VALUE) as h_key:
                    winreg.DeleteValue(h_key, test_val_name)
                if "notepad_sim.exe" in test_key_path:
                    parent_path, subkey_name = test_key_path.rsplit("\\", 1)
                    with winreg.OpenKey(h_root, parent_path, 0, winreg.KEY_ALL_ACCESS) as h_parent:
                        winreg.DeleteKey(h_parent, subkey_name)
                cleaned = True
            except Exception:
                pass

        # 6. Record test run in database
        self.repository.record_test_run(
            run_id=run_id,
            test_name=vector_name,
            started_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(started_at)),
            status="PASSED" if detected else "FAILED",
            total_injected=1,
            total_detected=1 if detected else 0,
            avg_latency_ms=round(latency_ms, 2),
            details=f"Injected {test_val_name} -> {payload_data}. Matched: {matched_rule_id}"
        )

        return {
            "run_id": run_id,
            "status": "PASSED" if detected else "FAILED",
            "test_vector": vector_name,
            "detected": detected,
            "matched_rule": matched_rule_id,
            "expected_rule": expected_rule,
            "latency_ms": round(latency_ms, 2),
            "cleaned_up": cleaned
        }
