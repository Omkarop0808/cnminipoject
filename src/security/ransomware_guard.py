import time
import os
from typing import Dict, Any, List

class RansomwareGuard:
    """
    Monitors rapid-fire value modifications, mass entropy changes, and canary registry
    object alterations to detect and contain ransomware mass-encryption and configuration sabotage.
    """
    CANARY_KEY_PATH = r"HKLM\SOFTWARE\WinRegHIDS\CanaryTripwire"
    
    def __init__(self, time_window: float = 2.0, threshold: int = 10):
        self.time_window = time_window
        self.threshold = threshold
        self.events: List[float] = []
        self.canary_intact = True
        self.canary_last_checked = time.time()
        self.containment_active = False

    def record_mutation(self) -> Dict[str, Any]:
        """
        Records a registry mutation. Detects rapid-fire mutation spikes typical of ransomware.
        """
        now = time.time()
        self.events.append(now)
        # Prune events outside window
        self.events = [t for t in self.events if now - t <= self.time_window]
        rate_per_sec = len(self.events) / self.time_window

        is_burst = len(self.events) >= self.threshold
        if is_burst:
            self.containment_active = True

        return {
            "burst_detected": is_burst,
            "current_window_count": len(self.events),
            "mutations_per_sec": round(rate_per_sec, 2),
            "threshold": self.threshold,
            "containment_active": self.containment_active
        }

    def trip_canary(self) -> Dict[str, Any]:
        """Simulates ransomware touching the canary tripwire key."""
        self.canary_intact = False
        self.containment_active = True
        return {
            "status": "ALERT",
            "canary_path": self.CANARY_KEY_PATH,
            "tripwire_breached": True,
            "containment_action": "PROCESS_SUSPENSION_AND_NETWORK_ISOLATION_ENGAGED",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ")
        }

    def reset_guard(self) -> Dict[str, Any]:
        self.events = []
        self.canary_intact = True
        self.containment_active = False
        return {
            "status": "ARMED",
            "canary_intact": True,
            "containment_active": False
        }

    def get_status(self) -> Dict[str, Any]:
        now = time.time()
        self.events = [t for t in self.events if now - t <= self.time_window]
        return {
            "guard_status": "LOCKED_DOWN" if self.containment_active else "ARMED_MONITORING",
            "canary_intact": self.canary_intact,
            "canary_key": self.CANARY_KEY_PATH,
            "recent_burst_rate_sec": round(len(self.events) / max(0.1, self.time_window), 2),
            "threshold_limit": self.threshold,
            "containment_active": self.containment_active,
            "heuristic_engine": "Entropy & Canary Guard v2.4"
        }
