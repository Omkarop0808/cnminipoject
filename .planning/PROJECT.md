# WinReg-HIDS: Windows Registry Host Security Monitor

## What This Is

WinReg-HIDS is a lightweight, low-overhead host-based intrusion detection system (HIDS) for Windows endpoints. It monitors critical Windows Registry hives and keys associated with persistence mechanisms (Run keys, IFEO debugger hijacks, Winlogon, Service registrations) and security tampering (Windows Defender policies). It intercepts mutations in near real-time, correlates them with process context, evaluates them against deterministic YAML detection rules mapped to MITRE ATT&CK, and surfaces alerts in an analyst-grade console.

## Core Value

Lightweight, near real-time detection and explainable attribution of Windows Registry persistence mechanisms and security tampering with zero enterprise agent bloat and sub-50ms latency.

## Requirements

### Validated

- [x] **FR-1**: Real-Time Registry Surveillance Engine (`RegNotifyChangeKeyValue` Win32 watcher)
- [x] **FR-2**: Process Attribution and Telemetry Correlation (ProcessCache & Sysmon integration)
- [x] **FR-3**: Unified Event Normalization (Canonical schema & Pydantic validation)
- [x] **FR-4**: Declarative Rule Engine and Threat Detection (YAML AST condition evaluation & MITRE ATT&CK mapping)
- [x] **FR-5**: State and Baseline Snapshotting Engine (SHA-256 differential hasher)
- [x] **FR-6**: Alert Generation and Forensic Evidence Management (Alert manager, deduplication, triage statuses)
- [x] **FR-7**: Noise Reduction, Throttling and Whitelisting (Sliding-window deduplication)
- [x] **FR-8**: Persistent Storage Layer (SQLite WAL mode with B-tree indexing)
- [x] **FR-9**: REST API and Real-Time WebSocket Streaming (FastAPI + WebSocket telemetry hub)
- [x] **FR-10**: Operator Security Console (React 19 + TypeScript + Vite triage console)

### Out of Scope

- Remote endpoint management / cloud telemetry aggregation (designed specifically as a local endpoint host monitor)
- Automatic process termination / active remediation (focuses on explainable monitoring, detection, and forensic evidence preservation)

## Context

- Target OS: Windows 10 (20H2+) and Windows 11 (21H2+), 64-bit architecture
- Language & Runtime: Python 3.11+ backend, Node.js / React 19 frontend
- Testing & Quality: 24 automated unit and integration tests passing with zero regressions
