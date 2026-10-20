import pytest
from fastapi.testclient import TestClient
from src.api.app import app
from src.security.anti_phishing import AntiPhishingInspector
from src.security.cia_integrity import CIAIntegrityLedger
from src.security.ransomware_guard import RansomwareGuard
from src.security.packet_engine import packet_engine

client = TestClient(app)

def test_anti_phishing_url_evaluation():
    # Test benign
    res_clean = AntiPhishingInspector.evaluate_url("https://portal.azure.com/dashboard")
    assert res_clean["is_phishing"] is False
    assert res_clean["threat_type"] == "BENIGN"

    # Test phishing homograph / typosquat
    res_phish = AntiPhishingInspector.evaluate_url("https://login.micros0ft-verify.xyz")
    assert res_phish["is_phishing"] is True
    assert res_phish["threat_type"] == "TYPOSQUATTING_HOMOGRAPH"

    # Test punycode
    res_puny = AntiPhishingInspector.evaluate_url("https://xn--app-9qa.com")
    assert res_puny["is_phishing"] is True

def test_cia_integrity_ledger_lifecycle(tmp_path):
    test_ledger_path = str(tmp_path / "test_cia_ledger.json")
    ledger = CIAIntegrityLedger(ledger_path=test_ledger_path)

    # Initial genesis block verification
    report = ledger.verify_integrity()
    assert report["verified"] is True
    assert report["total_blocks"] >= 1

    # Append block
    b1 = ledger.append_block("Analyst1", "ConfigSeal", {"rule": "persist_001", "status": "APPROVED"})
    assert b1["index"] == 1
    assert "block_hash" in b1

    # Verify chain
    assert ledger.verify_integrity()["verified"] is True

    # Tamper simulation
    tamper_res = ledger.simulate_tamper(block_index=1)
    assert tamper_res["tampered_index"] == 1

    # Verification must now fail!
    tamper_report = ledger.verify_integrity()
    assert tamper_report["verified"] is False
    assert tamper_report["status"] == "COMPROMISED"

def test_ransomware_guard_burst_detection():
    guard = RansomwareGuard(time_window=1.0, threshold=5)
    # Under threshold
    for _ in range(3):
        res = guard.record_mutation()
    assert res["burst_detected"] is False

    # Exceed threshold
    for _ in range(4):
        res = guard.record_mutation()
    assert res["burst_detected"] is True
    assert res["containment_active"] is True

    # Canary trip
    trip_res = guard.trip_canary()
    assert trip_res["tripwire_breached"] is True
    assert guard.get_status()["canary_intact"] is False

    # Reset
    guard.reset_guard()
    assert guard.get_status()["canary_intact"] is True

def test_packet_engine_dpi_generation():
    packets = packet_engine.get_sample_stream(count=5)
    assert len(packets) == 5
    for p in packets:
        assert "packet_id" in p
        assert "osi_layers" in p
        assert "layer2_datalink" in p["osi_layers"]
        assert "layer3_network" in p["osi_layers"]
        assert "layer4_transport" in p["osi_layers"]
        assert "layer7_application" in p["osi_layers"]
        assert "hex_dump" in p["osi_layers"]["layer7_application"]
        assert "security" in p

def test_security_api_endpoints():
    # Overall status
    res = client.get("/api/v1/security/status")
    assert res.status_code == 200
    data = res.json()
    assert "overall_status" in data
    assert "anti_phishing" in data
    assert "cia_integrity" in data
    assert "ransomware_guard" in data

    # Anti phishing check URL
    res = client.post("/api/v1/security/anti-phishing/check-url", json={"url": "http://g00gle-login.xyz"})
    assert res.status_code == 200
    assert res.json()["is_phishing"] is True

    # Packet stream
    res = client.get("/api/v1/security/packets/stream?count=4")
    assert res.status_code == 200
    assert len(res.json()["packets"]) == 4

    # Attack simulation
    res = client.post("/api/v1/security/packets/simulate-attack", json={"attack_type": "PHISHING"})
    assert res.status_code == 200
    assert res.json()["attack_type"] == "PHISHING"
    assert len(res.json()["packets"]) > 0
