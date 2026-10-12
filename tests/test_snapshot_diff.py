from src.collector.snapshot_diff import SnapshotDiffEngine, serialize_registry_value
import winreg

def test_serialize_registry_value():
    s, h = serialize_registry_value("test_string", winreg.REG_SZ)
    assert s == "test_string"
    assert len(h) == 64

    s_dw, h_dw = serialize_registry_value(1, winreg.REG_DWORD)
    assert s_dw == "1"
    assert len(h_dw) == 64

def test_diff_snapshots_addition_modification_deletion():
    hive = "HKCU"
    path = r"Software\Microsoft\Windows\CurrentVersion\Run"

    old_state = {
        "subkeys": set(),
        "values": {
            "OldValue": {"type": "REG_SZ", "data": "calc.exe", "hash": "hash1"}
        }
    }

    new_state = {
        "subkeys": {"NewSubKey"},
        "values": {
            "OldValue": {"type": "REG_SZ", "data": "malware.exe", "hash": "hash2"},
            "AddedValue": {"type": "REG_SZ", "data": "cmd.exe", "hash": "hash3"}
        }
    }

    diffs = SnapshotDiffEngine.diff_snapshots(hive, path, old_state, new_state)
    assert len(diffs) == 3

    ops = {d["operation"]: d for d in diffs}
    assert "MODIFY" in ops
    assert ops["MODIFY"]["value_name"] == "OldValue"
    assert ops["MODIFY"]["previous_data"] == "calc.exe"
    assert ops["MODIFY"]["new_data"] == "malware.exe"

    assert "CREATE" in ops
