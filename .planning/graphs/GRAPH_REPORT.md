# Graph Report - CNminiproject  (2026-10-12)

## Corpus Check
- 82 files · ~33,443 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 1, .xml 1, .css 1)

## Summary
- 594 nodes · 924 edges · 51 communities (27 shown, 24 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 55 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `925ff78b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- app.py
- App.tsx
- SnapshotDiffEngine
- package.json
- RuleEngine
- Paper 1 --- Detecting Malicious Software by Monitoring Anomalous Windows Registry Accesses (2002)
- Windows Registry-Based Host Security Monitor
- get_db_connection
- Cross-Phase Integration & Wiring
- Windows Registry-Based Host Security Monitor (WinReg-HIDS)
- compilerOptions
- 2. Functional Requirements (FR)
- WebSocketHub
- Document 03: Detailed Technical Specifications and Architecture
- Document 01: Project Summary and Strategic Overview
- 2. Sequence Flows
- Document 06: Frontend Design System, UI/UX Specifications, and Wireframes
- README.md
- Phases
- Document 05: Recommended Technology Stack and Project Blueprint
- WinReg-HIDS: Windows Registry Host Security Monitor
- v1 Requirements
- Document 07: Phased Implementation Plan, Roadmap, and Evaluation Framework
- 2. Detailed Work Breakdown Structure (WBS)
- WebSocketClient
- Phase 01: Core Foundation Verification Report
- Phase 02: Process Attribution Verification Report
- Phase 03: REST API & Operator Console Verification Report
- Phase 04: Simulation & Evaluation Verification Report
- Project State
- run_simulation
- update_alert
- Accomplishments
- 01-01-PLAN.md
- 01-UAT.md
- 02-01-PLAN.md
- 02-UAT.md
- 03-01-PLAN.md
- 03-UAT.md
- 04-01-PLAN.md
- 04-UAT.md

## God Nodes (most connected - your core abstractions)
1. `EventRepository` - 32 edges
2. `RuleEngine` - 30 edges
3. `NormalizedEvent` - 25 edges
4. `Windows Registry-Based Host Security Monitor` - 17 edges
5. `compilerOptions` - 16 edges
6. `normalize_raw_event()` - 14 edges
7. `SnapshotDiffEngine` - 13 edges
8. `Windows Registry-Based Host Security Monitor (WinReg-HIDS)` - 12 edges
9. `App()` - 11 edges
10. `RegistryWatcher` - 11 edges

## Surprising Connections (you probably didn't know these)
- `Phase 1: Core Engine & Win32 Registry Surveillance (Days 1–3)` --references--> `NormalizedEvent`  [INFERRED]
  docs/07_PHASED_IMPLEMENTATION_PLAN.md → src/engine/normalizer.py
- `Accomplishments` --references--> `ThreatSimulator`  [INFERRED]
  .planning/phases/04-simulation-and-eval/04-01-SUMMARY.md → src/engine/simulator.py
- `Cross-Phase Integration & Wiring` --references--> `SimulationLab()`  [INFERRED]
  .planning/v1.0.0-MILESTONE-AUDIT.md → frontend/src/components/SimulationLab.tsx
- `Accomplishments` --references--> `RegistryWatcher`  [INFERRED]
  .planning/phases/01-core-foundation/01-01-SUMMARY.md → src/collector/registry_watcher.py
- `Cross-Phase Integration & Wiring` --references--> `RegistryWatcher`  [INFERRED]
  .planning/v1.0.0-MILESTONE-AUDIT.md → src/collector/registry_watcher.py

## Import Cycles
- None detected.

## Communities (51 total, 24 thin omitted)

### Community 0 - "app.py"
Cohesion: 0.05
Nodes (28): create_app(), handle_registry_events(), handle_sysmon_event(), lifespan(), get_active_watchers_count(), set_active_watchers_getter(), get_alert_detail(), list_alerts() (+20 more)

### Community 1 - "App.tsx"
Cohesion: 0.11
Nodes (32): App(), AlertFeed(), AlertFeedProps, BaselineDiff(), EventExplorer(), ForensicDrawer(), ForensicDrawerProps, Header() (+24 more)

### Community 2 - "SnapshotDiffEngine"
Cohesion: 0.09
Nodes (8): KeyWatcherThread, RegistryWatcher, get_hive_constant(), serialize_registry_value(), SnapshotDiffEngine, BaselineManager, test_diff_snapshots_addition_modification_deletion(), test_serialize_registry_value()

### Community 3 - "package.json"
Cohesion: 0.05
Nodes (36): dependencies, clsx, lucide-react, react, react-dom, recharts, tailwind-merge, devDependencies (+28 more)

### Community 4 - "RuleEngine"
Cohesion: 0.16
Nodes (16): Accomplishments, Summary 01-01: Core Foundation & Win32 Surveillance, NormalizedEvent, ProcessMetadata, get_field_value(), RuleEngine, test_empty_condition_safety(), test_in_writable_path_operator() (+8 more)

### Community 5 - "Paper 1 --- Detecting Malicious Software by Monitoring Anomalous Windows Registry Accesses (2002)"
Cohesion: 0.07
Nodes (27): 5. Research Review: Four Relevant Papers, Connection to the proposed project, Connection to the proposed project, Connection to the proposed project, Connection to the proposed project, Core method, Core method, Core methods compared (+19 more)

### Community 6 - "Windows Registry-Based Host Security Monitor"
Cohesion: 0.08
Nodes (25): 10. Similar Projects and Repositories, 11. Evaluation Plan, 12. Demonstration Workflow, 13. Suggested Final Scope, 14. Conclusion, 1. Executive Summary, 2. Problem Statement, 3. Goals and Objectives (+17 more)

### Community 8 - "Cross-Phase Integration & Wiring"
Cohesion: 0.09
Nodes (9): Accomplishments, Summary 02-01: Process Attribution & Telemetry Correlation, Cross-Phase Integration & Wiring, Executive Summary, Milestone v1.0.0 Audit Report, Requirements Coverage Matrix (3-Source Cross-Reference), Verification & Benchmarks, ProcessCache (+1 more)

### Community 9 - "Windows Registry-Based Host Security Monitor (WinReg-HIDS)"
Cohesion: 0.11
Nodes (19): 10. Automated Evaluation & Test Suite, 11. Scope Boundaries & Deferred Features, 1. Project Overview, 2. Documentation Index, 3. High-Level Architectural Flow, 4. Key Technology Stack, 5. Repository Structure, 6. Quickstart Guidelines (+11 more)

### Community 10 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+9 more)

### Community 11 - "2. Functional Requirements (FR)"
Cohesion: 0.12
Nodes (17): 1.1 Product Mission, 1.2 Core Success Metrics (KPIs), 1. Product Overview and Objectives, 2. Functional Requirements (FR), 3. Non-Functional Requirements (NFR), 4. Edge Cases and Defensive Mitigations, Document 02: Product Requirements Document (PRD), FR-10: Operator Security Console (UI) (+9 more)

### Community 13 - "Document 03: Detailed Technical Specifications and Architecture"
Cohesion: 0.17
Nodes (11): 1. Architectural System Overview, 2.1 Component A: Registry Surveillance Worker (`src/collector/registry_watcher.py`), 2.2 Component B: Sysmon / EVTX Telemetry Ingestor (`src/collector/sysmon_watcher.py`), 2.3 Component C: Event Normalizer & Schema (`src/engine/normalizer.py`), 2.4 Component D: Declarative Rule Engine (`src/engine/rule_engine.py`), 2. Component Specifications, 3. Database Schema (SQLite WAL DDL), 4. REST API Endpoint Specifications (+3 more)

### Community 14 - "Document 01: Project Summary and Strategic Overview"
Cohesion: 0.18
Nodes (11): 1. Executive Summary, 2.1 The Endpoint Blind Spot in Traditional Detection, 2.2 Telemetry and Operational Challenges, 2. Problem Statement, 3. Empirical Research Foundation, 4.1 In Scope, 4.2 Out of Scope (Deferred to Future Iterations), 4. Scope and System Boundaries (+3 more)

### Community 15 - "2. Sequence Flows"
Cohesion: 0.18
Nodes (10): 1. High-Level Dataflow Pipeline, 2. Sequence Flows, 3.1 Alert Lifecycle State Machine, 3.2 Watcher Thread Lifecycle State Machine, 3. State Machines, Document 04: Workflow Map and Sequence Flows, Sequence Flow 1: System Boot & Baseline Initialization, Sequence Flow 2: Real-Time Event Detection & Process Attribution (+2 more)

### Community 16 - "Document 06: Frontend Design System, UI/UX Specifications, and Wireframes"
Cohesion: 0.18
Nodes (11): 1. Subject-Grounded Design Direction, 2. Design System Tokens & Color Palette, 3. Typographic Hierarchy, 4. Layout Architecture & Workspace Zones, 5. Detailed ASCII Wireframes, 6. Copywriting & Interaction Design Guidelines, Deliberate Rejection of Clichés, Document 06: Frontend Design System, UI/UX Specifications, and Wireframes (+3 more)

### Community 17 - "README.md"
Cohesion: 0.22
Nodes (4): Windows Registry-Based Host Security Monitor, Windows Registry-Based Host Security Monitor, Windows Registry-Based Host Security Monitor, Windows Registry-Based Host Security Monitor

### Community 19 - "Phases"
Cohesion: 0.22
Nodes (8): Milestones, Phase 1: Core Foundation & Win32 Surveillance, Phase 2: Process Attribution & Telemetry Correlation, Phase 3: REST API, Real-Time WebSockets & Operator Console, Phase 4: Controlled Simulation Suite, Benchmarking & Evaluation, Phases, Progress, Roadmap: WinReg-HIDS

### Community 20 - "Document 05: Recommended Technology Stack and Project Blueprint"
Cohesion: 0.25
Nodes (7): 1. Technology Selection Matrix & Architectural Justification, 2.1 Python Dependencies (`requirements.txt`), 2.2 Frontend Dependencies (`package.json`), 2. Dependency Manifests, 3. Comprehensive File Tree Blueprint, Document 05: Recommended Technology Stack and Project Blueprint, Windows Registry-Based Host Security Monitor

### Community 21 - "WinReg-HIDS: Windows Registry Host Security Monitor"
Cohesion: 0.25
Nodes (7): Context, Core Value, Out of Scope, Requirements, Validated, What This Is, WinReg-HIDS: Windows Registry Host Security Monitor

### Community 22 - "v1 Requirements"
Cohesion: 0.25
Nodes (7): API & Operator Console, Core Watcher & Surveillance Engine, Process Attribution & Telemetry Correlation, Requirements: WinReg-HIDS, Simulation & Benchmarking, Traceability, v1 Requirements

### Community 23 - "Document 07: Phased Implementation Plan, Roadmap, and Evaluation Framework"
Cohesion: 0.33
Nodes (5): 1. Phased Implementation Roadmap Overview, 3. Quantitative Evaluation Framework, 4. Step-by-Step Demonstration Script, Document 07: Phased Implementation Plan, Roadmap, and Evaluation Framework, Windows Registry-Based Host Security Monitor

### Community 24 - "2. Detailed Work Breakdown Structure (WBS)"
Cohesion: 0.40
Nodes (5): 2. Detailed Work Breakdown Structure (WBS), Phase 1: Core Engine & Win32 Registry Surveillance (Days 1–3), Phase 2: Process Attribution & Telemetry Correlation (Days 4–6), Phase 3: REST API, Real-Time WebSockets & Operator Console (Days 7–10), Phase 4: Controlled Simulation Suite, Benchmarking & Evaluation (Days 11–14)

### Community 26 - "Phase 01: Core Foundation Verification Report"
Cohesion: 0.40
Nodes (4): Goal Achievement, Observable Truths, Phase 01: Core Foundation Verification Report, Requirements Coverage

### Community 27 - "Phase 02: Process Attribution Verification Report"
Cohesion: 0.40
Nodes (4): Goal Achievement, Observable Truths, Phase 02: Process Attribution Verification Report, Requirements Coverage

### Community 28 - "Phase 03: REST API & Operator Console Verification Report"
Cohesion: 0.40
Nodes (4): Goal Achievement, Observable Truths, Phase 03: REST API & Operator Console Verification Report, Requirements Coverage

### Community 29 - "Phase 04: Simulation & Evaluation Verification Report"
Cohesion: 0.40
Nodes (4): Goal Achievement, Observable Truths, Phase 04: Simulation & Evaluation Verification Report, Requirements Coverage

### Community 30 - "Project State"
Cohesion: 0.50
Nodes (3): Current Position, Project Reference, Project State

## Knowledge Gaps
- **195 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+190 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 305 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Cross-Phase Integration & Wiring` connect `Cross-Phase Integration & Wiring` to `app.py`, `App.tsx`, `SnapshotDiffEngine`, `WebSocketHub`?**
  _High betweenness centrality (0.207) - this node is a cross-community bridge._
- **Why does `SimulationLab()` connect `App.tsx` to `Cross-Phase Integration & Wiring`?**
  _High betweenness centrality (0.181) - this node is a cross-community bridge._
- **Why does `Alert` connect `Document 03: Detailed Technical Specifications and Architecture` to `app.py`?**
  _High betweenness centrality (0.144) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `EventRepository` (e.g. with `Cross-Phase Integration & Wiring` and `AlertManager`) actually correct?**
  _`EventRepository` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Are the 15 inferred relationships involving `RuleEngine` (e.g. with `Accomplishments` and `NormalizedEvent`) actually correct?**
  _`RuleEngine` has 15 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `NormalizedEvent` (e.g. with `Phase 1: Core Engine & Win32 Registry Surveillance (Days 1–3)` and `Accomplishments`) actually correct?**
  _`NormalizedEvent` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _195 weakly-connected nodes found - possible documentation gaps or missing edges._