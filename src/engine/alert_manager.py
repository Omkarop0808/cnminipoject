import uuid
import time
import threading
from datetime import datetime
from typing import Dict, Any, List, Optional, Callable
from pydantic import BaseModel, Field
from .normalizer import NormalizedEvent
from .rule_engine import RuleMatchResult
from ..storage.repository import EventRepository

class Alert(BaseModel):
    alert_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    rule_id: str
    rule_name: str
    severity: str
    mitre_attack: Optional[str] = None
    rationale: str
    matched_conditions: List[Dict[str, Any]] = Field(default_factory=list)
    status: str = "NEW"
    analyst_notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")

class AlertManager:
    def __init__(self, repository: EventRepository, deduplication_window: float = 5.0):
        self.repository = repository
        self.deduplication_window = deduplication_window
        self.lock = threading.Lock()
        self._recent_alerts: Dict[str, float] = {}
        self._subscribers: List[Callable[[Dict[str, Any]], None]] = []

    def subscribe(self, callback: Callable[[Dict[str, Any]], None]):
        """Registers a callback for real-time alert broadcasts (e.g. WebSocket)."""
        with self.lock:
            self._subscribers.append(callback)

    def process_matches(self, event: NormalizedEvent, matches: List[RuleMatchResult]) -> List[Alert]:
        """
        Deduplicates, persists, and broadcasts alerts resulting from rule matches.
        """
        now = time.time()
        emitted_alerts: List[Alert] = []

        # Always persist normalized event first
        self.repository.save_event(event.model_dump())

        # Clean old deduplication entries
        with self.lock:
            self._recent_alerts = {
                k: ts for k, ts in self._recent_alerts.items()
                if now - ts < self.deduplication_window
            }

        for m in matches:
            dedup_key = f"{m.rule_id}:{event.hive}:{event.key_path}:{event.value_name}"
            with self.lock:
                last_seen = self._recent_alerts.get(dedup_key)
                if last_seen and (now - last_seen < self.deduplication_window):
                    # Throttled duplicate alert within sliding window
                    continue
                self._recent_alerts[dedup_key] = now

            alert = Alert(
                event_id=event.event_id,
                rule_id=m.rule_id,
                rule_name=m.rule_name,
                severity=m.severity,
                mitre_attack=m.mitre_attack,
                rationale=m.rationale,
                matched_conditions=m.matched_conditions,
                status="NEW",
                created_at=datetime.utcnow().isoformat() + "Z"
            )

            # Persist alert to SQLite
            self.repository.save_alert(alert.model_dump())
            emitted_alerts.append(alert)

            # Broadcast to subscribers
            payload = {
                "type": "NEW_ALERT",
                "alert": alert.model_dump(),
                "event": event.model_dump()
            }
            with self.lock:
                for sub in self._subscribers:
                    try:
                        sub(payload)
                    except Exception:
                        pass

        return emitted_alerts
