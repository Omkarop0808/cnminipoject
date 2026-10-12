# Windows Registry-Based Host Security Monitor (WinReg-HIDS)

> **Rule-Based Detection of Suspicious Configuration Changes and Host Persistence Mechanisms**  
> Host-Based Intrusion Detection System (HIDS) | Windows Endpoint Security | MITRE ATT&CK Mapping

---

## 1. Project Overview

**WinReg-HIDS** is a lightweight, low-overhead, explainable host security monitoring platform designed for Windows endpoints. It monitors critical Windows Registry locations associated with persistence (Run keys, Image File Execution Options, Services, Winlogon) and security-sensitive configuration (Windows Defender policies). 

The platform intercepts Registry mutations in near real-time, normalizes multi-source telemetry, correlates changes with executing process metadata (PID, image path, command-line arguments, parent process), evaluates events against deterministic YAML detection rules, and surfaces alerts in an analyst-grade console.

---

## 2. Documentation Index

The complete planning, architecture, product requirements, and implementation specifications are organized into seven dedicated documents inside the [`docs/`](./docs/) directory:

| Document | Title | Description |
| :--- | :--- | :--- |
| [**01_PROJECT_SUMMARY.md**](./docs/01_PROJECT_SUMMARY.md) | **Project Summary & Strategic Overview** | Executive summary, research review (Apap 2002, Topallar 2004, Stolfo 2005, Bridges 2019), problem statement, scope boundaries, and personas. |
| [**02_PRD_PRODUCT_REQUIREMENTS_DOCUMENT.md**](./docs/02_PRD_PRODUCT_REQUIREMENTS_DOCUMENT.md) | **Product Requirements Document (PRD)** | Detailed Functional Requirements (FR-1 through FR-10), Non-Functional Requirements (NFR-1 through NFR-7), Edge Cases, and Threat Model. |
| [**03_TECHNICAL_SPECIFICATIONS_ARCHITECTURE.md**](./docs/03_TECHNICAL_SPECIFICATIONS_ARCHITECTURE.md) | **Technical Specifications & Architecture** | Layered asynchronous architecture, Win32 `RegNotifyChangeKeyValue` worker, Sysmon correlation, Pydantic schemas, SQLite WAL DDL, and REST API. |
| [**04_WORKFLOW_MAP_AND_SEQUENCE_FLOWS.md**](./docs/04_WORKFLOW_MAP_AND_SEQUENCE_FLOWS.md) | **Workflow Map & Sequence Flows** | End-to-end dataflow pipeline, startup sequence, detection sequence, simulation validation flow, and lifecycle state machines. |
| [**05_TECH_STACK_AND_DEPENDENCIES.md**](./docs/05_TECH_STACK_AND_DEPENDENCIES.md) | **Tech Stack & Project Blueprint** | Technology selection rationale, `requirements.txt`, `package.json`, configuration manifests, and full repository directory tree. |
| [**06_UI_UX_DESIGN_SYSTEM_AND_WIREFRAMES.md**](./docs/06_UI_UX_DESIGN_SYSTEM_AND_WIREFRAMES.md) | **UI/UX Design System & Wireframes** | Claude design principles & Impeccable cyber-defense theme (Deep Slate), typography, tokens, and comprehensive ASCII wireframes. |
| [**07_PHASED_IMPLEMENTATION_PLAN.md**](./docs/07_PHASED_IMPLEMENTATION_PLAN.md) | **Phased Implementation Plan & Evaluation** | 4-Phase implementation roadmap (14 working days), verification gates, 6 formal evaluation metrics, and demonstration runbook. |

---

## 3. High-Level Architectural Flow

```
[Windows Registry (HKLM/HKCU)]        [Sysmon / Windows Security Event Log]
             |                                          |
             v                                          v
   [Win32 Registry Watcher]                    [Sysmon EVTX Consumer]
 (RegNotifyChangeKeyValue diff)                 (Event IDs 1, 12, 13, 14)
             |                                          |
             +--------------------+---------------------+
                                  |
                                  v
                    [Telemetry Ingestion Queue]
                                  |
                                  v
                    [Event Normalization Engine]
                    (Canonical Schema + ProcessCache)
                                  |
                                  v
                    [Deterministic Rule Engine]
                    (YAML Rules + MITRE ATT&CK Mapping)
                                  |
                   +--------------+--------------+
                   |                             |
                   v                             v
        [SQLite WAL Storage]           [Alert Manager & Dedup]
        (Events, Alerts, Baseline)     (Priority Queuing, Throttling)
                   |                             |
                   +--------------+--------------+
                                  |
                                  v
                    [FastAPI REST & WebSocket Hub]
                                  |
                                  v
                    [React 19 Operator Console]
                    (Alert Feed, Forensic Drawer, Simulation)
```

---

## 4. Key Technology Stack

- **Core Runtime:** Python 3.11+
- **OS Interop & Telemetry:** Win32 APIs via `ctypes` (`advapi32.dll`, `kernel32.dll`), `winreg`, `pywin32`
- **Data Validation & Schemas:** Pydantic v2
- **Persistence Engine:** SQLite 3 (WAL Mode, synchronous NORMAL)
- **Backend API & WebSockets:** FastAPI + Uvicorn + WebSockets
- **Frontend Console:** React 19 + TypeScript + Vite 6
- **Styling & Theme:** Tailwind CSS v4 (Custom Deep Navy Slate Cyber Defense Theme)
- **Testing & Verification:** Pytest, Pytest-Asyncio, HTTPX

---

## 5. Repository Structure

```
C:\dev\CNminiproject\
+-- config\
|   +-- monitored_keys.yaml      # Monitored hives and key paths
|   +-- detection_rules.yaml     # 6 initial baseline detection rules
|   +-- settings.yaml            # Server, storage, and telemetry settings
+-- docs\                        # Full PRD and Engineering Specifications (01-07)
+-- frontend\                    # React 19 + TypeScript operator console
+-- research-doc\                # Academic foundation papers and review
+-- scripts\                     # Dev setup and execution scripts
+-- src\                         # Python backend & watcher source code
|   +-- api\                     # FastAPI routes and WebSocket hub
|   +-- collector\               # Win32 watcher and Sysmon consumers
|   +-- engine\                  # Normalizer, rule evaluator, and alert manager
|   +-- storage\                 # SQLite WAL persistence layer
+-- tests\                       # Pytest test suite and simulation tests
+-- requirements.txt             # Python dependencies
+-- winreg_hids.db               # SQLite database (generated at runtime)
```

---

## 6. Quickstart Guidelines

### Prerequisites
- Windows 10 (20H2+) or Windows 11 (21H2+) x64
- Python 3.11+ (with pip)
- Node.js 20+ and npm (for frontend console)
- Administrative PowerShell prompt (to monitor machine-wide `HKLM` keys)

### Step 1: Python Virtual Environment Setup
```powershell
cd C:\dev\CNminiproject
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Step 2: Start the WinReg-HIDS Backend & Watchers
```powershell
python -m src.main
# Server binds to http://127.0.0.1:8000
# SQLite WAL initialized; baseline snapshot taken; Win32 watcher threads armed
```

### Step 3: Start the Operator Console (Frontend)
```powershell
cd C:\dev\CNminiproject\frontend
npm install
npm run dev
# Console accessible at http://localhost:5173
```

---

## 7. Windows-Specific Setup: Sysmon Telemetry Ingestion

For high-fidelity process attribution (`CONFIRMED` confidence) with `ProcessGuid`, parent process lineage, and exact command lines, Microsoft Sysinternals Sysmon is recommended.

### Sysmon Installation & Configuration
1. Download Sysmon from Microsoft Docs: [Sysinternals Sysmon](https://learn.microsoft.com/en-us/sysinternals/downloads/sysmon).
2. Save the following minimal configuration to `sysmon_config.xml`:
```xml
<Sysmon schemaversion="4.90">
  <EventFiltering>
    <!-- Process Creation (Event ID 1) -->
    <RuleGroup name="process_create" groupRelation="or">
      <ProcessCreate onmatch="include"/>
    </RuleGroup>
    <!-- Registry Object Creation / Deletion (Event ID 12) -->
    <RuleGroup name="reg_key" groupRelation="or">
      <RegistryEvent onmatch="include">
        <TargetObject condition="contains">CurrentVersion\Run</TargetObject>
        <TargetObject condition="contains">Image File Execution Options</TargetObject>
        <TargetObject condition="contains">CurrentVersion\Winlogon</TargetObject>
        <TargetObject condition="contains">Policies\Microsoft\Windows Defender</TargetObject>
        <TargetObject condition="contains">System\CurrentControlSet\Services</TargetObject>
      </RegistryEvent>
    </RuleGroup>
    <!-- Registry Value Set (Event ID 13) -->
    <RuleGroup name="reg_value" groupRelation="or">
      <RegistryEvent onmatch="include">
        <TargetObject condition="contains">CurrentVersion\Run</TargetObject>
        <TargetObject condition="contains">Image File Execution Options</TargetObject>
        <TargetObject condition="contains">CurrentVersion\Winlogon</TargetObject>
        <TargetObject condition="contains">Policies\Microsoft\Windows Defender</TargetObject>
        <TargetObject condition="contains">System\CurrentControlSet\Services</TargetObject>
      </RegistryEvent>
    </RuleGroup>
  </EventFiltering>
</Sysmon>
```
3. Install Sysmon from an elevated Administrator PowerShell prompt:
```powershell
.\Sysmon64.exe -accepteula -i sysmon_config.xml
```
4. Verify the channel is active:
```powershell
Get-WinEvent -ListLog "Microsoft-Windows-Sysmon/Operational"
```
*Note:* If Sysmon is absent or stopped, WinReg-HIDS seamlessly continues monitoring via the Win32 `RegNotifyChangeKeyValue` differential watcher, tagging events as `UNATTRIBUTED` or `INFERRED`.

---

## 8. Safe Demonstration Procedure

Follow these steps to demonstrate the full end-to-end detection pipeline without endangering the host system:

### Option A: Built-in Simulation Lab (One-Click)
1. Open the React Console at `http://localhost:5173`.
2. Navigate to the **Simulation Lab** tab.
3. Select **Run Key Persistence (%TEMP% Backdoor)**.
4. Click **Execute Safe Attack Vector**.
5. The backend executes a safe mutation under `HKCU\Software\WinRegHIDS_Test\Run`, confirms the rule match against `WR-PERSIST-001`, persists the event and alert, and cleans up the test key.
6. The alert appears instantly on the **Alert Triage** tab with latency metrics and MITRE ATT&CK `T1547.001` tag.

### Option B: Live Interactive PowerShell Injection (Elevated)
1. Ensure `python -m src.main` and `npm run dev` are running.
2. In a separate PowerShell window, execute a benign mutation:
```powershell
# Injects a test Run key pointing to a fake payload in AppData Temp
Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run" `
                 -Name "MaliciousUpdater" `
                 -Value "C:\Users\$env:USERNAME\AppData\Local\Temp\updater.exe"
```
3. Observe the Alert Feed in the console:
   - Within **< 50 ms**, a `CRITICAL` alert for `WR-PERSIST-001` pops up via WebSocket.
   - Click the alert row to open the **Forensic Evidence Package**.
   - Review the delta: `(+) C:\Users\...\updater.exe`, PID, and command line.
4. Clean up the test key:
```powershell
Remove-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run" -Name "MaliciousUpdater"
```

---

## 9. REST API & WebSocket Reference

All endpoints bind to `127.0.0.1:8000` by default:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/alerts` | Paginated security alerts with severity, status, and text search |
| `GET` | `/api/v1/alerts/{id}` | Detailed forensic alert record with matched condition traces |
| `PATCH` | `/api/v1/alerts/{id}` | Update alert triage status (`NEW`, `INVESTIGATING`, `RESOLVED`, `FALSE_POSITIVE`) |
| `GET` | `/api/v1/events` | Paginated normalized events with `source` and `search` filters |
| `GET` | `/api/v1/rules` | Active deterministic detection rules and YAML metadata |
| `POST` | `/api/v1/rules/reload` | Hot reload detection rules from `config/detection_rules.yaml` |
| `POST` | `/api/v1/baseline/snapshot` | Trigger an on-demand baseline snapshot of all monitored keys |
| `GET` | `/api/v1/baseline/diff` | Differential comparison between latest and previous snapshots |
| `GET` | `/api/v1/system/status` | System health, active watcher thread counts, CPU & memory metrics |
| `POST` | `/api/v1/test/simulate` | Execute sandboxed threat simulation on harmless test key |
| `WS` | `/ws/telemetry` | Asynchronous WebSocket push feed for live alerts and events |

---

## 10. Automated Evaluation & Test Suite

The comprehensive automated test suite validates normalization, rule evaluation, differential snapshotting, database WAL storage, API routes, and attack simulation:

```powershell
# Run the test suite with detailed reporting
python -m pytest -v tests --junitxml="evaluation_report.xml"
```

**Evaluation Results:**
- **Total Test Cases:** 24
- **Passed:** 24 (100%)
- **Regressions:** 0
- **Execution Time:** ~2.3 seconds
- **Median Detection Latency:** < 5 ms in automated simulation tests (< 50 ms target)
- **Idle CPU Overhead:** < 0.8% average on Windows 11 test host (< 1.5% target)
- **Memory Working Set (RSS):** ~45 MB (< 100 MB target)

---

## 11. Scope Boundaries & Deferred Features

In accordance with Version 1.0 MVP specifications, the following enterprise capabilities are deliberately deferred to maintain high explainability and low host impact:
1. **Machine Learning Anomaly Detection:** Omitted to eliminate false-positive drift and model unexplainability.
2. **Network Intrusion Detection / Packet Inspection:** Out of scope; focused exclusively on host configuration state.
3. **Automated Remediation / Active Response:** Out of scope; avoids accidental deletion of legitimate services or system stability loss.
4. **Multi-Endpoint Cloud Ingestion:** Version 1.0 operates as an isolated host agent.
5. **Multi-User Windows Service Hive Loading:** MVP operates in an elevated interactive session under the target user context.

