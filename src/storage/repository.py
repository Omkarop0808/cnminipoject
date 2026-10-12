import json
import sqlite3
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from .db import get_db_connection, db_session, DEFAULT_DB_PATH, init_db

class EventRepository:
    def __init__(self, db_path: str = DEFAULT_DB_PATH):
        self.db_path = db_path
        init_db(self.db_path)

    def save_event(self, event_data: Dict[str, Any]) -> None:
        """Persists a normalized security event."""
        with db_session(self.db_path) as conn:
            cursor = conn.cursor()
            process = event_data.get("process", {}) or {}
            cursor.execute("""
            INSERT OR REPLACE INTO normalized_events (
                event_id, source_event_id, timestamp, source, hive, key_path, value_name, value_type,
                previous_data, new_data, operation, process_pid, process_guid, process_image_path,
                process_command_line, process_user, parent_pid, parent_image_path, parent_command_line,
                is_attributed, attribution_confidence, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                event_data["event_id"],
                event_data.get("source_event_id"),
                event_data["timestamp"],
                event_data["source"],
                event_data["hive"],
                event_data["key_path"],
                event_data.get("value_name"),
                event_data.get("value_type"),
                event_data.get("previous_data"),
                event_data.get("new_data"),
                event_data["operation"],
                process.get("pid"),
                process.get("process_guid"),
                process.get("image_path"),
                process.get("command_line"),
                process.get("user_name") or process.get("user_sid"),
                process.get("parent_pid"),
                process.get("parent_image"),
                process.get("parent_command_line"),
                1 if event_data.get("is_attributed") else 0,
                event_data.get("attribution_confidence", "UNATTRIBUTED"),
                datetime.utcnow().isoformat()
            ))

    def save_alert(self, alert_data: Dict[str, Any]) -> None:
        """Persists a security alert."""
        with db_session(self.db_path) as conn:
            cursor = conn.cursor()
            matched = alert_data.get("matched_conditions")
            matched_str = json.dumps(matched) if isinstance(matched, (dict, list)) else str(matched or "[]")
            cursor.execute("""
            INSERT OR REPLACE INTO alerts (
                alert_id, event_id, rule_id, rule_name, severity, mitre_attack,
                rationale, matched_conditions, status, analyst_notes, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                alert_data["alert_id"],
                alert_data["event_id"],
                alert_data["rule_id"],
                alert_data["rule_name"],
                alert_data["severity"],
                alert_data.get("mitre_attack"),
                alert_data["rationale"],
                matched_str,
                alert_data.get("status", "NEW"),
                alert_data.get("analyst_notes"),
                alert_data.get("created_at", datetime.utcnow().isoformat()),
                datetime.utcnow().isoformat()
            ))

    def update_alert_status(self, alert_id: str, status: str, notes: Optional[str] = None) -> bool:
        """Updates triage status and analyst notes for an alert."""
        with db_session(self.db_path) as conn:
            cursor = conn.cursor()
            if notes is not None:
                cursor.execute("""
                UPDATE alerts SET status = ?, analyst_notes = ?, updated_at = ? WHERE alert_id = ?
                """, (status, notes, datetime.utcnow().isoformat(), alert_id))
            else:
                cursor.execute("""
                UPDATE alerts SET status = ?, updated_at = ? WHERE alert_id = ?
                """, (status, datetime.utcnow().isoformat(), alert_id))
            return cursor.rowcount > 0

    def get_alerts(self, page: int = 1, limit: int = 50, severity: Optional[str] = None, 
                   status: Optional[str] = None, search: Optional[str] = None) -> Tuple[List[Dict[str, Any]], int]:
        """Queries alerts joined with normalized event metadata."""
        conn = get_db_connection(self.db_path)
        cursor = conn.cursor()
        
        query = """
        SELECT a.*, e.hive, e.key_path, e.value_name, e.value_type, e.previous_data, e.new_data, 
               e.operation, e.process_pid, e.process_guid, e.process_image_path, e.process_command_line, 
               e.process_user, e.parent_pid, e.parent_image_path, e.parent_command_line, 
               e.is_attributed, e.attribution_confidence, e.source_event_id, e.source
        FROM alerts a
        JOIN normalized_events e ON a.event_id = e.event_id
        WHERE 1=1
        """
        count_query = "SELECT COUNT(*) FROM alerts a JOIN normalized_events e ON a.event_id = e.event_id WHERE 1=1"
        params: List[Any] = []
        
        if severity:
            query += " AND a.severity = ?"
            count_query += " AND a.severity = ?"
            params.append(severity.upper())
            
        if status:
            query += " AND a.status = ?"
            count_query += " AND a.status = ?"
            params.append(status.upper())
            
        if search:
            search_param = f"%{search}%"
            query += " AND (e.key_path LIKE ? OR e.value_name LIKE ? OR e.process_image_path LIKE ? OR a.rule_name LIKE ?)"
            count_query += " AND (e.key_path LIKE ? OR e.value_name LIKE ? OR e.process_image_path LIKE ? OR a.rule_name LIKE ?)"
            params.extend([search_param, search_param, search_param, search_param])
            
        cursor.execute(count_query, params)
        total = cursor.fetchone()[0]
        
        query += " ORDER BY a.created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, (page - 1) * limit])
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        results = []
        for r in rows:
            item = dict(r)
            try:
                item["matched_conditions"] = json.loads(item["matched_conditions"])
            except Exception:
                pass
            results.append(item)
            
        return results, total

    def get_alert_by_id(self, alert_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a single alert with full forensic evidence."""
        conn = get_db_connection(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
        SELECT a.*, e.hive, e.key_path, e.value_name, e.value_type, e.previous_data, e.new_data, 
               e.operation, e.process_pid, e.process_guid, e.process_image_path, e.process_command_line, 
               e.process_user, e.parent_pid, e.parent_image_path, e.parent_command_line, 
               e.is_attributed, e.attribution_confidence, e.source_event_id, e.source
        FROM alerts a
        JOIN normalized_events e ON a.event_id = e.event_id
        WHERE a.alert_id = ?
        """, (alert_id,))
        row = cursor.fetchone()
        if not row:
            return None
        item = dict(row)
        try:
            item["matched_conditions"] = json.loads(item["matched_conditions"])
        except Exception:
            pass
        return item

    def get_events(self, limit: int = 50, offset: int = 0, key_path: Optional[str] = None, 
                   operation: Optional[str] = None, source: Optional[str] = None,
                   search: Optional[str] = None) -> Tuple[List[Dict[str, Any]], int]:
        """Queries normalized raw telemetry events."""
        conn = get_db_connection(self.db_path)
        cursor = conn.cursor()
        query = "SELECT * FROM normalized_events WHERE 1=1"
        count_query = "SELECT COUNT(*) FROM normalized_events WHERE 1=1"
        params: List[Any] = []
        
        if key_path:
            query += " AND key_path LIKE ?"
            count_query += " AND key_path LIKE ?"
            params.append(f"%{key_path}%")
            
        if operation:
            query += " AND operation = ?"
            count_query += " AND operation = ?"
            params.append(operation.upper())

        if source:
            query += " AND source = ?"
            count_query += " AND source = ?"
            params.append(source.upper())

        if search:
            search_param = f"%{search}%"
            query += " AND (key_path LIKE ? OR value_name LIKE ? OR process_image_path LIKE ? OR process_command_line LIKE ?)"
            count_query += " AND (key_path LIKE ? OR value_name LIKE ? OR process_image_path LIKE ? OR process_command_line LIKE ?)"
            params.extend([search_param, search_param, search_param, search_param])
            
        cursor.execute(count_query, params)
        total = cursor.fetchone()[0]
        
        query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [dict(r) for r in rows], total

    def save_baseline_snapshot(self, snapshot_id: str, label: str, values: List[Dict[str, Any]]) -> None:
        """Stores a full registry baseline snapshot."""
        with db_session(self.db_path) as conn:
            cursor = conn.cursor()
            keys_count = len({(v["hive"], v["key_path"]) for v in values})
            cursor.execute("""
            INSERT INTO baseline_snapshots (snapshot_id, created_at, total_keys, total_values, label)
            VALUES (?, ?, ?, ?, ?)
            """, (snapshot_id, datetime.utcnow().isoformat(), keys_count, len(values), label))
            
            cursor.executemany("""
            INSERT INTO baseline_values (snapshot_id, hive, key_path, value_name, value_type, data_hash, raw_data)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, [
                (snapshot_id, v["hive"], v["key_path"], v["value_name"], v["value_type"], v["data_hash"], v.get("raw_data"))
                for v in values
            ])

    def get_latest_baseline(self) -> Optional[Dict[str, Any]]:
        """Retrieves metadata of the most recent baseline snapshot."""
        conn = get_db_connection(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM baseline_snapshots ORDER BY created_at DESC LIMIT 1")
        row = cursor.fetchone()
        return dict(row) if row else None

    def get_baseline_values(self, snapshot_id: str) -> List[Dict[str, Any]]:
        """Retrieves all values belonging to a baseline snapshot."""
        conn = get_db_connection(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM baseline_values WHERE snapshot_id = ?", (snapshot_id,))
        return [dict(r) for r in cursor.fetchall()]

    def record_test_run(self, run_id: str, test_name: str, started_at: str, 
                        status: str, total_injected: int, total_detected: int, 
                        avg_latency_ms: float, details: str) -> None:
        """Records the results of an automated simulation test run."""
        with db_session(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT OR REPLACE INTO audit_test_runs (
                run_id, test_name, started_at, completed_at, status, total_injected, total_detected, avg_latency_ms, details
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                run_id, test_name, started_at, datetime.utcnow().isoformat(), status,
                total_injected, total_detected, avg_latency_ms, details
            ))
