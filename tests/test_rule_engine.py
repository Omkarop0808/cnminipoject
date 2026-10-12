from src.engine.normalizer import NormalizedEvent, ProcessMetadata
from src.engine.rule_engine import RuleEngine

def test_rule_engine_loaded(rule_engine: RuleEngine):
    assert len(rule_engine.rules) >= 6

def test_rule_persist_001_run_key_temp(rule_engine: RuleEngine):
    # Event in %APPDATA%
    ev = NormalizedEvent(
        hive="HKCU",
        key_path=r"Software\Microsoft\Windows\CurrentVersion\Run",
        value_name="DiscordUpdater",
        value_type="REG_SZ",
        new_data=r"C:\Users\User\AppData\Local\Temp\backdoor.exe",
        operation="CREATE"
    )
    matches = rule_engine.evaluate_event(ev)
    assert any(m.rule_id == "WR-PERSIST-001" for m in matches)
    matched = next(m for m in matches if m.rule_id == "WR-PERSIST-001")
    assert matched.severity == "CRITICAL"
    assert "T1547.001" in (matched.mitre_attack or "")

def test_rule_persist_002_ifeo_debugger(rule_engine: RuleEngine):
    ev = NormalizedEvent(
        hive="HKLM",
        key_path=r"Software\Microsoft\Windows NT\CurrentVersion\Image File Execution Options\sethc.exe",
        value_name="Debugger",
        value_type="REG_SZ",
        new_data=r"C:\Windows\System32\cmd.exe",
        operation="CREATE"
    )
    matches = rule_engine.evaluate_event(ev)
    assert any(m.rule_id == "WR-PERSIST-002" for m in matches)

def test_rule_defense_001_defender_tamper(rule_engine: RuleEngine):
    ev = NormalizedEvent(
        hive="HKLM",
        key_path=r"Software\Policies\Microsoft\Windows Defender",
        value_name="DisableRealtimeMonitoring",
        value_type="REG_DWORD",
        new_data="1",
        operation="MODIFY"
    )
    matches = rule_engine.evaluate_event(ev)
    assert any(m.rule_id == "WR-DEFENSE-001" for m in matches)

def test_rule_suppression_trusted_installer(rule_engine: RuleEngine):
    ev = NormalizedEvent(
        hive="HKCU",
        key_path=r"Software\Microsoft\Windows\CurrentVersion\Run",
        value_name="TrustedApp",
        value_type="REG_SZ",
        new_data=r"C:\Users\User\AppData\Local\Temp\app.exe",
        operation="CREATE",
        process=ProcessMetadata(image_name="trusted_installer.exe")
    )
    matches = rule_engine.evaluate_event(ev)
    # Must be suppressed
    assert not any(m.rule_id == "WR-PERSIST-001" for m in matches)

def test_in_writable_path_operator(rule_engine: RuleEngine):
    cond = {"field": "new_data", "operator": "in_writable_path"}
    ev_temp = NormalizedEvent(
        hive="HKCU",
        key_path=r"Software\Microsoft\Windows\CurrentVersion\Run",
        new_data=r"C:\Users\User\AppData\Local\Temp\evil.exe"
    )
    matched, proof = rule_engine._eval_single_condition(cond, ev_temp)
    assert matched is True
    assert proof["matched"] is True

    ev_system = NormalizedEvent(
        hive="HKCU",
        key_path=r"Software\Microsoft\Windows\CurrentVersion\Run",
        new_data=r"C:\Windows\System32\notepad.exe"
    )
    matched_sys, _ = rule_engine._eval_single_condition(cond, ev_system)
    assert matched_sys is False

def test_rule_persist_003_winlogon_tampering(rule_engine: RuleEngine):
    # Modified Shell away from explorer.exe
    ev = NormalizedEvent(
        hive="HKLM",
        key_path=r"Software\Microsoft\Windows NT\CurrentVersion\Winlogon",
        value_name="Shell",
        value_type="REG_SZ",
        new_data="cmd.exe",
        operation="MODIFY"
    )
    matches = rule_engine.evaluate_event(ev)
    assert any(m.rule_id == "WR-PERSIST-003" for m in matches)
    matched = next(m for m in matches if m.rule_id == "WR-PERSIST-003")
    assert matched.severity == "CRITICAL"
    assert "T1547.004" in (matched.mitre_attack or "")

    # Standard explorer.exe shell should NOT trigger
    ev_normal = NormalizedEvent(
        hive="HKLM",
        key_path=r"Software\Microsoft\Windows NT\CurrentVersion\Winlogon",
        value_name="Shell",
        value_type="REG_SZ",
        new_data="explorer.exe",
        operation="MODIFY"
    )
    assert not any(m.rule_id == "WR-PERSIST-003" for m in rule_engine.evaluate_event(ev_normal))

def test_rule_persist_004_suspicious_service_binary(rule_engine: RuleEngine):
    ev = NormalizedEvent(
        hive="HKLM",
        key_path=r"System\CurrentControlSet\Services\EvilSvc",
        value_name="ImagePath",
        value_type="REG_EXPAND_SZ",
        new_data=r"%APPDATA%\malicious.exe",
        operation="CREATE"
    )
    matches = rule_engine.evaluate_event(ev)
    assert any(m.rule_id == "WR-PERSIST-004" for m in matches)
    matched = next(m for m in matches if m.rule_id == "WR-PERSIST-004")
    assert matched.severity == "HIGH"

def test_rule_persist_005_lolbin_startup(rule_engine: RuleEngine):
    ev = NormalizedEvent(
        hive="HKCU",
        key_path=r"Software\Microsoft\Windows\CurrentVersion\Run",
        value_name="FakeTask",
        value_type="REG_SZ",
        new_data=r"mshta.exe vbscript:Close(Execute(CreateObject(Chr(119)&Chr(115)&Chr(99)&Chr(114)...)))",
        operation="CREATE"
    )
    matches = rule_engine.evaluate_event(ev)
    assert any(m.rule_id == "WR-PERSIST-005" for m in matches)

def test_empty_condition_safety(rule_engine: RuleEngine):
    ev = NormalizedEvent(
        hive="HKCU",
        key_path=r"Software\Microsoft\Windows\CurrentVersion\Run"
    )
    matched, proof = rule_engine._eval_single_condition({}, ev)
    assert matched is False
    assert proof is None
