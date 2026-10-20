import asyncio
import os
import yaml
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from ..storage.db import init_db
from ..storage.repository import EventRepository
from ..engine.rule_engine import RuleEngine
from ..engine.alert_manager import AlertManager
from ..engine.normalizer import normalize_raw_event
from ..collector.process_cache import process_cache
from ..collector.registry_watcher import RegistryWatcher
from ..collector.sysmon_watcher import SysmonWatcherThread
from .websocket_hub import websocket_hub
from .dependencies import (
    repository,
    rule_engine,
    alert_manager,
    set_active_watchers_getter
)
from .routes_alerts import router as alerts_router
from .routes_events import router as events_router
from .routes_rules import router as rules_router
from .routes_security import router as security_router
from .routes_system import router as system_router

# Global Watcher instances
_registry_watcher: RegistryWatcher = None
_sysmon_watcher: SysmonWatcherThread = None

def handle_registry_events(raw_events: list):
    """Callback invoked when Win32 Registry watcher detects mutations."""
    for raw in raw_events:
        # Best effort resolve executing process if PID is in raw event, else check current/cached
        pid = raw.get("process_pid")
        if not pid and str(raw.get("value_name", "")).startswith("WinReg_Test_"):
            proc_info = process_cache.get_current_process_info()
            proc_info["attribution_confidence"] = "INFERRED (Simulation)"
        else:
            proc_info = process_cache.resolve_pid(pid) if pid else None
        norm_event = normalize_raw_event(raw, proc_info)
        matches = rule_engine.evaluate_event(norm_event)
        alert_manager.process_matches(norm_event, matches)
        # Broadcast raw event to WebSocket feed as well
        websocket_hub.broadcast_sync({
            "type": "NEW_EVENT",
            "event": norm_event.model_dump()
        })

def handle_sysmon_event(raw_event: dict):
    """Callback invoked when Sysmon watcher detects registry events."""
    pid = raw_event.get("process_pid")
    proc_info = process_cache.resolve_pid(pid) if pid else None
    norm_event = normalize_raw_event(raw_event, proc_info)
    matches = rule_engine.evaluate_event(norm_event)
    alert_manager.process_matches(norm_event, matches)
    websocket_hub.broadcast_sync({
        "type": "NEW_EVENT",
        "event": norm_event.model_dump()
    })

@asynccontextmanager
async def lifespan(app: FastAPI):
    global _registry_watcher, _sysmon_watcher
    # 1. Initialize SQLite Database
    init_db()

    # 2. Wire WebSocket Hub loop
    loop = asyncio.get_running_loop()
    websocket_hub.set_loop(loop)
    alert_manager.subscribe(websocket_hub.broadcast_sync)

    # 3. Load Monitored Keys Configuration
    keys_config_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "config", "monitored_keys.yaml")
    )
    monitored_keys = []
    if os.path.exists(keys_config_path):
        with open(keys_config_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
            monitored_keys = data.get("monitored_keys", [])

    # 4. Start Win32 Registry Watcher
    if monitored_keys:
        _registry_watcher = RegistryWatcher(monitored_keys, handle_registry_events)
        _registry_watcher.start()
        set_active_watchers_getter(lambda: _registry_watcher.active_watchers_count() if _registry_watcher else 0)

    # 5. Start Sysmon Watcher
    _sysmon_watcher = SysmonWatcherThread(handle_sysmon_event)
    _sysmon_watcher.start()

    yield

    # Clean shutdown
    if _registry_watcher:
        _registry_watcher.stop()
    if _sysmon_watcher:
        _sysmon_watcher.stop_event.set()

def create_app() -> FastAPI:
    app = FastAPI(
        title="WinReg-HIDS API",
        version="1.0.0",
        description="REST API and WebSocket Telemetry Hub for Windows Registry Host Security Monitor",
        lifespan=lifespan
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mount API routers
    app.include_router(alerts_router, prefix="/api/v1")
    app.include_router(events_router, prefix="/api/v1")
    app.include_router(rules_router, prefix="/api/v1")
    app.include_router(security_router, prefix="/api/v1")
    app.include_router(system_router, prefix="/api/v1")

    # WebSocket Telemetry Endpoint
    @app.websocket("/ws/telemetry")
    async def websocket_endpoint(websocket: WebSocket):
        await websocket_hub.connect(websocket)
        try:
            # Send initial greeting/status
            await websocket.send_json({
                "type": "CONNECTION_ESTABLISHED",
                "message": "Connected to WinReg-HIDS Telemetry Stream"
            })
            while True:
                # Keep connection alive receiving ping or messages
                data = await websocket.receive_text()
                if data == "ping":
                    await websocket.send_text("pong")
        except WebSocketDisconnect:
            websocket_hub.disconnect(websocket)
        except Exception:
            websocket_hub.disconnect(websocket)

    return app

app = create_app()
