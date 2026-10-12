import uuid
import yaml
import os
from typing import Dict, Any, List, Optional
from ..collector.snapshot_diff import SnapshotDiffEngine
from ..storage.repository import EventRepository

class BaselineManager:
    def __init__(self, repository: EventRepository, monitored_keys_path: Optional[str] = None):
        self.repository = repository
        if monitored_keys_path is None:
            monitored_keys_path = os.path.abspath(
                os.path.join(os.path.dirname(__file__), "..", "..", "config", "monitored_keys.yaml")
            )
        self.monitored_keys_path = monitored_keys_path

    def _get_configured_keys(self) -> List[Dict[str, Any]]:
        if not os.path.exists(self.monitored_keys_path):
            return []
        with open(self.monitored_keys_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
        return data.get("monitored_keys", [])

    def take_snapshot(self, label: str = "Manual Baseline") -> str:
        """
        Takes a snapshot of all configured registry keys and stores them in SQLite.
        """
        snapshot_id = str(uuid.uuid4())
        keys = self._get_configured_keys()
        all_values: List[Dict[str, Any]] = []

        for k in keys:
            hive = k["hive"]
            path = k["path"]
            snap = SnapshotDiffEngine.snapshot_key(hive, path)
            for v_name, v_data in snap.get("values", {}).items():
                all_values.append({
                    "hive": hive,
                    "key_path": path,
                    "value_name": v_name,
                    "value_type": v_data["type"],
                    "data_hash": v_data["hash"],
                    "raw_data": v_data["data"]
                })

        self.repository.save_baseline_snapshot(snapshot_id, label, all_values)
        return snapshot_id

    def compute_drift(self, snapshot_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Compares the live registry state against a historical snapshot.
        """
        if snapshot_id is None:
            latest = self.repository.get_latest_baseline()
            if not latest:
                return {"added": [], "modified": [], "deleted": [], "summary": {"added_count": 0, "modified_count": 0, "deleted_count": 0}}
            snapshot_id = latest["snapshot_id"]

        baseline_records = self.repository.get_baseline_values(snapshot_id)
        # Map: (hive, key_path, value_name) -> record
        base_map = {
            (r["hive"], r["key_path"], r["value_name"]): r
            for r in baseline_records
        }

        keys = self._get_configured_keys()
        live_values: Dict[tuple, Dict[str, Any]] = {}

        for k in keys:
            hive = k["hive"]
            path = k["path"]
            snap = SnapshotDiffEngine.snapshot_key(hive, path)
            for v_name, v_data in snap.get("values", {}).items():
                live_values[(hive, path, v_name)] = {
                    "hive": hive,
                    "key_path": path,
                    "value_name": v_name,
                    "value_type": v_data["type"],
                    "data_hash": v_data["hash"],
                    "raw_data": v_data["data"]
                }

        added = []
        modified = []
        deleted = []

        # Check for added or modified
        for key_tuple, live_item in live_values.items():
            if key_tuple not in base_map:
                added.append({
                    "status": "ADDED",
                    "hive": live_item["hive"],
                    "key_path": live_item["key_path"],
                    "value_name": live_item["value_name"],
                    "baseline_data": None,
                    "current_data": live_item["raw_data"]
                })
            else:
                base_item = base_map[key_tuple]
                if base_item["data_hash"] != live_item["data_hash"]:
                    modified.append({
                        "status": "MODIFIED",
                        "hive": live_item["hive"],
                        "key_path": live_item["key_path"],
                        "value_name": live_item["value_name"],
                        "baseline_data": base_item["raw_data"],
                        "current_data": live_item["raw_data"]
                    })

        # Check for deleted
        for key_tuple, base_item in base_map.items():
            if key_tuple not in live_values:
                deleted.append({
                    "status": "DELETED",
                    "hive": base_item["hive"],
                    "key_path": base_item["key_path"],
                    "value_name": base_item["value_name"],
                    "baseline_data": base_item["raw_data"],
                    "current_data": None
                })

        return {
            "snapshot_id": snapshot_id,
            "added": added,
            "modified": modified,
            "deleted": deleted,
            "summary": {
                "added_count": len(added),
                "modified_count": len(modified),
                "deleted_count": len(deleted)
            }
        }
