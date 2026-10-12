from src.engine.simulator import ThreatSimulator
from src.engine.rule_engine import RuleEngine
from src.storage.repository import EventRepository

def test_threat_simulator_run_key(test_repo: EventRepository, rule_engine: RuleEngine):
    simulator = ThreatSimulator(rule_engine=rule_engine, repository=test_repo)
    result = simulator.run_simulation(vector_name="RUN_KEY_TEMP", auto_cleanup=True)

    assert result["status"] == "PASSED"
    assert result["detected"] is True
    assert result["matched_rule"] == "WR-PERSIST-001"
    assert result["latency_ms"] < 200.0
    assert result["cleaned_up"] is True
