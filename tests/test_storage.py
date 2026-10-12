import uuid
from datetime import datetime
from src.storage.repository import EventRepository

def test_save_and_get_event(test_repo: EventRepository):
    event_id = str(uuid.uuid4())
    event_data = {
        "event_id": event_id,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "source": "WIN32_NOTIFY",
        "hive": "HKCU",
        "key_path": r"Software\Microsoft\Windows\CurrentVersion\Run",
        "value_name": "TestKey",
        "value_type": "REG_SZ",
        "previous_data": None,
        "new_data": r"C:\Users\Public\payload.exe",
        "operation": "CREATE",
        "process": {
            "pid": 1234,
            "image_path": r"C:\Windows\System32\cmd.exe",
            "command_line": "cmd.exe /c reg add",
            "user_name": "TESTUSER"
        },
        "is_attributed": True
    }

    test_repo.save_event(event_data)
    events, total = test_repo.get_events(limit=10)
    assert total >= 1
    found = next((e for e in events if e["event_id"] == event_id), None)
    assert found is not None
    assert found["value_name"] == "TestKey"
    assert found["process_pid"] == 1234

def test_save_and_update_alert(test_repo: EventRepository):
    event_id = str(uuid.uuid4())
    alert_id = str(uuid.uuid4())

    event_data = {
        "event_id": event_id,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "source": "WIN32_NOTIFY",
        "hive": "HKCU",
        "key_path": r"Software\Microsoft\Windows\CurrentVersion\Run",
        "value_name": "PersistTest",
        "operation": "CREATE"
    }
    test_repo.save_event(event_data)

    alert_data = {
        "alert_id": alert_id,
        "event_id": event_id,
        "rule_id": "WR-PERSIST-001",
        "rule_name": "Run Key Test",
        "severity": "CRITICAL",
        "rationale": "Test alert rationale",
        "matched_conditions": [{"field": "key_path", "matched": True}],
        "status": "NEW"
    }
    test_repo.save_alert(alert_data)

    alert = test_repo.get_alert_by_id(alert_id)
    assert alert is not None
    assert alert["rule_id"] == "WR-PERSIST-001"
    assert alert["status"] == "NEW"

    # Update status to RESOLVED
    updated = test_repo.update_alert_status(alert_id, "RESOLVED", "Remediation verified")
    assert updated is True

    alert_updated = test_repo.get_alert_by_id(alert_id)
    assert alert_updated["status"] == "RESOLVED"
    assert alert_updated["analyst_notes"] == "Remediation verified"
