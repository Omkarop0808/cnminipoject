import os
import psutil
from fastapi import APIRouter, Body, Query
from typing import Optional, Dict, Any
from .dependencies import repository, baseline_mgr, simulator, get_active_watchers_count

router = APIRouter(prefix="", tags=["System"])

@router.get("/system/status")
def get_system_status():
    proc = psutil.Process()
    mem_info = proc.memory_info()
    return {
        "status": "HEALTHY",
        "service": "WinReg-HIDS",
        "version": "1.0.0",
        "cpu_percent": proc.cpu_percent(interval=0.1),
        "memory_rss_mb": round(mem_info.rss / (1024 * 1024), 2),
        "db_path": repository.db_path,
        "threads_count": proc.num_threads(),
        "active_watchers": get_active_watchers_count()
    }

@router.post("/baseline/snapshot")
def take_baseline_snapshot(payload: Dict[str, Any] = Body(default={})):
    label = payload.get("label", "Manual User Snapshot")
    snapshot_id = baseline_mgr.take_snapshot(label=label)
    return {
        "status": "success",
        "snapshot_id": snapshot_id,
        "label": label
    }

@router.get("/baseline/diff")
def get_baseline_drift(snapshot_id: Optional[str] = Query(None)):
    drift = baseline_mgr.compute_drift(snapshot_id)
    return drift

@router.post("/test/simulate")
def run_simulation(payload: Dict[str, Any] = Body(default={})):
    vector = payload.get("test_vector", "RUN_KEY_TEMP")
    auto_cleanup = payload.get("auto_cleanup", True)
    result = simulator.run_simulation(vector_name=vector, auto_cleanup=auto_cleanup)
    return result
