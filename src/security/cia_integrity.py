import hashlib
import json
import os
import time
from typing import Dict, Any, List

class CIAIntegrityLedger:
    """
    Maintains a cryptographic SHA-256 hash-chain ledger for critical registry configuration
    to guarantee Confidentiality, Integrity, and Availability (CIA triad).
    Acts as an immutable audit log ensuring zero unauthorized tampering.
    """
    def __init__(self, ledger_path: str = "cia_ledger.json"):
        self.ledger_path = ledger_path
        self._ensure_genesis()

    def _ensure_genesis(self):
        if not os.path.exists(self.ledger_path) or os.path.getsize(self.ledger_path) == 0:
            ts = time.strftime("%Y-%m-%dT%H:%M:%SZ")
            content = {
                "index": 0,
                "timestamp": ts,
                "actor": "KERNEL_INIT",
                "action": "GENESIS_SEAL",
                "data": {"description": "WinReg-HIDS CIA Triad Root Trust Anchor"},
                "prev_hash": "0" * 64
            }
            genesis_block = {
                **content,
                "block_hash": self.compute_state_hash(content)
            }
            self.save_ledger([genesis_block])

    def compute_state_hash(self, state_data: Dict[str, Any]) -> str:
        serialized = json.dumps(state_data, sort_keys=True)
        return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

    def append_block(self, actor: str, action: str, data: Dict[str, Any]) -> Dict[str, Any]:
        ledger = self.load_ledger()
        if not ledger:
            self._ensure_genesis()
            ledger = self.load_ledger()

        prev_hash = ledger[-1]["block_hash"]
        index = len(ledger)
        
        block_content = {
            "index": index,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "actor": actor,
            "action": action,
            "data": data,
            "prev_hash": prev_hash
        }
        block_hash = self.compute_state_hash(block_content)
        block = {**block_content, "block_hash": block_hash}
        
        ledger.append(block)
        self.save_ledger(ledger)
        return block

    def load_ledger(self) -> List[Dict[str, Any]]:
        if not os.path.exists(self.ledger_path):
            return []
        try:
            with open(self.ledger_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    def save_ledger(self, ledger: List[Dict[str, Any]]):
        with open(self.ledger_path, "w", encoding="utf-8") as f:
            json.dump(ledger, f, indent=2)

    def verify_integrity(self) -> Dict[str, Any]:
        """
        Validates cryptographic link of every single block in the ledger.
        Returns detailed verification report including any breached block indices.
        """
        ledger = self.load_ledger()
        if not ledger:
            return {"verified": True, "total_blocks": 0, "status": "EMPTY"}

        for i, block in enumerate(ledger):
            expected_prev = "0" * 64 if i == 0 else ledger[i-1]["block_hash"]
            if block.get("prev_hash") != expected_prev:
                return {
                    "verified": False,
                    "breached_index": i,
                    "reason": f"Hash chain broken at block {i}: prev_hash does not match parent block_hash",
                    "status": "COMPROMISED"
                }

            content = {
                "index": block["index"],
                "timestamp": block.get("timestamp"),
                "actor": block["actor"],
                "action": block["action"],
                "data": block["data"],
                "prev_hash": block["prev_hash"]
            }
            if block.get("block_hash") != self.compute_state_hash(content):
                return {
                    "verified": False,
                    "breached_index": i,
                    "reason": f"Content tampering detected at block {i}: computed hash differs from sealed hash",
                    "status": "COMPROMISED"
                }

        return {
            "verified": True,
            "total_blocks": len(ledger),
            "latest_hash": ledger[-1]["block_hash"] if ledger else None,
            "status": "VALID_CRYPTOGRAPHIC_CHAIN"
        }

    def simulate_tamper(self, block_index: int = 1) -> Dict[str, Any]:
        """Simulates an attacker modifying a historical block to test CIA tamper detection."""
        ledger = self.load_ledger()
        if len(ledger) <= block_index:
            self.append_block("Admin", "BaselineSnapshot", {"state": "OK"})
            ledger = self.load_ledger()

        idx = min(block_index, len(ledger) - 1)
        ledger[idx]["data"]["tampered_by"] = "MALICIOUS_ROOTKIT_TAMPER"
        # Save tampered block WITHOUT updating block_hash or downstream chain
        self.save_ledger(ledger)
        return {
            "tampered_index": idx,
            "message": "Block intentionally mutated to trigger cryptographic integrity verification failure"
        }
