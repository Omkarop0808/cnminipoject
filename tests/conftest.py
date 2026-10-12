import os
import tempfile
import pytest
from src.storage.db import init_db
from src.storage.repository import EventRepository
from src.engine.rule_engine import RuleEngine

@pytest.fixture
def temp_db_path():
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        path = f.name
    init_db(path)
    yield path
    try:
        os.remove(path)
    except Exception:
        pass

@pytest.fixture
def test_repo(temp_db_path):
    return EventRepository(temp_db_path)

@pytest.fixture
def rule_engine():
    return RuleEngine()
