# Windows Registry-Based Host Security Monitor
## Document 03: Detailed Technical Specifications and Architecture

**Document ID:** TECH-SPEC-WINREG-2026-V1  
**Project:** Windows Registry-Based Host Security Monitor (WinReg-HIDS)  
**System Architecture:** Layered Asynchronous Event-Driven Pipeline  
**Target Environment:** Windows 10/11 x64, Python 3.11+, SQLite WAL, FastAPI, React 19 + TypeScript  
**Status:** Approved for Implementation  

---

### 1. Architectural System Overview

The WinReg-HIDS architecture is structured into six decoupled, pipeline-connected layers:
1. **Telemetry Ingestion Layer:** Native Win32 asynchronous change notification loops paired with Windows Event Log (Sysmon / Security) consumers.
2. **Normalization & Correlation Layer:** Ingestion queue translating disparate raw telemetry into typed, canonical schemas and resolving process context.
3. **Detection Engine Layer:** High-performance, AST-based rule evaluator applying boolean condition trees, regex pattern matching, and LOLBin heuristics.
4. **Persistence & Alert Management Layer:** Concurrent SQLite database with Write-Ahead Logging (WAL) and alert deduplication.
5. **API & Event Streaming Layer:** Asynchronous FastAPI service exposing RESTful query endpoints and high-speed WebSockets.
6. **Presentation Layer:** React + TypeScript single-page application engineered for cyber-defense operational workflows.

```
+----------------------------------------------------------------------------------------------------+
|                                    1. TELEMETRY INGESTION LAYER                                    |
|                                                                                                    |
|  [Win32 Registry Watcher Thread Pool]                   [Sysmon / EVTX Subscription Worker]        |
|  - RegOpenKeyExW (KEY_NOTIFY | KEY_READ)                - EvtSubscribe / wevtutil Query            |
|  - CreateEventW & WaitForMultipleObjects                - Microsoft-Windows-Sysmon/Operational    |
|  - Snapshot Diffing Engine (winreg.EnumKey/Value)       - Event IDs: 1 (Proc), 12, 13, 14 (Reg)   |
+------------------------------------+------------------------------------+--------------------------+
                                     |                                    |
                                     v                                    v
+----------------------------------------------------------------------------------------------------+
|                               2. NORMALIZATION & CORRELATION LAYER                                 |
|                                                                                                    |
|  - Process Lineage Cache: LRU Map [PID:Timestamp] -> (Image, CommandLine, ParentImage, User)       |
|  - Normalization Pipe: Raw OS Event -> Canonical NormalizedEvent (UUID, ISO-8601, Schema v1)       |
|  - Path Canonicalization: Case normalization, env var resolution (%TEMP%, %APPDATA%)              |
+----------------------------------------------------+-----------------------------------------------+
                                                     |
                                                     v
+----------------------------------------------------------------------------------------------------+
|                                    3. DETECTION ENGINE LAYER                                       |
|                                                                                                    |
|  - Rule Registry: In-Memory Hot-Reloadable YAML Rules                                              |
|  - Condition Evaluator: Recursive Boolean Tree (all_of, any_of, none_of)                           |
|  - Heuristic Matchers: Path IsWritableDir, Value ContainsLOLBin, Value RegexMatch                 |
|  - Match Explanation Generator: Produces forensic rationale string and match proof                 |
+----------------------------------------------------+-----------------------------------------------+
                                                     |
                                                     v
+----------------------------------------------------------------------------------------------------+
|                             4. PERSISTENCE & ALERT MANAGEMENT LAYER                                |
|                                                                                                    |
|  - SQLite WAL Database: raw_events, normalized_events, alerts, rules_state, baselines              |
|  - Sliding-Window Deduplication Filter: Throttles identical events within 5.0s window              |
|  - In-Memory Event Ring Buffer: Decouples ingestion spikes from disk I/O                           |
+----------------------------------------------------+-----------------------------------------------+
                                                     |
                                                     v
+----------------------------------------------------------------------------------------------------+
|                                 5. API & EVENT STREAMING LAYER                                     |
|                                                                                                    |
|  - FastAPI Asynchronous Application (ASGI via Uvicorn)                                             |
|  - REST Endpoints: /api/v1/alerts, /api/v1/events, /api/v1/rules, /api/v1/baseline, /api/v1/test   |
|  - WebSocket Telemetry Hub: /ws/telemetry with broadcast queue and connection pool management      |
+----------------------------------------------------+-----------------------------------------------+
                                                     |
                                                     v
+----------------------------------------------------------------------------------------------------+
|                                      6. PRESENTATION LAYER                                         |
|                                                                                                    |
|  - React 19 + TypeScript + Vite + Tailwind CSS Console                                             |
|  - Views: Alert Feed, Forensic Drawer, Event Search, Baseline Diff, Rule Studio, Simulation Lab    |
+----------------------------------------------------------------------------------------------------+
```

---

### 2. Component Specifications

#### 2.1 Component A: Registry Surveillance Worker (`src/collector/registry_watcher.py`)
- **Core Technology:** Python `ctypes` bindings to `advapi32.dll` and `kernel32.dll`, paired with `winreg`.
- **API Call Sequence:**
  ```python
  # 1. Open Key Handle with NOTIFY and READ rights
  hKey = winreg.OpenKey(hRoot, subkey_path, 0, winreg.KEY_NOTIFY | winreg.KEY_READ)

  # 2. Create Win32 Manual-Reset Event
  hEvent = kernel32.CreateEventW(None, True, False, None)

  # 3. Register Asynchronous Notification Filter
  filter_flags = (REG_NOTIFY_CHANGE_NAME | 
                  REG_NOTIFY_CHANGE_ATTRIBUTES | 
                  REG_NOTIFY_CHANGE_LAST_SET | 
                  REG_NOTIFY_CHANGE_SECURITY)
  advapi32.RegNotifyChangeKeyValue(hKey, True, filter_flags, hEvent, True)

  # 4. Wait for event trigger with timeout (allows clean thread cancellation)
  wait_res = kernel32.WaitForSingleObject(hEvent, 1000)
  ```
- **Differential Snapshotting Logic:**
  - `RegNotifyChangeKeyValue` informs the process *that* a change occurred within a key or subtree, but does not provide *which* specific value changed.
  - To pinpoint the change, the worker maintains an in-memory key state map:
    $$\text{State}(K) = \{ \text{val\_name}: (\text{val\_type}, \text{hash}(\text{val\_data})) \}$$
  - Upon receiving the event signal, the worker scans the affected key:
    - Added values: Values in current scan absent in previous state $\rightarrow$ `VALUE_SET` (New)
    - Modified values: Values where data hash changed $\rightarrow$ `VALUE_SET` (Modified)
    - Deleted values: Values in previous state absent in current scan $\rightarrow$ `VALUE_DELETED`
    - Subkey additions/removals: Re-enumerates subkeys $\rightarrow$ `KEY_CREATED` / `KEY_DELETED`
  - Resets the Win32 event and re-arms `RegNotifyChangeKeyValue`.

#### 2.2 Component B: Sysmon / EVTX Telemetry Ingestor (`src/collector/sysmon_watcher.py`)
- **Subscription Method:** Reads from the Windows Event Channel `Microsoft-Windows-Sysmon/Operational` via `win32evtlog` or polling `wevtutil qe` XML stream.
- **Process Lineage Resolver (`src/collector/process_cache.py`):**
  - Maintains a time-indexed LRU cache of process creation records:
    $$\text{ProcCache}[(\text{PID}, \text{ProcessGuid})] = \{\text{Image}, \text{CommandLine}, \text{ParentPID}, \text{ParentImage}, \text{User}\}$$
  - When Sysmon Event ID 1 (Process Create) arrives, cache is updated.
  - When Sysmon Event ID 12/13/14 arrives, event XML contains:
    - `<ProcessId>`: ID of the modifying process.
    - `<Image>`: Binary path of the modifying process.
    - `<TargetObject>`: Full Registry path modified.
    - `<Details>`: Value data written.
  - The resolver pairs the Registry event with the full cached process context (including parent lineage and command-line arguments).

#### 2.3 Component C: Event Normalizer & Schema (`src/engine/normalizer.py`)
The Normalizer guarantees that whether an event was synthesized by the Win32 diff engine or parsed from Sysmon XML, it produces identical, strictly validated Pydantic structures.

```python
from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
import uuid

class ProcessMetadata(BaseModel):
    pid: Optional[int] = None
    image_name: Optional[str] = None
    image_path: Optional[str] = None
    command_line: Optional[str] = None
    parent_pid: Optional[int] = None
    parent_image: Optional[str] = None
    user_sid: Optional[str] = None
    user_name: Optional[str] = None

class NormalizedEvent(BaseModel):
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    source: Literal["WIN32_NOTIFY", "SYSMON", "SECURITY_AUDIT", "BASELINE_SCAN"]
    hive: Literal["HKLM", "HKCU"]
    key_path: str
    value_name: Optional[str] = None
    value_type: Optional[str] = None
    previous_data: Optional[str] = None
    new_data: Optional[str] = None
    operation: Literal["CREATE", "MODIFY", "DELETE", "RENAME"]
    process: ProcessMetadata = Field(default_factory=ProcessMetadata)
    is_attributed: bool = False
```

#### 2.4 Component D: Declarative Rule Engine (`src/engine/rule_engine.py`)
The Rule Engine executes in-memory with zero disk lookups. Rules are declared in YAML with the following syntax:

```yaml
rules:
  - rule_id: "WR-PERSIST-001"
    name: "Run Key Executable in User-Writable Directory"
    severity: "CRITICAL"
    mitre_attack: "T1547.001"
    description: "Detects creation of a startup Run entry pointing to binaries located in writable directories."
    rationale: "Adversaries routinely drop persistence payloads into %TEMP%, %APPDATA%, or Public directories where standard user accounts have write privileges."
    conditions:
      all_of:
        - field: "key_path"
          operator: "contains_ignore_case"
          value: "CurrentVersion\\Run"
        - field: "operation"
          operator: "in"
          value: ["CREATE", "MODIFY"]
        - any_of:
            - field: "new_data"
              operator: "regex"
              value: "(?i)(%APPDATA%|%TEMP%|Users\\\\Public|AppData\\\\Local\\\\Temp).+\\.(exe|dll|bat|vbs|ps1|js)"
            - field: "new_data"
              operator: "regex"
              value: "(?i)(powershell|cmd|mshta|cscript|wscript|certutil|rundll32)\\.exe"
    suppression:
      - field: "process.image_name"
        operator: "equals_ignore_case"
        value: "trusted_installer.exe"
```

- **Built-in Condition Operators:**
  - `equals` / `equals_ignore_case`
  - `contains` / `contains_ignore_case`
  - `starts_with` / `ends_with`
  - `regex` (Compiled Python `re.Pattern` with cached execution)
  - `in` / `not_in`
  - `in_writable_path` (Built-in helper evaluating known Windows user-writable folders)

---

### 3. Database Schema (SQLite WAL DDL)

The database file is located at `C:\dev\CNminiproject\winreg_hids.db`.

```sql
-- Enable High-Throughput Write-Ahead Logging
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;

-- 1. Normalized Security Events Table
CREATE TABLE IF NOT EXISTS normalized_events (
    event_id TEXT PRIMARY KEY,
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
    process_image_path TEXT,
    process_command_line TEXT,
    process_user TEXT,
    parent_pid INTEGER,
    parent_image_path TEXT,
    is_attributed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_events_timestamp ON normalized_events (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_key_path ON normalized_events (key_path);
CREATE INDEX IF NOT EXISTS idx_events_operation ON normalized_events (operation);
CREATE INDEX IF NOT EXISTS idx_events_proc_img ON normalized_events (process_image_path);

-- 2. Security Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
    alert_id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    rule_id TEXT NOT NULL,
    rule_name TEXT NOT NULL,
    severity TEXT NOT NULL,
    mitre_attack TEXT,
    rationale TEXT NOT NULL,
    matched_conditions TEXT NOT NULL, -- JSON string of condition breakdown
    status TEXT NOT NULL DEFAULT 'NEW', -- NEW, INVESTIGATING, FALSE_POSITIVE, RESOLVED
    analyst_notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (event_id) REFERENCES normalized_events(event_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts (severity);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts (status);
CREATE INDEX IF NOT EXISTS idx_alerts_rule ON alerts (rule_id);

-- 3. System Baseline Snapshots Table
CREATE TABLE IF NOT EXISTS baseline_snapshots (
    snapshot_id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    total_keys INTEGER NOT NULL,
    total_values INTEGER NOT NULL,
    label TEXT
);

-- 4. Baseline Values Table
CREATE TABLE IF NOT EXISTS baseline_values (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    snapshot_id TEXT NOT NULL,
    hive TEXT NOT NULL,
    key_path TEXT NOT NULL,
    value_name TEXT NOT NULL,
    value_type TEXT NOT NULL,
    data_hash TEXT NOT NULL, -- SHA-256 of value data
    raw_data TEXT,
    FOREIGN KEY (snapshot_id) REFERENCES baseline_snapshots(snapshot_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_base_vals_lookup ON baseline_values (snapshot_id, hive, key_path, value_name);

-- 5. Audit & Simulation Test Runs Table
CREATE TABLE IF NOT EXISTS audit_test_runs (
    run_id TEXT PRIMARY KEY,
    test_name TEXT NOT NULL,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    status TEXT NOT NULL, -- RUNNING, PASSED, FAILED
    total_injected INTEGER NOT NULL,
    total_detected INTEGER NOT NULL,
    avg_latency_ms REAL,
    details TEXT
);
```

---

### 4. REST API Endpoint Specifications

All endpoints prefix: `/api/v1`

| HTTP Method | Route | Description | Request Payload | Response Schema |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/alerts` | Query alerts with pagination, severity filter, status, and search | Query params: `page`, `limit`, `severity`, `status`, `search` | `{ items: Alert[], total: int, page: int, pages: int }` |
| `GET` | `/alerts/{alert_id}` | Retrieve comprehensive forensic alert package | None | `AlertDetail` (includes full Event and Process Lineage) |
| `PATCH` | `/alerts/{alert_id}` | Update triage status and notes | `{ status: str, analyst_notes: str }` | `Alert` |
| `GET` | `/events` | Query normalized raw event telemetry stream | Query params: `limit`, `offset`, `key_path`, `operation` | `{ items: NormalizedEvent[], total: int }` |
| `GET` | `/rules` | List all active detection rules, metadata, and hit counts | None | `{ rules: RuleDetail[] }` |
| `POST` | `/rules/reload` | Reload YAML detection rules from disk | None | `{ status: "reloaded", active_rules: int }` |
| `POST` | `/baseline/snapshot` | Trigger an immediate live Registry baseline snapshot | `{ label: str }` | `{ snapshot_id: str, keys: int, values: int }` |
| `GET` | `/baseline/diff` | Compare current Registry state against latest snapshot | Query params: `snapshot_id` (optional) | `{ added: int, modified: int, deleted: int, diffs: DiffItem[] }` |
| `GET` | `/system/status` | Ingestion metrics, watcher thread states, CPU/memory stats | None | `SystemHealthMetrics` |
| `POST` | `/test/simulate` | Execute harmless persistence mutation test | `{ test_vector: "RUN_KEY_TEMP" \| "IFEO_DEBUGGER" }` | `{ test_id: str, status: "completed", detected: bool, latency_ms: float }` |
| `WS` | `/ws/telemetry` | WebSocket stream broadcasting real-time events and alerts | None | Live JSON message stream |

---

### 5. Resiliency, Thread Safety, and Error Handling

1. **Decoupled Queue Architecture:**
   - Watcher threads NEVER write directly to SQLite or perform network calls.
   - Raw events are pushed to an asynchronous in-memory `asyncio.Queue` (capacity: 20,000 items).
   - A dedicated `StorageWorker` consumes the queue and issues batched database inserts using parameterized transactions, preventing database locks.
2. **Win32 Handle Cleanup via Context Managers:**
   - All `winreg.HKEY` and Win32 event handles are wrapped in Python `try...finally` or custom context managers to guarantee immediate handle closure upon exceptions, eliminating OS resource leaks.
3. **Graceful Degradation:**
   - If Sysmon service is stopped or uninstalled, the system transitions to `WIN32_ONLY` mode, continuing real-time detection without crashing, marking process fields as `UNATTRIBUTED`.
4. **Self-Healing Watcher Threads:**
   - Each registry key watcher loop is supervised by a `WatcherSupervisor` thread. If an unhandled exception occurs (e.g. transient Windows registry lock), the supervisor logs the stack trace and restarts the thread with an exponential backoff (1s, 2s, 4s).
