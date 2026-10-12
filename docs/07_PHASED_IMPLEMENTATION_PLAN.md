# Windows Registry-Based Host Security Monitor
## Document 07: Phased Implementation Plan, Roadmap, and Evaluation Framework

**Document ID:** PLAN-WINREG-2026-V1  
**Project:** Windows Registry-Based Host Security Monitor (WinReg-HIDS)  
**Methodology:** Iterative Agile / Test-Driven Development (TDD)  
**Total Estimated Sprint Duration:** 14 Working Days  
**Status:** Approved for Implementation  

---

### 1. Phased Implementation Roadmap Overview

The development lifecycle is divided into four sequential, milestone-gated phases. Each phase culminates in an automated verification gate that must pass before succeeding phases begin:

```
[ PHASE 1: Core Foundation & Win32 Watcher ] ----> [ Gate 1: Win32 Diff & Rule Unit Tests Pass ]
                     |
                     v
[ PHASE 2: Process Attribution & Sysmon ] ---------> [ Gate 2: Process Lineage Attribution Verified ]
                     |
                     v
[ PHASE 3: FastAPI Backend & React UI ] -----------> [ Gate 3: Live End-to-End WebSocket Stream Tested ]
                     |
                     v
[ PHASE 4: Simulation Suite & Evaluation ] --------> [ Gate 4: Benchmarked Detection & Latency Report ]
```

---

### 2. Detailed Work Breakdown Structure (WBS)

#### Phase 1: Core Engine & Win32 Registry Surveillance (Days 1–3)
- **Objective:** Establish the foundational telemetry capture and deterministic detection loop on Windows.
- **Deliverables:**
  1. `src/storage/db.py`: SQLite WAL database initialization with parameterized schemas for events, alerts, and baselines.
  2. `src/collector/registry_watcher.py`: Win32 `RegNotifyChangeKeyValue` thread pool using `ctypes` bindings.
  3. `src/collector/snapshot_diff.py`: Recursive `winreg` key enumerator and value state hasher (SHA-256).
  4. `src/engine/normalizer.py`: Pydantic schema validation transforming raw changes into canonical `NormalizedEvent` structures.
  5. `src/engine/rule_engine.py`: AST-based condition evaluator supporting `all_of`, `any_of`, regex, and writable path checking.
  6. `config/detection_rules.yaml`: 6 production-grade baseline detection rules (Run keys, IFEO debugger, Defender tampering, Winlogon, Service registration, Script interpreters).
- **Verification Gate 1:**
  - Automated `pytest tests/test_registry_watcher.py` and `tests/test_rule_engine.py`.
  - Harmless registry value write to test key must trigger `NormalizedEvent` and match rule within $20\text{ ms}$.

---

#### Phase 2: Process Attribution & Telemetry Correlation (Days 4–6)
- **Objective:** Enrich registry events with responsible process binary paths, command lines, and parent lineages.
- **Deliverables:**
  1. `src/collector/process_cache.py`: High-performance LRU cache mapping `(PID, Timestamp)` to full process creation context.
  2. `src/collector/sysmon_watcher.py`: Event log consumer subscribing to `Microsoft-Windows-Sysmon/Operational` (Event IDs 1, 12, 13, 14) and fallback to Windows Security 4657.
  3. `src/engine/alert_manager.py`: Alert generator with 5-second sliding window deduplicator and suppression filters.
  4. `src/engine/baseline_manager.py`: System snapshot recorder and differential audit engine.
- **Verification Gate 2:**
  - Execute a PowerShell command modifying a monitored test key (`powershell.exe -Command "Set-ItemProperty ..."`).
  - Normalizer must correlate the modification with `powershell.exe`, capturing its PID and command line with $\ge 90\%$ reliability.

---

#### Phase 3: REST API, Real-Time WebSockets & Operator Console (Days 7–10)
- **Objective:** Build the local communication bridge and the high-density cyber defense operator console.
- **Deliverables:**
  1. `src/api/app.py`: FastAPI server with CORS, lifespan context, and error handling.
  2. `src/api/routes_*.py`: Typed endpoints for alerts, events, rules, baselines, and simulation triggers.
  3. `src/api/websocket_hub.py`: Connection manager broadcasting live telemetry to connected browser clients.
  4. `frontend/`: React 19 + TypeScript + Vite console implementing the Deep Navy Slate design system.
  5. Components:
     - `AlertFeed.tsx`: Sortable, filterable triage queue with severity badges and MITRE ATT&CK tags.
     - `ForensicDrawer.tsx`: Slide-out panel rendering before/after diffs, process hierarchy, and match proofs.
     - `BaselineDiff.tsx`: Visual diff table showing added, modified, and deleted keys.
     - `RuleStudio.tsx`: Rule inspector, hit metrics, and hot-reload trigger.
- **Verification Gate 3:**
  - Modify a test key; verify that the UI renders the new alert at the top of the feed within $50\text{ ms}$ without page reload.

---

#### Phase 4: Controlled Simulation Suite, Benchmarking & Evaluation (Days 11–14)
- **Objective:** Quantitatively benchmark system performance, detection accuracy, and resource footprint against defined scientific metrics.
- **Deliverables:**
  1. `src/engine/simulator.py`: Safe, reversible attack simulation routines:
     - `SIM-PERSIST-RUN`: Injects startup payload in `%TEMP%` and validates `WR-PERSIST-001`.
     - `SIM-IFEO-HIJACK`: Creates test IFEO debugger hook and validates `WR-PERSIST-002`.
     - `SIM-DEFENDER-TAMPER`: Simulates `DisableRealtimeMonitoring=1` and validates `WR-DEFENSE-001`.
  2. `tests/test_simulation.py`: End-to-end evaluation runner.
  3. `scripts/run_eval_suite.ps1`: Automated PowerShell evaluation script generating a structured `evaluation_report.json`.
  4. Final Documentation & Demo Runbook: Step-by-step demonstration walkthrough for academic/defense review.
- **Verification Gate 4:**
  - Full evaluation suite runs cleanly, reporting $\ge 95\%$ detection rate, $\le 2\%$ false positives, $\le 50\text{ ms}$ average latency, and $\le 1.5\%$ background CPU overhead.

---

### 3. Quantitative Evaluation Framework

In alignment with Stolfo et al. (2005) and Bridges et al. (2019), the system will be evaluated using six formal metrics:

| Metric Name | Mathematical Definition | Target Threshold | Experimental Methodology |
| :--- | :--- | :--- | :--- |
| **Detection Rate (DR)** | $\text{DR} = \frac{\text{True Positives (TP)}}{\text{TP} + \text{False Negatives (FN)}} \times 100\%$ | $\ge 95\%$ | Execute 20 controlled test mutations across 5 persistence vectors. |
| **False Positive Rate (FPR)** | $\text{FPR} = \frac{\text{False Positives (FP)}}{\text{FP} + \text{True Negatives (TN)}} \times 100\%$ | $\le 2.0\%$ | Run standard benign software activity (e.g. Chrome/VS Code installation, legitimate updates) for 30 minutes. |
| **Event-to-Alert Latency** | $T_{\text{latency}} = T_{\text{UI\_Receive}} - T_{\text{Kernel\_Write}}$ | $p50 \le 25\text{ ms}$, $p95 \le 50\text{ ms}$ | High-resolution microsecond timestamps embedded at OS write and extracted at WebSocket receipt. |
| **CPU Overhead** | Average CPU % consumed by monitor process | $\le 1.5\%$ (Idle), $\le 5.0\%$ (Peak Burst) | Measured via `psutil.Process().cpu_percent(interval=1.0)` over 10-minute continuous monitoring runs. |
| **Memory Working Set** | Resident Set Size (RSS) in megabytes | $\le 100\text{ MB}$ RSS | Measured via `psutil.Process().memory_info().rss`. |
| **Attribution Coverage** | $\text{AC} = \frac{\text{Events with Valid PID \& Image}}{\text{Total Relevant Events}} \times 100\%$ | $\ge 85\%$ | Evaluated with Sysmon active during controlled execution. |

---

### 4. Step-by-Step Demonstration Script

For academic, stakeholder, or defense evaluations, follow this scripted protocol:

1. **Environment Setup:**
   ```powershell
   cd C:\dev\CNminiproject
   .\scripts\run_monitor.ps1
   # Backend initializes SQLite WAL, loads 6 YAML rules, caches baseline, and arms Win32 watchers.
   ```
2. **Access Console:**
   - Open browser to `http://localhost:5173`.
   - Verify green `LIVE (WebSocket)` heartbeat and `8 Watchers Active` status.
3. **Execute Harmless Persistence Simulation:**
   - On the console, navigate to the **Simulation Sandbox** tab.
   - Click **Execute Selected Vector (SIM-PERSIST-RUN)**.
   - Observe real-time logs:
     - Registry key `HKCU\...\Run\SimTestKey` written.
     - Win32 notification intercepted in $<15\text{ ms}$.
     - Rule `WR-PERSIST-001` evaluated and matched.
     - Alert `CRITICAL` rendered in triage feed.
     - Auto-cleanup removes the test value within 2 seconds.
4. **Forensic Inspection:**
   - Click the newly created alert in the feed.
   - Inspect the **Forensic Evidence Inspector** drawer:
     - Verify before/after diff: `(-) None` $\rightarrow$ `(+) "C:\Temp\sim_test.exe"`.
     - Verify process attribution: PID, parent process, and user context.
     - Verify rule match proof: green checkmarks on all matched conditions.
5. **Baseline Comparison:**
   - Navigate to the **Baseline Diff** tab.
   - View differential drift analysis and export a structured JSON audit report.
