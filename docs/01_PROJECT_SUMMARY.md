# Windows Registry-Based Host Security Monitor
## Document 01: Project Summary and Strategic Overview

**Project Name:** Windows Registry-Based Host Security Monitor (WinReg-HIDS)  
**System Classification:** Host-Based Intrusion Detection System (HIDS) / Endpoint Configuration Auditor  
**Primary Domain:** Host Security, Windows Forensics, Persistence Detection, MITRE ATT&CK Mapping  
**Workspace:** `C:\dev\CNminiproject`  
**Document Version:** 1.0.0 (Production Blueprint)  

---

### 1. Executive Summary

The **Windows Registry-Based Host Security Monitor (WinReg-HIDS)** is a lightweight, low-overhead, explainable host security monitoring platform designed to detect unauthorized, suspicious, and malicious configuration changes across Windows endpoints. By observing targeted Windows Registry locations that attackers exploit for persistence (such as Run/RunOnce keys, Image File Execution Options, and Service subkeys) and defense evasion (such as disabling Windows Defender or tampering with security controls), the system captures changes in near real-time, correlates them with process telemetry, evaluates them against deterministic detection rules, and surfaces actionable alerts in an analyst-grade console.

Unlike black-box machine learning models that produce uninterpretable anomaly scores, WinReg-HIDS adopts an **explainable, rule-driven detection architecture** informed by decades of empirical research. Every triggered alert is tied directly to an auditable rule rationale, cryptographic or path evidence, matched MITRE ATT&CK techniques, and, where available, process attribution metadata (Process ID, Executable Path, Command Line, and Parent Process).

---

### 2. Problem Statement

#### 2.1 The Endpoint Blind Spot in Traditional Detection
While Network Intrusion Detection Systems (NIDS) analyze perimeter and lateral traffic, modern attack vectors—including fileless malware, Living-off-the-Land Binaries (LOLBins), phishing implants, and ransomware—conduct their most critical staging and persistence actions locally on the endpoint. 

The Windows Registry serves as the central hierarchical configuration repository for the Windows operating system and its applications. Adversaries systematically leverage the Registry to:
1. **Establish Persistence (MITRE ATT&CK T1547, T1546, T1543):** Ensure malicious payloads execute automatically upon user logon, system boot, or specific application execution.
2. **Evade Defenses (MITRE ATT&CK T1562):** Disable antivirus engines, bypass User Account Control (UAC), suppress event auditing, or blind security tools.
3. **Hijack Execution Flow (MITRE ATT&CK T1546.012):** Attach debuggers or redirect execution paths using Image File Execution Options (IFEO).

#### 2.2 Telemetry and Operational Challenges
Existing solutions face dual failure modes:
- **Commercial EDR Overhead:** Full-scale enterprise EDR platforms deploy heavy kernel drivers (`fltmgr`, ELAM), introduce significant CPU/memory penalties, and are frequently unsuitable for constrained mini-project environments, lightweight servers, or educational testbeds.
- **Alert Fatigue & Low Explainability:** Raw logging tools (like standalone Sysmon or native Windows Event Viewer) capture millions of noisy events without normalized deduplication, prioritization, or immediate contextual reasoning, overwhelming analysts.

---

### 3. Empirical Research Foundation

WinReg-HIDS is directly engineered upon findings from four milestone academic works in host-based intrusion detection:

| Milestone Paper | Academic Venue | Core Research Finding | WinReg-HIDS Architectural Adoption |
| :--- | :--- | :--- | :--- |
| **Apap et al. (2002)** | RAID 2002 | Proved that Windows Registry accesses serve as a high-fidelity telemetry source for identifying malicious software without relying on static payload signatures. | Establishes the Registry as our foundational telemetry stream, focusing specifically on high-signal persistence hives (`HKLM` and `HKCU`). |
| **Topallar et al. (2004)** | IEEE SIU 2004 | Evaluated Self-Organizing Maps (SOM) for Registry access anomaly modeling, highlighting the challenge of dynamic baseline drift in live user systems. | Validates our choice to start with deterministic rules rather than unsupervised models to eliminate false alarms caused by routine OS updates. |
| **Stolfo et al. (2005)** | Journal of Computer Security | Compared Probabilistic Anomaly Detection (PAD) and SVMs; concluded that operational latency, computational overhead, and low false-positive rates govern practical utility. | Mandates strict performance constraints: event processing latency < 50ms, memory footprint < 100MB, and background CPU usage < 1.5%. |
| **Bridges et al. (2019)** | ACM Computing Surveys | Comprehensive survey demonstrating that Registry data alone is insufficient without contextual correlation (timestamp, operation type, process attribution, user SID). | Mandates a dual-telemetry design: combining Win32 API change notifications with Sysmon / Windows Security Event Log (Event ID 4657/12/13) process attribution. |

---

### 4. Scope and System Boundaries

#### 4.1 In Scope
- **Targeted Registry Surveillance:** Continuous real-time watching of defined high-value keys in `HKEY_LOCAL_MACHINE` (HKLM) and `HKEY_CURRENT_USER` (HKCU).
- **Dual-Mode Event Ingestion:**
  1. Win32 Native Hook: Utilizing `RegNotifyChangeKeyValue` and snapshot differentials via Python `winreg`.
  2. Windows Event Log Ingestion: Parsing Sysmon (Event IDs 12, 13, 14) and Windows Audit (Event ID 4657) for process context.
- **Unified Normalization Layer:** Translating multi-source inputs into an RFC-compliant Common Host Security Event Schema.
- **Deterministic Rule Engine:** Evaluating normalized events against structured, hot-reloadable YAML detection rules with MITRE ATT&CK tagging.
- **Embedded Persistent Storage:** High-throughput SQLite with Write-Ahead Logging (WAL) and index optimization.
- **Local REST API & WebSocket Stream:** High-performance FastAPI server providing query endpoints and live event broadcasting.
- **Analyst Console Dashboard:** Responsive, dark-mode, high-density React + TypeScript + Vite UI built according to Claude design principles (deliberate typography, zero AI-slop, tabular forensic precision).
- **Controlled Simulation Suite:** Safe, harmless test vectors to demonstrate detection, false-positive resistance, and latency metrics.

#### 4.2 Out of Scope (Deferred to Future Iterations)
- Kernel-mode driver development (Ring 0 / ELAM drivers).
- Active automatic process remediation / process termination (system remains non-destructive and observational).
- Live network packet capture (PCAP) inspection (focused strictly on host configuration).
- Black-box unsupervised deep learning models.

---

### 5. High-Level Architectural Flow

```
+---------------------------------------------------------------------------------------+
|                                    WINDOWS HOST                                       |
+---------------------------------------------------------------------------------------+
|  [Win32 Registry Key Watcher]                 [Sysmon / Windows Security EVTX]        |
|  RegNotifyChangeKeyValue (ctypes)             Event IDs 12, 13, 14 (Registry)         |
|  Snapshot Diffing (winreg)                    Event ID 1 (Process Create Attribution)  |
+------------------------------------+--------------------------------------------------+
                                     |
                                     v
                  +--------------------------------------+
                  |   Event Normalization Pipeline       |
                  |   - Canonical Key Path Resolving     |
                  |   - Value Hash & Diff Computation    |
                  |   - Process Metadata Enrichment      |
                  +--------------------------------------+
                                     |
                                     v
                  +--------------------------------------+
                  |   Deterministic Rule Engine (YAML)   |
                  |   - Condition Evaluator              |
                  |   - Whitelist & Suppression Filter   |
                  |   - Severity & MITRE ATT&CK Mapper   |
                  +--------------------------------------+
                                     |
                  +------------------+------------------+
                  |                                     |
                  v                                     v
    +---------------------------+         +---------------------------+
    |   SQLite Storage (WAL)    |         |   Alert Manager           |
    |   - Normalized Events     |         |   - Deduplication Engine  |
    |   - Alerts & Explanations |         |   - Priority Queuing      |
    |   - Baseline Snapshots    |         |   - WebSocket Broadcaster |
    +---------------------------+         +---------------------------+
                  |                                     |
                  +------------------+------------------+
                                     |
                                     v
                  +--------------------------------------+
                  |   FastAPI Backend (REST + WebSockets)|
                  +--------------------------------------+
                                     |
                                     v
                  +--------------------------------------+
                  |   Analyst Console (React 19 + Vite)  |
                  |   - Live Telemetry Stream            |
                  |   - Forensic Detail Drawer           |
                  |   - Rule Management & Simulation     |
                  +--------------------------------------+
```

---

### 6. Primary User Personas & Value Proposition

1. **Security Operations Center (SOC) Analyst / Incident Responder:**
   - *Needs:* Immediate notification when an endpoint establishes persistence, complete with the responsible process binary, command line, and exact registry key.
   - *Value:* Zero noise; explainable alerts with direct remediation paths and MITRE ATT&CK context.
2. **Security Researcher / Academic Evaluator:**
   - *Needs:* A transparent, reproducible HIDS testbed to benchmark detection latencies, evaluate rule coverage against test matrices, and assess resource overhead.
   - *Value:* Open YAML rules, clean SQLite schema, reproducible test scripts, and quantitative metric reporting.
3. **Endpoint Systems Administrator:**
   - *Needs:* Visibility into unexpected software configuration changes or unwanted third-party installer modifications without enterprise agent bloat.
   - *Value:* Negligible footprint (<1.5% CPU), no external cloud dependencies, offline self-contained operation.
