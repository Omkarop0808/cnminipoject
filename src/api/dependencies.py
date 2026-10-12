from typing import Optional, Callable
from ..storage.db import DEFAULT_DB_PATH
from ..storage.repository import EventRepository
from ..engine.rule_engine import RuleEngine
from ..engine.alert_manager import AlertManager
from ..engine.baseline_manager import BaselineManager
from ..engine.simulator import ThreatSimulator

# Singleton shared dependencies across all API routes and background watchers
repository = EventRepository(DEFAULT_DB_PATH)
rule_engine = RuleEngine()
alert_manager = AlertManager(repository=repository)
baseline_mgr = BaselineManager(repository=repository)
simulator = ThreatSimulator(rule_engine=rule_engine, repository=repository)

_active_watchers_getter: Optional[Callable[[], int]] = None

def set_active_watchers_getter(getter: Callable[[], int]) -> None:
    global _active_watchers_getter
    _active_watchers_getter = getter

def get_active_watchers_count() -> int:
    if _active_watchers_getter:
        try:
            return _active_watchers_getter()
        except Exception:
            return 0
    return 0
