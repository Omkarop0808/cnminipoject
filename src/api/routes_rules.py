from fastapi import APIRouter
from .dependencies import rule_engine

router = APIRouter(prefix="/rules", tags=["Rules"])

@router.get("")
def list_rules():
    return {
        "rules": rule_engine.rules,
        "total": len(rule_engine.rules)
    }

@router.post("/reload")
def reload_rules():
    count = rule_engine.load_rules()
    return {
        "status": "reloaded",
        "active_rules_count": count
    }
