# Requirements: WinReg-HIDS

**Defined:** 2026-10-12  
**Core Value:** Lightweight, near real-time detection and explainable attribution of Windows Registry persistence mechanisms and tampering.

## v1 Requirements

Requirements for initial release v1.0.0. Each maps to roadmap phases.

### Core Watcher & Surveillance Engine

- [x] **REQ-01**: Real-time Registry Surveillance Engine with native Win32 `RegNotifyChangeKeyValue`
- [x] **REQ-02**: Recursive Registry Snapshotting and SHA-256 Differential Engine
- [x] **REQ-03**: Unified Event Normalization with Canonical Pydantic Schema
- [x] **REQ-04**: Declarative AST Rule Engine with 6 Baseline MITRE ATT&CK Rules
- [x] **REQ-05**: SQLite WAL Mode Storage Engine with Parameterized Schemas and Indexes

### Process Attribution & Telemetry Correlation

- [x] **REQ-06**: High-Performance ProcessCache with LRU Eviction and Parent-Child Resolution
- [x] **REQ-07**: Sysmon Event Log Consumer (Event IDs 1, 12, 13, 14) and Fallback Security 4657
- [x] **REQ-08**: Alert Manager with 5-Second Sliding Window Deduplication and Suppression

### API & Operator Console

- [x] **REQ-09**: FastAPI Asynchronous Application Server with REST Endpoints
- [x] **REQ-10**: Real-Time WebSocket Telemetry Streaming Hub with Reconnect Logic
- [x] **REQ-11**: High-Density Operator Console UI with Alert Feed and MITRE Badges
- [x] **REQ-12**: Forensic Drawer with Before/After Diff, Process Lineage, and Match Proofs

### Simulation & Benchmarking

- [x] **REQ-13**: Controlled Harmless Simulation Vectors (RUN_KEY_TEMP, IFEO_DEBUGGER, LOLBIN_STARTUP)
- [x] **REQ-14**: End-to-End Evaluation Runner and Automated Test Suite
- [x] **REQ-15**: Quantitative Benchmarking: Detection Rate >= 95%, Latency <= 50ms, CPU <= 1.5%

## Traceability

Which phases cover which requirements.

| Requirement | Phase | Status |
|-------------|-------|--------|
| REQ-01 | Phase 1 | Complete |
| REQ-02 | Phase 1 | Complete |
| REQ-03 | Phase 1 | Complete |
| REQ-04 | Phase 1 | Complete |
| REQ-05 | Phase 1 | Complete |
| REQ-06 | Phase 2 | Complete |
| REQ-07 | Phase 2 | Complete |
| REQ-08 | Phase 2 | Complete |
| REQ-09 | Phase 3 | Complete |
| REQ-10 | Phase 3 | Complete |
| REQ-11 | Phase 3 | Complete |
| REQ-12 | Phase 3 | Complete |
| REQ-13 | Phase 4 | Complete |
| REQ-14 | Phase 4 | Complete |
| REQ-15 | Phase 4 | Complete |

**Coverage:**
- v1 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0

---
*Requirements defined: 2026-10-12*
*Last updated: 2026-10-12 after milestone audit*
