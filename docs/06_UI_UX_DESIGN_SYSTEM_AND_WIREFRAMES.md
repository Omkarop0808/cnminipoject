# Windows Registry-Based Host Security Monitor
## Document 06: Frontend Design System, UI/UX Specifications, and Wireframes

**Document ID:** UI-UX-WINREG-2026-V1  
**Project:** Windows Registry-Based Host Security Monitor (WinReg-HIDS)  
**Surface Mode:** **Operate** (High-Density SOC Analyst & Forensic Operator Console)  
**Design Philosophy:** Disciplined, intentional, low-cognitive-load cyber defense interface. Free of generic AI-slop, SaaS card kit templates, and gratuitous gradients.  
**Status:** Approved for Implementation  

---

### 1. Subject-Grounded Design Direction

An endpoint host security monitor is not a generic B2B marketing product or a consumer analytics tool. An analyst using this tool is under time pressure, seeking to answer three high-stakes questions in seconds:
1. **What changed?** (Exact Registry hive, key, value name, and payload delta)
2. **Who changed it?** (Executing binary, command-line arguments, parent process tree)
3. **Why does it matter?** (Deterministic detection rule, MITRE ATT&CK technique, severity)

The visual design must prioritize **high information density, rapid scanability, rigorous typographic hierarchy, and visual restraint**. Every pixel, border, and color must carry functional meaning.

#### Deliberate Rejection of Clichés
- **NO SaaS Card Kit:** Content is not chopped into identical rounded white cards with soft fuzzy dropshadows and pastel borders.
- **NO Generic "Hacker" Theme:** No bright neon acid-green text on pitch-black terminal backdrops with CRT scanline gimmicks.
- **NO Warm Terracotta / Cream:** Explicitly avoids the generic AI-generated cream/clay palette (`#F4F1EA` / `#D97757`).
- **NO Tracked-Out ALL CAPS Eyebrows:** Headers and labels use crisp sentence case or standard technical nomenclature (`Process ID`, `Registry Hive`, `Matched Conditions`).

---

### 2. Design System Tokens & Color Palette

The interface utilizes a precision Deep Navy Slate foundation with functional, high-contrast security accents:

| Token Name | Hex Code | Purpose / Usage |
| :--- | :--- | :--- |
| `surface-bg` | `#0A0E14` | Global viewport background (Deep Navy Obsidian). Reduces eye fatigue during extended forensic analysis. |
| `surface-panel` | `#111822` | Primary container background for telemetry tables, sidebars, and drawers. |
| `surface-subtle` | `#172231` | Hover states, active table row highlights, and code snippet backgrounds. |
| `border-dim` | `#1E2C3D` | Structural hairline dividers (1px solid). Clean boundary definitions. |
| `border-focus` | `#3B82F6` | Active keyboard focus and selected row outline. |
| `text-primary` | `#F1F5F9` | Primary headings, alert titles, and active data values (Slate 100). |
| `text-secondary` | `#94A3B8` | Column headers, timestamps, and descriptive technical labels (Slate 400). |
| `text-muted` | `#64748B` | Inactive metadata, secondary parameters, and disabled elements (Slate 500). |
| `sev-critical` | `#EF4444` | Critical severity badge (Crimson Red) - Run keys in Temp, IFEO hijack. |
| `sev-high` | `#F97316` | High severity badge (Amber Orange) - Defender disabled, suspicious service. |
| `sev-medium` | `#EAB308` | Medium severity badge (Ochre Yellow) - Unknown executable in startup. |
| `sev-low` | `#3B82F6` | Low severity badge (Cobalt Blue) - Routine policy modifications. |
| `sev-info` | `#64748B` | Informational badge (Muted Steel) - Baseline scan entries. |
| `status-live` | `#10B981` | Real-time live indicator (Emerald Green) - WebSocket connected & watcher active. |

---

### 3. Typographic Hierarchy

Two deliberate type families are employed with strict role separation:
1. **Interface Sans (`Inter` / `system-ui`):** Used for navigation, headings, table column labels, and status badges.
2. **Telemetry Monospace (`JetBrains Mono` / `Geist Mono` / `monospace`):** Used for all Windows Registry keys, process paths, command-line arguments, hashes, and hexadecimal payloads.

| Element | Type Family | Size | Weight | Line Height | Usage Example |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `Display Title` | Sans | 18px | SemiBold (600) | 24px | WinReg-HIDS Host Console |
| `Section Heading` | Sans | 14px | Medium (500) | 20px | Active Alerts (Triage Queue) |
| `Table Text` | Sans / Mono | 12px | Regular (400) | 16px | 2026-10-12 14:05:22 UTC |
| `Telemetry Path` | Mono | 11px | Regular (400) | 15px | `HKCU\Software\Microsoft\Windows\CurrentVersion\Run` |
| `Badge Label` | Sans | 11px | SemiBold (600) | 14px | `CRITICAL` / `T1547.001` |
| `Payload Diff` | Mono | 11px | Regular (400) | 16px | `- "C:\Program Files\OldApp.exe"`<br>`+ "C:\Temp\malware.exe"` |

---

### 4. Layout Architecture & Workspace Zones

The console uses an asymmetrical, high-productivity split layout:
- **Top Bar (48px fixed):** Host hostname, telemetry ingestion health, WebSocket heartbeat pulse, active watcher count, and global search/filter.
- **Left Zone (60% width):** Live Alert Feed with instant multi-column filtering, sortable severity columns, and bulk triage actions.
- **Right Zone (40% width):** Sticky Forensic Inspector Drawer. When an alert is selected on the left, this drawer immediately renders full process attribution, condition match proof, before/after diffs, and remediation advice without page navigation.
- **Bottom Drawer (Collapsible):** Live raw event stream and Simulation Sandbox.

---

### 5. Detailed ASCII Wireframes

#### Wireframe 1: Master Operator Console Layout

```
+-----------------------------------------------------------------------------------------------------------------------+
| WinReg-HIDS Console | Host: DESKTOP-W10-EVAL | [O] LIVE (WebSocket) | Watchers: 8 Active | Alerts: 3 New | [Run Self-Test] |
+-----------------------------------------------------------------------------------------------------------------------+
| Filter: [ Search Registry path, binary name, or rule...                           ] [All Severities v] [Status: New v]|
+-----------------------------------------------------------------------+-----------------------------------------------+
| ACTIVE ALERT TRIAGE QUEUE (3 UNRESOLVED)                              | FORENSIC EVIDENCE INSPECTOR                   |
+-----+----------+---------------------------------+--------------------+-----------------------------------------------+
| SEV | TIME     | RULE & ATTACK                   | TARGET REGISTRY KEY| Alert: WR-PERSIST-001 (CRITICAL)              |
+-----+----------+---------------------------------+--------------------+-----------------------------------------------+
| CRIT| 14:02:11 | Run Key in Writable Directory   | HKCU\...\Run\Updater| Target Key:                                   |
|     |          | MITRE ATT&CK: T1547.001         | [SELECTED ROW]     | HKCU\Software\Microsoft\Windows\CurrentVersion|
+-----+----------+---------------------------------+--------------------+ \Run                                          |
| HIGH| 13:58:40 | Windows Defender Disabled       | HKLM\...\Defender  | Value Name: UpdateAssistant                   |
|     |          | MITRE ATT&CK: T1562.001         | DisableRealtime... | Value Type: REG_SZ                            |
+-----+----------+---------------------------------+--------------------+-----------------------------------------------+
| MED | 13:45:02 | Suspicious Service Binary       | HKLM\...\Services  | VALUE DATA DIFF:                              |
|     |          | MITRE ATT&CK: T1543.003         | ImagePath          | (-) <None (New Value)>                        |
+-----+----------+---------------------------------+--------------------+ (+) "C:\Users\User\AppData\Local\Temp\svc.exe"|
|                                                                       |-----------------------------------------------+
|                                                                       | ATTRIBUTED CULPRIT PROCESS:                   |
|                                                                       | Process: powershell.exe (PID: 4920)           |
|                                                                       | Path:    C:\Windows\System32\WindowsPowerShell|
|                                                                       |          \v1.0\powershell.exe                 |
|                                                                       | Command: powershell.exe -enc JAB3AG...        |
|                                                                       | User:    NT AUTHORITY\SYSTEM                  |
|                                                                       | Parent:  cmd.exe (PID: 3108)                  |
|                                                                       |-----------------------------------------------+
|                                                                       | MATCHED RULE CONDITIONS:                      |
|                                                                       | [x] Key matches "CurrentVersion\Run"          |
|                                                                       | [x] Operation is "CREATE" or "MODIFY"         |
|                                                                       | [x] Payload path matches writable dir (%TEMP%)|
|                                                                       |-----------------------------------------------+
|                                                                       | Actions: [Acknowledge] [Mark False Alarm] [Export]
+-----------------------------------------------------------------------+-----------------------------------------------+
| LIVE RAW EVENT STREAM (Last 5 events)                                                            [Expand/Collapse ^] |
| 14:02:11.102 | WIN32_NOTIFY | VALUE_SET | HKCU\Software\...\Run | Updater | C:\Users\User\AppData\Local\Temp\svc.exe  |
| 14:02:10.980 | SYSMON_13    | SetValue  | HKCU\Software\...\Run | Updater | powershell.exe (PID: 4920)                |
+-----------------------------------------------------------------------------------------------------------------------+
```

---

#### Wireframe 2: Baseline Differential Inspector View

```
+-----------------------------------------------------------------------------------------------------------------------+
| Baseline Audit Inspector | Snapshot: 2026-10-12 09:00:00 (Initial System Baseline) vs. LIVE REGISTRY STATE          |
+-----------------------------------------------------------------------------------------------------------------------+
| Summary: [ +2 Added Keys ]  [ *1 Modified Value ]  [ -0 Deleted Values ]        [Take New Baseline Snapshot] [Export Diff]|
+-----------------------------------------------------------------------------------------------------------------------+
| STATUS   | HIVE | KEY PATH                                       | VALUE NAME      | BASELINE DATA    | LIVE CURRENT DATA |
+----------+------+------------------------------------------------+-----------------+------------------+-------------------+
| MODIFIED | HKLM | ...\Windows NT\CurrentVersion\Winlogon         | Userinit        | C:\Windows\sys...| C:\Windows\system32|
|          |      |                                                |                 | \userinit.exe,   | \userinit.exe,    |
|          |      |                                                |                 |                  | C:\Temp\hook.dll  |
+----------+------+------------------------------------------------+-----------------+------------------+-------------------+
| ADDED    | HKCU | ...\CurrentVersion\Run                         | BackdoorPersist | <Does Not Exist> | "C:\Users\Public\ |
|          |      |                                                |                 |                  | update.exe"       |
+----------+------+------------------------------------------------+-----------------+------------------+-------------------+
| ADDED    | HKLM | ...\Image File Execution Options\sethc.exe     | Debugger        | <Does Not Exist> | "cmd.exe"         |
+----------+------+------------------------------------------------+-----------------+------------------+-------------------+
```

---

#### Wireframe 3: Self-Test Simulation Sandbox View

```
+-----------------------------------------------------------------------------------------------------------------------+
| Controlled Simulation Sandbox | Safe Validation & Benchmarking Harness                                                |
+-----------------------------------------------------------------------------------------------------------------------+
| Select a harmless attack simulation vector to verify detection pipeline, latency, and rule accuracy in real time:    |
|                                                                                                                       |
| [1] SIM-PERSIST-RUN: Write harmless benign string to HKCU\...\Run pointing to %TEMP%\sim_test.exe                     |
| [2] SIM-DEFENDER-TAMPER: Set DisableRealtimeMonitoring=1 in isolated test key                                        |
| [3] SIM-IFEO-DEBUGGER: Register harmless notepad.exe debugger hook                                                    |
|                                                                                                                       |
| [ Execute Selected Vector: SIM-PERSIST-RUN ]  [x] Auto-cleanup after validation (Deletes test value within 2 seconds)  |
|                                                                                                                       |
| EXECUTION RESULTS LOG:                                                                                                |
| [14:10:02.100] Injecting test registry value: HKCU\...\Run\SimTestKey -> "C:\Temp\sim_test.exe"                      |
| [14:10:02.115] Win32 change notification received (Latency: 15.2 ms)                                                  |
| [14:10:02.118] Normalized into schema; rule evaluator matched rule "WR-PERSIST-001" (Latency: 3.1 ms)                 |
| [14:10:02.122] Alert dispatched to WebSocket & persisted in SQLite WAL (Total Roundtrip Latency: 22.0 ms)             |
| [14:10:03.500] Auto-cleanup executed: deleted HKCU\...\Run\SimTestKey successfully.                                   |
|                                                                                                                       |
| STATUS: PASSED (True Positive Confirmed | Latency: 22.0 ms | Zero Residual Artifacts)                                 |
+-----------------------------------------------------------------------------------------------------------------------+
```

---

### 6. Copywriting & Interaction Design Guidelines

- **Active Voice in CTAs:** Buttons state the concrete operation: `"Take Snapshot"`, `"Acknowledge Alert"`, `"Export Report"`, `"Execute Simulation"`. Avoid vague verbs like `"Submit"` or `"Proceed"`.
- **Direct Error States:** If `winreg` encounters an access-denied error, message states: `"Access denied reading HKLM\SAM. Key is protected by Windows SACL. Monitoring continuing on remaining 7 hives."`
- **Zero Emptiness Disorientation:** If no alerts exist, display: `"System Baseline Clean: All 8 monitored hives match expected configuration with zero suspicious mutations detected."`
