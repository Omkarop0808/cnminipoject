# Roadmap: WinReg-HIDS

## Milestones

- 🚧 **v1.0.0** Host Registry Security Monitor & Persistence Detection (Phases 1-4)

## Phases

### Phase 1: Core Foundation & Win32 Surveillance
**Goal**: Establish foundational telemetry capture and deterministic detection loop on Windows.
**Requirements**: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05
**Success Criteria**:
  1. Win32 RegNotifyChangeKeyValue detects mutations in real-time
  2. SnapshotDiffEngine computes diffs with SHA-256 state hashing
  3. SQLite WAL database stores normalized events
**Plans**: 1 plan

Plans:
- [x] 01-01: Implement Win32 registry watcher, snapshot diff engine, SQLite storage, and rule evaluator

### Phase 2: Process Attribution & Telemetry Correlation
**Goal**: Enrich registry events with responsible process binary paths, command lines, and parent lineages.
**Requirements**: REQ-06, REQ-07, REQ-08
**Success Criteria**:
  1. ProcessCache maps PID and GUID to process metadata
  2. SysmonWatcherThread subscribes to Windows event logs
  3. AlertManager generates alerts with deduplication and throttling
**Plans**: 1 plan

Plans:
- [x] 02-01: Implement ProcessCache, Sysmon consumer, alert manager, and baseline manager

### Phase 3: REST API, Real-Time WebSockets & Operator Console
**Goal**: Build local communication bridge and high-density cyber defense operator console.
**Requirements**: REQ-09, REQ-10, REQ-11, REQ-12
**Success Criteria**:
  1. FastAPI exposes REST endpoints for alerts, events, rules, and system status
  2. WebSocket hub broadcasts live telemetry in real-time
  3. React 19 operator console displays AlertFeed, EventExplorer, BaselineDiff, and RuleStudio
**Plans**: 1 plan

Plans:
- [x] 03-01: Implement FastAPI REST backend, WebSocket hub, and React 19 UI

### Phase 4: Controlled Simulation Suite, Benchmarking & Evaluation
**Goal**: Quantitatively benchmark system performance, detection accuracy, and resource footprint.
**Requirements**: REQ-13, REQ-14, REQ-15
**Success Criteria**:
  1. Harmless simulation vectors (RUN_KEY_TEMP, IFFE_DEBUGGER, LOLBIN_STARTUP) run safely
  2. Detection rate >= 95% and latency <= 50ms verified by test suite
  3. Evaluation benchmark suite runs cleanly with 24 passing tests
**Plans**: 1 plan

Plans:
- [x] 04-01: Implement threat simulator, benchmark test suite, and evaluation script

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Core Foundation | v1.0.0 | 1/1 | Complete | 2026-10-12 |
| 2. Process Attribution | v1.0.0 | 1/1 | Complete | 2026-10-12 |
| 3. REST API & UI | v1.0.0 | 1/1 | Complete | 2026-10-12 |
| 4. Simulation & Eval | v1.0.0 | 1/1 | Complete | 2026-10-12 |
