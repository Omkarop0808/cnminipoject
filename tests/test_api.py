from fastapi.testclient import TestClient
from src.api.app import app

client = TestClient(app)

def test_system_status():
    res = client.get("/api/v1/system/status")
    assert res.status_code == 200
    data = res.json()
    assert data["service"] == "WinReg-HIDS"
    assert data["status"] == "HEALTHY"
    assert "cpu_percent" in data
    assert "active_watchers" in data

def test_list_rules():
    res = client.get("/api/v1/rules")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 6
    assert any(r["rule_id"] == "WR-PERSIST-001" for r in data["rules"])

def test_reload_rules():
    res = client.post("/api/v1/rules/reload")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "reloaded"
    assert data["active_rules_count"] >= 6

def test_list_alerts():
    res = client.get("/api/v1/alerts")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "total" in data

def test_baseline_diff():
    res = client.get("/api/v1/baseline/diff")
    assert res.status_code == 200
    data = res.json()
    assert "summary" in data
    assert "added_count" in data["summary"]

def test_list_events():
    res = client.get("/api/v1/events?page=1&limit=20")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "total" in data

    # Test with query filters
    res_filtered = client.get("/api/v1/events?source=win32&search=Run")
    assert res_filtered.status_code == 200
    assert "items" in res_filtered.json()

def test_simulation_run_key():
    res = client.post("/api/v1/test/simulate", json={"test_vector": "RUN_KEY_TEMP", "auto_cleanup": True})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "PASSED"
    assert data["detected"] is True
    assert data["matched_rule"] == "WR-PERSIST-001"
    assert data["cleaned_up"] is True

