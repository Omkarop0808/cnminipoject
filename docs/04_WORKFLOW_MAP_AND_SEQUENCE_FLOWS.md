# Windows Registry-Based Host Security Monitor
## Document 04: Workflow Map and Sequence Flows

**Document ID:** FLOW-WINREG-2026-V1  
**Project:** Windows Registry-Based Host Security Monitor (WinReg-HIDS)  
**Scope:** Execution Lifecycles, Sequence Flows, and State Machine Models  
**Status:** Approved for Implementation  

---

### 1. High-Level Dataflow Pipeline

The following ASCII diagram illustrates the path of a registry change from the operating system kernel to the security analyst's screen:

```
[Attacker / Process]
        |
        | 1. Writes to Registry (e.g., reg.exe add HKCU\...\Run /v BadKey /d "C:\Temp\payload.exe")
        v
[Windows Kernel (ObRegisterCallbacks / Configuration Manager)]
        |
        +-----------------------------------+-----------------------------------+
        | (A) Asynchronous Key Event        | (B) Security / Sysmon ETW Event   |
        v                                   v
[advapi32.RegNotifyChangeKeyValue]  [Sysmon Driver (SysmonDrv)]
        |                                   |
        | Triggers Event Object             | Writes Event ID 13 to EVTX
        v                                   v
[Win32 Registry Watcher Thread]     [Sysmon Ingestion Worker]
        |                                   |
        | 2. Enumerates & Diffs Values      | 3. Extracts Process PID & Image
        +-----------------+-----------------+
                          |
                          v
        [Telemetry Ingestion Queue (asyncio.Queue)]
                          |
                          v
        [Event Normalization Engine]
        - Canonicalizes key path
        - Joins process metadata from ProcessCache
        - Generates NormalizedEvent (UUID)
                          |
                          v
        [Deterministic Rule Engine]
        - Tests all active YAML rules
        - Matches: "Run Key in Writable Dir" -> TRUE
        - Produces: Alert (Severity: CRITICAL, MITRE: T1547.001)
                          |
        +-----------------+-----------------+
        |                                   |
        v                                   v
[SQLite WAL Storage Worker]         [Alert Manager / Deduplicator]
- Inserts normalized_event          - Checks 5s sliding window
- Inserts alert                     - Formats forensic packet
                                            |
                                            v
                                    [WebSocket Broadcaster]
                                            |
                                            v
                                    [React Operator Console]
                                    - Audio chime / visual notification
                                    - Alert feed updates at top of table
                                    - Analyst clicks to open Forensic Drawer
```

---

### 2. Sequence Flows

#### Sequence Flow 1: System Boot & Baseline Initialization
This sequence executes when `python -m src.main` starts up:

```
Analyst/Service    Main Supervisor       RegistryWatcher       Storage (SQLite)     RuleEngine
      |                   |                     |                     |                 |
      | 1. Start Service  |                     |                     |                 |
      |------------------>|                     |                     |                 |
      |                   | 2. Init DB (WAL)    |                     |                 |
      |                   |------------------------------------------>|                 |
      |                   |                     |                     | 3. DB Ready     |
      |                   |                     |                     |<----------------|
      |                   | 4. Load YAML Rules  |                     |                 |
      |                   |------------------------------------------------------------>|
      |                   |                     |                     | 5. 6 Rules Ready|
      |                   |                     |                     |<----------------|
      |                   | 6. Take Baseline    |                     |                 |
      |                   |-------------------->|                     |                 |
      |                   |                     | 7. Enumerate Keys   |                 |
      |                   |                     |    & Compute Hashes |                 |
      |                   |                     |-------------------->|                 |
      |                   |                     | 8. Save Baseline    |                 |
      |                   |                     |-------------------->|                 |
      |                   |                     | 9. Baseline Stored  |                 |
      |                   |                     |<--------------------|                 |
      |                   | 10. Start Watchers  |                     |                 |
      |                   |-------------------->|                     |                 |
      |                   |                     | 11. Arm Win32 Events|                 |
      |                   |                     |     WaitForSingleObj|                 |
      |                   | 12. Startup Complete|                     |                 |
      |<------------------|                     |                     |                 |
```

---

#### Sequence Flow 2: Real-Time Event Detection & Process Attribution
The primary operational loop when an event occurs:

```
Operating System   RegistryWatcher    SysmonWorker    ProcessCache    Normalizer    RuleEngine   AlertMgr    WebSocket/UI
      |                   |                 |               |              |            |           |             |
      | 1. Reg Value Set  |                 |               |              |            |           |             |
      |--[Event Signal]-->|                 |               |              |            |           |             |
      |                   | 2. Diff Key     |               |              |            |           |             |
      |                   |    Snapshot     |               |              |            |           |             |
      |                   | 3. Raw Event    |               |              |            |           |             |
      |                   |----------------------------------------------->|            |           |             |
      | 4. Sysmon Event 13|                 |               |              |            |           |             |
      |--[EVTX Channel]-------------------->|               |              |            |           |             |
      |                   |                 | 5. Query Proc |              |            |           |             |
      |                   |                 |    Metadata   |              |            |           |             |
      |                   |                 |-------------->|              |            |           |             |
      |                   |                 | 6. Lineage    |              |            |           |             |
      |                   |                 |<--------------|              |            |           |             |
      |                   |                 | 7. Process Context           |            |           |             |
      |                   |                 |----------------------------->|            |           |             |
      |                   |                 |               | 8. Normalize & Enrich     |           |             |
      |                   |                 |               |    NormalizedEvent        |           |             |
      |                   |                 |               |-------------------------->|           |             |
      |                   |                 |               |              | 9. Evaluate|           |             |
      |                   |                 |               |              |    Rules   |           |             |
      |                   |                 |               |              |----------->|           |             |
      |                   |                 |               |              | 10. Match: CRITICAL    |             |
      |                   |                 |               |              |<-----------|           |             |
      |                   |                 |               |              | 11. Dispatch Alert     |             |
      |                   |                 |               |              |----------------------->|             |
      |                   |                 |               |              |            | 12. Dedup & Package     |
      |                   |                 |               |              |            |     Alert JSON          |
      |                   |                 |               |              |            |---------[Broadcast]---->|
      |                   |                 |               |              |            |           |  13. Render |
      |                   |                 |               |              |            |           |      Toast  |
```

---

#### Sequence Flow 3: Controlled Simulation & Validation Flow
Workflow when the operator triggers a self-test from the UI or test CLI:

```
Operator Console         FastAPI Route         SimulationRunner        Windows Registry       Detection Engine
      |                        |                      |                        |                      |
      | 1. POST /test/simulate |                      |                        |                      |
      |----------------------->|                      |                        |                      |
      |                        | 2. Run Test Vector   |                        |                      |
      |                        |    "RUN_KEY_TEMP"    |                        |                      |
      |                        |--------------------->|                        |                      |
      |                        |                      | 3. Write Test Value:   |                      |
      |                        |                      |    "C:\Temp\test.exe"  |                      |
      |                        |                      |----------------------->|                      |
      |                        |                      |                        | 4. Watcher triggers  |
      |                        |                      |                        |--------------------->|
      |                        |                      |                        |                      | 5. Rule Match:
      |                        |                      |                        |                      |    WR-PERSIST-001
      |                        |                      | 6. Poll for Alert Match|                      |
      |                        |                      |    (timeout: 2.0s)     |                      |
      |                        |                      |<----------------------------------------------|
      |                        |                      | 7. Delete Test Value   |                      |
      |                        |                      |    (Cleanup)           |                      |
      |                        |                      |----------------------->|                      |
      |                        | 8. Result: DETECTED  |                        |                      |
      |                        |    Latency: 18.4ms   |                        |                      |
      |                        |<---------------------|                        |                      |
      | 9. 200 OK Response     |                      |                        |                      |
      |<-----------------------|                      |                        |                      |
```

---

### 3. State Machines

#### 3.1 Alert Lifecycle State Machine

```
              +-------------------------------------------------+
              |                                                 |
              v                                                 |
       +--------------+      Analyst reviews      +-----------------------+
------>|     NEW      |-------------------------->|     INVESTIGATING     |
       +--------------+                           +-----------------------+
              |                                        |             |
              | Marked False Alarm                     |             | Confirmed Threat &
              |                                        |             | Remediation Taken
              v                                        v             v
       +-----------------------+               +-------------------------------+
       |    FALSE_POSITIVE     |               |           RESOLVED            |
       +-----------------------+               +-------------------------------+
              |                                                |
              +-----------------> ARCHIVED <-------------------+
```

- **NEW:** Alert automatically generated by the Rule Engine; requires operator triage.
- **INVESTIGATING:** Operator has acknowledged the alert, opened the Forensic Drawer, and is inspecting the binary/process lineage.
- **FALSE_POSITIVE:** Operator determined the change was legitimate software maintenance (e.g. approved Google Chrome updater). A suggestion can be generated to add this process image to the rule suppression list.
- **RESOLVED:** Threat was validated and host remediation (e.g., removing the persistence key and killing the process) was verified.

---

#### 3.2 Watcher Thread Lifecycle State Machine

```
   [START]
      |
      v
+------------------+     Failed to open key     +------------------+
|   INITIALIZING   |--------------------------->|      FAILED      |
+------------------+                            +------------------+
      |                                                  ^
      | Handles created & baseline cached                |
      v                                                  |
+------------------+                                     | Max retries exceeded
| ACTIVE_WAITING   |<------------------------------------+
+------------------+                                     |
      |                                                  |
      | Win32 Event signaled                             |
      v                                                  |
+------------------+     Transient error        +------------------+
| TRIGGERED_DIFF   |--------------------------->| ERROR_RECOVERY   |
+------------------+                            +------------------+
      |                                                  |
      | Diff computed, re-armed event                   | Re-opened handle
      +--------------------------------------------------+
```
