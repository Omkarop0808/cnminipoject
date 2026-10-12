# Windows Registry-Based Host Security Monitor
## Document 02: Product Requirements Document (PRD)

**Document ID:** PRD-WINREG-2026-V1  
**Project:** Windows Registry-Based Host Security Monitor (WinReg-HIDS)  
**Target Release:** Version 1.0.0-MVP  
**Status:** Approved for Implementation  
**Author:** Lead Security Systems Architect & Core Engineering Team  

---

### 1. Product Overview and Objectives

#### 1.1 Product Mission
To provide security analysts, incident responders, and system administrators with a lightweight, dependable, and explainable host monitoring system that provides near real-time visibility into high-risk Windows Registry modifications, automates threat detection via deterministic rules, attributes changes to culprit processes, and delivers forensic evidence without enterprise agent overhead.

#### 1.2 Core Success Metrics (KPIs)
1. **Detection Accuracy:** $\ge 95\%$ true-positive detection rate across standardized test persistence vectors.
2. **False-Positive Resistance:** $\le 2\%$ false-positive rate under simulated benign workloads (standard software installations, browser updates).
3. **Event-to-Alert Latency:** End-to-end processing latency $\le 50\text{ ms}$ from Windows event capture to UI WebSocket notification.
4. **Host Resource Utilization:** Average background CPU consumption $\le 1.5\%$ on a standard quad-core Windows endpoint; working set memory $\le 100\text{ MB}$.
5. **Process Attribution Coverage:** Successful process correlation $\ge 85\%$ when Sysmon or Windows Advanced Audit logging is enabled.

---

### 2. Functional Requirements (FR)

#### FR-1: Real-Time Registry Surveillance Engine
- **FR-1.1:** The system shall continuously monitor designated high-value Registry keys within both `HKEY_LOCAL_MACHINE` (HKLM) and `HKEY_CURRENT_USER` (HKCU).
- **FR-1.2:** The monitoring engine shall capture four core atomic operations:
  - `KEY_CREATED`: Creation of a new Registry subkey.
  - `KEY_DELETED`: Deletion of an existing Registry subkey.
  - `VALUE_SET`: Creation of a new name-value pair or modification of an existing value's data or type.
  - `VALUE_DELETED`: Removal of an existing name-value pair.
- **FR-1.3:** The surveillance engine shall support both native Win32 asynchronous notification mechanisms (`RegNotifyChangeKeyValue` with `REG_NOTIFY_CHANGE_NAME` and `REG_NOTIFY_CHANGE_LAST_SET`) and polling-based differential auditing.
- **FR-1.4:** The default monitored surveillance scope shall include, at minimum:
  - `HKLM\Software\Microsoft\Windows\CurrentVersion\Run` and `RunOnce`
  - `HKCU\Software\Microsoft\Windows\CurrentVersion\Run` and `RunOnce`
  - `HKLM\Software\Microsoft\Windows\CurrentVersion\Policies\Explorer\Run`
  - `HKCU\Software\Microsoft\Windows\CurrentVersion\Policies\Explorer\Run`
  - `HKLM\Software\Microsoft\Windows NT\CurrentVersion\Winlogon` (Userinit, Shell, Taskman)
  - `HKLM\Software\Microsoft\Windows NT\CurrentVersion\Image File Execution Options` (Debugger values, SilentProcessExit)
  - `HKLM\System\CurrentControlSet\Services` (ImagePath, Start, ServiceDll)
  - `HKLM\Software\Policies\Microsoft\Windows Defender` (DisableAntiSpyware, Real-Time Protection)
  - `HKLM\Software\Microsoft\Windows\CurrentVersion\Authentication\Credential Providers`
- **FR-1.5:** Monitored paths shall be completely dynamic and configurable via an external `monitored_keys.yaml` file without requiring source code modifications.

#### FR-2: Process Attribution and Telemetry Correlation
- **FR-2.1:** The system shall ingest Windows Event Log telemetry to correlate Registry modifications with the executing process.
- **FR-2.2:** When Sysmon is available, the collector shall ingest:
  - **Event ID 12:** Registry Object create and delete.
  - **Event ID 13:** Registry Value Set.
  - **Event ID 14:** Registry Key and Value Rename.
  - **Event ID 1:** Process Creation (for resolving parent-child process lineage).
- **FR-2.3:** When Windows Security Auditing is configured (Audit Registry with SACLs), the collector shall ingest **Event ID 4657** (A registry value was modified).
- **FR-2.4:** The correlation engine shall extract and enrich the event with:
  - `ProcessId` (PID) and `ProcessGuid`
  - `Image` (Full absolute path to the executable)
  - `CommandLine` (Full execution command-line parameters)
  - `ParentProcessId` and `ParentImage`
  - `User` (User SID and localized Account Name)
- **FR-2.5:** If external process event telemetry is unavailable, the system shall mark process attribution as `UNATTRIBUTED` or capture best-effort active process snapshotting without failing the Registry detection pipeline.

#### FR-3: Unified Event Normalization
- **FR-3.1:** All captured raw events (from Win32 watchers, Sysmon, or Security audit logs) shall be normalized into a standard Common Host Security Event Schema:
  - `event_id`: UUIDv4
  - `timestamp`: UTC ISO 8601 string (`YYYY-MM-DDTHH:MM:SS.mmmmmmZ`)
  - `source`: `WIN32_NOTIFY` | `SYSMON` | `SECURITY_AUDIT` | `BASELINE_SCAN`
  - `hive`: Canonical hive string (`HKLM` or `HKCU`)
  - `key_path`: Normalized key path (case-standardized, backslash-delimited)
  - `value_name`: Name of the modified value, or `(Default)`
  - `value_type`: `REG_SZ`, `REG_EXPAND_SZ`, `REG_DWORD`, `REG_MULTI_SZ`, `REG_BINARY`, `REG_NONE`
  - `previous_data`: Serialized representation of prior data (or `null` on creation)
  - `new_data`: Serialized representation of new data (or `null` on deletion)
  - `operation`: `CREATE` | `MODIFY` | `DELETE` | `RENAME`
  - `process`: Object containing `pid`, `name`, `path`, `command_line`, `user`, `parent_pid`, `parent_path`
- **FR-3.2:** Binary and non-string value types shall be hex-encoded or safely stringified with length limits to prevent serialization crashes or buffer overflows.

#### FR-4: Declarative Rule Engine and Threat Detection
- **FR-4.1:** The detection engine shall evaluate normalized events against declarative YAML-based rules.
- **FR-4.2:** Each detection rule shall define:
  - `rule_id`: Unique identifier (e.g., `WR-PERSIST-001`)
  - `name`: Concise rule title
  - `description`: Detailed technical explanation of the malicious behavior
  - `severity`: `CRITICAL` | `HIGH` | `MEDIUM` | `LOW` | `INFORMATIONAL`
  - `mitre_attack`: Technique ID and Name (e.g., `T1547.001 - Registry Run Keys`)
  - `conditions`: Logical boolean tree (`all_of`, `any_of`, `none_of`) supporting exact match, prefix match, regex pattern, and path inspection (e.g., executable in user-writable paths like `\AppData\`, `\Temp\`, `\Users\Public\`).
  - `rationale`: Clear explanation of why the detected pattern represents security risk.
  - `tags`: Classification tags (e.g., `persistence`, `defense_evasion`, `privilege_escalation`).
- **FR-4.3:** The rule engine shall support hot-reloading rules from disk without restarting the host monitor service.
- **FR-4.4:** The core release must include, at minimum, six pre-tuned baseline detection rules:
  1. *Run Key Executable in User-Writable Directory* (CRITICAL)
  2. *Image File Execution Options Debugger Hijack* (CRITICAL)
  3. *Windows Defender Real-Time Protection Disabled* (HIGH)
  4. *Winlogon Userinit/Shell Modification* (CRITICAL)
  5. *Suspicious Service Binary Registration* (HIGH)
  6. *New Startup Value with Script/LOLBin Interpreter (powershell.exe, cmd.exe, wscript.exe, mshta.exe)* (HIGH)

#### FR-5: State and Baseline Snapshotting Engine
- **FR-5.1:** The system shall take a baseline snapshot of all monitored keys upon initial startup or on operator demand.
- **FR-5.2:** Baseline snapshots shall record key paths, subkeys, value names, types, and cryptographic SHA-256 hashes of value contents.
- **FR-5.3:** The baseline engine shall provide a differential audit function to compare the live Registry state against any historical snapshot, identifying all added, modified, and deleted keys.

#### FR-6: Alert Generation and Forensic Evidence Management
- **FR-6.1:** When an event matches one or more detection rules, an Alert object shall be generated.
- **FR-6.2:** Each alert shall encapsulate a comprehensive Forensic Evidence Package:
  - Associated `normalized_event`
  - Matched `rule_id`, rule name, and severity
  - Exact rule match conditions that evaluated to `true`
  - Rationale and recommended analyst response actions
  - Historical context (whether this key was previously modified within 24 hours)
- **FR-6.3:** Alerts shall be assigned an operational status: `NEW`, `INVESTIGATING`, `FALSE_POSITIVE`, `RESOLVED`.

#### FR-7: Noise Reduction, Throttling and Whitelisting
- **FR-7.1:** The engine shall implement a sliding-window deduplication filter (default: 5 seconds) to prevent alert flooding during bulk installer operations.
- **FR-7.2:** The engine shall support configurable whitelisting based on signed process path patterns, trusted parent processes, or known legitimate installer execution hashes.

#### FR-8: Persistent Storage Layer
- **FR-8.1:** Normalized events, alerts, rules, baselines, and audit sessions shall be persisted in an embedded SQLite database configured with Write-Ahead Logging (`PRAGMA journal_mode=WAL;`) and synchronous normal (`PRAGMA synchronous=NORMAL;`).
- **FR-8.2:** The storage engine shall maintain B-Tree indexes on `timestamp`, `severity`, `rule_id`, `hive`, `key_path`, and `process_name` to ensure sub-50ms query response times over datasets exceeding 1,000,000 events.
- **FR-8.3:** An automatic data retention policy shall purge or archive raw events older than a configurable threshold (default: 30 days).

#### FR-9: REST API and Real-Time WebSocket Streaming
- **FR-9.1:** A FastAPI backend shall expose secure, typed endpoints:
  - `GET /api/v1/alerts`: Paginated, filterable alerts by severity, status, date range, rule.
  - `GET /api/v1/alerts/{id}`: Detailed forensic evidence packet.
  - `PATCH /api/v1/alerts/{id}`: Update alert triage status and analyst notes.
  - `GET /api/v1/events`: Searchable stream of normalized events with fuzzy path matching.
  - `GET /api/v1/rules`: List active rules, details, and hit counts.
  - `POST /api/v1/rules/reload`: Trigger rule engine hot-reload.
  - `POST /api/v1/baseline/snapshot`: Trigger on-demand baseline snapshot.
  - `GET /api/v1/baseline/diff`: Retrieve diff between live state and baseline.
  - `GET /api/v1/system/status`: Monitor health, telemetry source status, memory/CPU metrics.
  - `POST /api/v1/test/simulate`: Execute safe, harmless persistence simulation vector.
  - `WS /ws/telemetry`: WebSocket endpoint broadcasting real-time events and high-priority alerts.

#### FR-10: Operator Security Console (UI)
- **FR-10.1:** The operator interface shall be built as a high-density, dark-themed cyber-defense console adhering to Claude design principles (deliberate typography, zero AI clichés, tabular clarity, high-speed keyboard navigation).
- **FR-10.2:** The console shall contain six core views:
  1. **Live Alert Feed:** Prioritized triage queue with instant severity badges, MITRE ATT&CK tags, and real-time WebSocket updates.
  2. **Forensic Detail Drawer:** Slide-out inspection panel rendering raw before/after diffs, process hierarchy, rule rationale, and exportable JSON.
  3. **Event Explorer:** High-speed data table for querying historical events with multi-column filtering.
  4. **Baseline Inspector:** Visual differential comparison showing drift against initial system snapshots.
  5. **Rule Studio:** Rule manager for viewing active rules, testing regex patterns, and reviewing trigger metrics.
  6. **Simulation & Self-Test Sandbox:** Interactive harness for triggering benign test mutations and validating pipeline latency and detection response.

---

### 3. Non-Functional Requirements (NFR)

| ID | Requirement Area | Specification / Standard |
| :--- | :--- | :--- |
| **NFR-1** | **Performance & Latency** | Event capture to normalized storage: $\le 15\text{ ms}$. Normalization to rule match: $\le 10\text{ ms}$. Rule match to WebSocket delivery: $\le 20\text{ ms}$. Total roundtrip: $\le 50\text{ ms}$. |
| **NFR-2** | **Resource Footprint** | System shall not exceed $1.5\%$ average CPU utilization during idle monitoring or $5\%$ during peak event bursts. Memory footprint $\le 100\text{ MB}$ RSS. |
| **NFR-3** | **Fault Tolerance** | Watcher threads shall handle unhandled Windows API exceptions with auto-restart within $1\text{ s}$. Handle leaks shall be zero (`CloseHandle` verified via static analysis and unit tests). |
| **NFR-4** | **Data Integrity** | SQLite database must survive unexpected system power loss or process kill without corruption via WAL journaling. |
| **NFR-5** | **Security & Privilege** | Monitor service runs with standard administrator privileges required to access HKLM; API server binds strictly to `127.0.0.1` by default; all user-supplied paths in rules and search inputs are strictly sanitized. |
| **NFR-6** | **Compatibility** | Fully supported on Windows 10 (20H2+) and Windows 11 (21H2+), 64-bit architecture. Compatible with Python 3.11+. |
| **NFR-7** | **Observability** | Structured JSON logging using Python `logging` or `loguru` with configurable log levels (`DEBUG`, `INFO`, `WARNING`, `ERROR`). |

---

### 4. Edge Cases and Defensive Mitigations

1. **Mass Event Bursts (Software Installers):**
   - *Scenario:* Visual Studio or Chrome installer writes 5,000 registry keys in 3 seconds.
   - *Mitigation:* Ingestion queue utilizes an in-memory ring buffer (capacity: 10,000 events); sliding-window rate-limiter groups identical process events into batch records; storage worker writes in 500-event transactions.
2. **Short-Lived Ephemeral Processes:**
   - *Scenario:* Malware executes via `cmd.exe /c reg add ...`, terminating before Sysmon log query completes.
   - *Mitigation:* Sysmon Event ID 13 captures PID directly at write time; asynchronous correlation joins against Sysmon Event ID 1 process history cache to resolve the full command line even if the process has already exited.
3. **Registry Value Encoding Oddities:**
   - *Scenario:* Null-embedded `REG_MULTI_SZ`, large `REG_BINARY` payloads, or non-ASCII unicode strings.
   - *Mitigation:* Safe normalization wrapper catches decoding exceptions, converts binary to hex-strings, truncates strings at 2,048 characters with an ellipsis indicator, and preserves raw size metadata.
4. **Access Denied (`ERROR_ACCESS_DENIED`):**
   - *Scenario:* System subkeys protected by TrustedInstaller (e.g., SAM, Security).
   - *Mitigation:* Watcher gracefully skips inaccessible hives during snapshot scan, logging an informational warning without crashing the pipeline.
