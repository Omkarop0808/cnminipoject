import sqlite3
import os
import threading
from typing import Generator
from contextlib import contextmanager

DEFAULT_DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "winreg_hids.db"))

_local = threading.local()

def get_db_connection(db_path: str = DEFAULT_DB_PATH) -> sqlite3.Connection:
    """Returns a thread-local SQLite connection configured with WAL mode."""
    conn = getattr(_local, "conn", None)
    current_path = getattr(_local, "db_path", None)
    if conn is None or current_path != db_path:
        conn = sqlite3.connect(db_path, check_same_thread=False, timeout=10.0)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode = WAL;")
        conn.execute("PRAGMA synchronous = NORMAL;")
        conn.execute("PRAGMA foreign_keys = ON;")
        conn.execute("PRAGMA busy_timeout = 5000;")
        _local.conn = conn
        _local.db_path = db_path
    return conn

@contextmanager
def db_session(db_path: str = DEFAULT_DB_PATH) -> Generator[sqlite3.Connection, None, None]:
    conn = get_db_connection(db_path)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise

def init_db(db_path: str = DEFAULT_DB_PATH) -> None:
    """Initializes the database schema with WAL mode and indexing."""
    os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)
    with db_session(db_path) as conn:
        cursor = conn.cursor()
        
        # 1. Normalized Security Events Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS normalized_events (
            event_id TEXT PRIMARY KEY,
            source_event_id TEXT,
            timestamp TEXT NOT NULL,
            source TEXT NOT NULL,
            hive TEXT NOT NULL,
            key_path TEXT NOT NULL,
            value_name TEXT,
            value_type TEXT,
            previous_data TEXT,
            new_data TEXT,
            operation TEXT NOT NULL,
            process_pid INTEGER,
            process_guid TEXT,
            process_image_path TEXT,
            process_command_line TEXT,
            process_user TEXT,
            parent_pid INTEGER,
            parent_image_path TEXT,
            parent_command_line TEXT,
            is_attributed INTEGER NOT NULL DEFAULT 0,
            attribution_confidence TEXT NOT NULL DEFAULT 'UNATTRIBUTED',
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        """)

        # Idempotent column migration for existing databases
        cursor.execute("PRAGMA table_info(normalized_events);")
        existing_cols = {row[1] for row in cursor.fetchall()}
        for col_name, col_def in [
            ("process_guid", "TEXT"),
            ("parent_command_line", "TEXT"),
            ("source_event_id", "TEXT"),
            ("attribution_confidence", "TEXT NOT NULL DEFAULT 'UNATTRIBUTED'")
        ]:
            if col_name not in existing_cols:
                cursor.execute(f"ALTER TABLE normalized_events ADD COLUMN {col_name} {col_def};")

        cursor.execute("CREATE INDEX IF NOT EXISTS idx_events_timestamp ON normalized_events (timestamp DESC);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_events_key_path ON normalized_events (key_path);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_events_operation ON normalized_events (operation);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_events_proc_img ON normalized_events (process_image_path);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_events_attrib ON normalized_events (attribution_confidence);")

        # 2. Security Alerts Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS alerts (
            alert_id TEXT PRIMARY KEY,
            event_id TEXT NOT NULL,
            rule_id TEXT NOT NULL,
            rule_name TEXT NOT NULL,
            severity TEXT NOT NULL,
            mitre_attack TEXT,
            rationale TEXT NOT NULL,
            matched_conditions TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'NEW',
            analyst_notes TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (event_id) REFERENCES normalized_events(event_id) ON DELETE CASCADE
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts (created_at DESC);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts (severity);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts (status);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_alerts_rule ON alerts (rule_id);")

        # 3. System Baseline Snapshots Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS baseline_snapshots (
            snapshot_id TEXT PRIMARY KEY,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            total_keys INTEGER NOT NULL,
            total_values INTEGER NOT NULL,
            label TEXT
        );
        """)

        # 4. Baseline Values Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS baseline_values (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            snapshot_id TEXT NOT NULL,
            hive TEXT NOT NULL,
            key_path TEXT NOT NULL,
            value_name TEXT NOT NULL,
            value_type TEXT NOT NULL,
            data_hash TEXT NOT NULL,
            raw_data TEXT,
            FOREIGN KEY (snapshot_id) REFERENCES baseline_snapshots(snapshot_id) ON DELETE CASCADE
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_base_vals_lookup ON baseline_values (snapshot_id, hive, key_path, value_name);")

        # 5. Audit & Simulation Test Runs Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS audit_test_runs (
            run_id TEXT PRIMARY KEY,
            test_name TEXT NOT NULL,
            started_at TEXT NOT NULL,
            completed_at TEXT,
            status TEXT NOT NULL,
            total_injected INTEGER NOT NULL,
            total_detected INTEGER NOT NULL,
            avg_latency_ms REAL,
            details TEXT
        );
        """)
