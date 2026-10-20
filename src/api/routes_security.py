from fastapi import APIRouter, Query, Body
from typing import Dict, Any, Optional
from ..security.anti_phishing import AntiPhishingInspector
from ..security.cia_integrity import CIAIntegrityLedger
from ..security.ransomware_guard import RansomwareGuard
from ..security.packet_engine import packet_engine

router = APIRouter(prefix="/security", tags=["Security Suite"])
cia_ledger = CIAIntegrityLedger()
ransomware_guard = RansomwareGuard()

@router.get("/status")
def get_security_status():
    phishing_posture = AntiPhishingInspector.get_security_posture()
    integrity_report = cia_ledger.verify_integrity()
    ledger_blocks = len(cia_ledger.load_ledger())
    ransom_status = ransomware_guard.get_status()

    is_healthy = (
        phishing_posture["status"] == "SECURE" and
        integrity_report.get("verified", False) and
        not ransom_status["containment_active"]
    )

    return {
        "overall_status": "SECURE" if is_healthy else "THREAT_DETECTED",
        "anti_phishing": phishing_posture,
        "cia_integrity": integrity_report,
        "ransomware_guard": ransom_status,
        "telemetry": {
            "total_ledger_blocks": ledger_blocks,
            "packets_inspected_today": 14280
        }
    }

# ----------------- Anti-Phishing Endpoints -----------------

@router.get("/anti-phishing")
def get_anti_phishing_details():
    return AntiPhishingInspector.get_security_posture()

@router.post("/anti-phishing/check-url")
def check_phishing_url(payload: Dict[str, str] = Body(...)):
    url = payload.get("url", "")
    return AntiPhishingInspector.evaluate_url(url)

# ----------------- CIA Integrity Ledger Endpoints -----------------

@router.get("/integrity-ledger")
def get_integrity_ledger():
    return {
        "blocks": cia_ledger.load_ledger(),
        "verification": cia_ledger.verify_integrity()
    }

@router.post("/integrity-block")
def append_integrity_block(payload: Dict[str, Any] = Body(default={"actor": "SystemAdmin", "action": "ManualConfigAudit"})):
    actor = payload.get("actor", "SystemAdmin")
    action = payload.get("action", "ManualConfigAudit")
    data = payload.get("data", {"status": "verified_by_analyst"})
    block = cia_ledger.append_block(actor, action, data)
    return {"status": "success", "block": block, "verification": cia_ledger.verify_integrity()}

@router.post("/integrity-verify")
def verify_integrity_chain():
    return cia_ledger.verify_integrity()

@router.post("/integrity-tamper")
def simulate_tamper(payload: Dict[str, Any] = Body(default={"block_index": 1})):
    block_index = payload.get("block_index", 1)
    result = cia_ledger.simulate_tamper(block_index)
    verification = cia_ledger.verify_integrity()
    return {"simulation": result, "verification": verification}

# ----------------- Ransomware Guard Endpoints -----------------

@router.get("/ransomware/status")
def get_ransomware_status():
    return ransomware_guard.get_status()

@router.post("/ransomware/simulate-burst")
def simulate_ransomware_burst():
    results = []
    # Trigger 12 rapid mutations
    for _ in range(12):
        res = ransomware_guard.record_mutation()
        results.append(res)
    return {
        "burst_triggered": True,
        "latest_state": results[-1],
        "message": "High-frequency registry mutation burst simulated. Automated containment lockdown triggered."
    }

@router.post("/ransomware/trip-canary")
def trip_ransomware_canary():
    result = ransomware_guard.trip_canary()
    return {"status": "success", "canary_alert": result}

@router.post("/ransomware/reset")
def reset_ransomware_guard():
    return ransomware_guard.reset_guard()

# ----------------- Network Packet Telemetry & DPI Endpoints -----------------

@router.get("/packets/stream")
def get_packet_stream(count: int = Query(default=8, ge=1, le=50)):
    return {
        "packets": packet_engine.get_sample_stream(count=count),
        "total": count
    }

@router.post("/packets/simulate-attack")
def simulate_network_attack(payload: Dict[str, str] = Body(...)):
    attack_type = payload.get("attack_type", "PHISHING").upper()
    packets = packet_engine.generate_attack_scenario(attack_type)
    return {
        "attack_type": attack_type,
        "packets_generated": len(packets),
        "packets": packets
    }
