# Windows Registry-Based Host Security Monitor
## Document 05: Recommended Technology Stack and Project Blueprint

**Document ID:** STACK-WINREG-2026-V1  
**Project:** Windows Registry-Based Host Security Monitor (WinReg-HIDS)  
**Scope:** Technology Selection, Dependency Manifests, and Codebase Structure  
**Status:** Approved for Implementation  

---

### 1. Technology Selection Matrix & Architectural Justification

| Architectural Layer | Selected Technology | Version | Architectural Justification | Alternatives Evaluated & Discarded |
| :--- | :--- | :--- | :--- | :--- |
| **Core Host Language** | **Python** | `3.11+` | Rapid prototyping, native Windows C-API interop via `ctypes` & `winreg`, robust ecosystem for parsing structured data (YAML/JSON/EVTX), and async event loops. | C/C++ (Too complex for mini-project timeline; manual memory safety risks); Go (Good, but Windows Event Log XML & ctypes parsing is more verbose). |
| **Win32 OS Interop** | **ctypes + pywin32** | `306+` | Direct invocation of `advapi32.dll` (`RegNotifyChangeKeyValue`) and `kernel32.dll` (`CreateEventW`, `WaitForMultipleObjects`). | Native C-extensions (Requires MSVC compiler toolchain setup on all test machines). |
| **Data Validation** | **Pydantic** | `2.8+` | Type safety, ultra-fast C-compiled schema validation via Rust core, automatic OpenAPI generation for FastAPI. | Marshmallow (Slower); dataclasses (Lacks automatic runtime coercion and JSON schema validation). |
| **Persistence Engine** | **SQLite (WAL Mode)** | `3.42+` | Embedded, zero-configuration, zero-daemon installation. WAL mode allows concurrent readers while a single writer operates at >15,000 writes/sec. | PostgreSQL / MySQL (Requires external server installation; excessive overhead for host agent); DuckDB (Great for OLAP, but SQLite WAL is superior for live OLTP event streaming). |
| **Web & API Framework**| **FastAPI + Uvicorn** | `0.112+` | Fully asynchronous, native WebSockets, automatic interactive OpenAPI documentation, high concurrency. | Flask (Synchronous, awkward WebSockets); Django (Heavy ORM unnecessary for embedded SQLite). |
| **Frontend Framework** | **React + Vite** | `19.0 / 6.0`| Sub-second HMR development, component modularity, large ecosystem for security dashboards. | Next.js (Unnecessary SSR complexity for a local localhost desktop dashboard); Vue (Solid, but React TypeScript ecosystem is standard). |
| **Styling & Design**   | **Tailwind CSS v4** | `4.0+` | Zero-runtime CSS, precise token management for cyber-defense design systems, compact bundle size. | Material UI / Ant Design (Heavy, generic, creates recognizable "AI slop" or corporate template look). |
| **Iconography**        | **Lucide React** | `0.400+`| Clean, consistent, pixel-aligned terminal and cyber security icons. | FontAwesome (Heavy footprint); Material Icons (Clunky styling). |
| **Telemetry Charts**   | **Recharts / Custom SVG**| `2.12+`| Clean rendering of event timeline distribution and severity breakdowns without canvas bloat. | Chart.js (Requires canvas imperative APIs; harder to theme seamlessly in dark mode). |

---

### 2. Dependency Manifests

#### 2.1 Python Dependencies (`requirements.txt`)
```text
# Web Framework & Async
fastapi>=0.112.0
uvicorn[standard]>=0.30.0
websockets>=12.0
pydantic>=2.8.0
pydantic-settings>=2.3.0

# Windows OS Interop & Forensics
pywin32>=306
psutil>=6.0.0

# Configuration & Utilities
pyyaml>=6.0.1
loguru>=0.7.2
python-multipart>=0.0.9

# Testing & Quality Assurance
pytest>=8.2.0
pytest-asyncio>=0.23.0
httpx>=0.27.0
pytest-cov>=5.0.0
```

#### 2.2 Frontend Dependencies (`package.json`)
```json
{
  "name": "winreg-hids-console",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint ."
  },
  "dependencies": {
    "clsx": "^2.1.1",
    "lucide-react": "^0.428.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "recharts": "^2.12.7",
    "tailwind-merge": "^2.5.2"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.41",
    "tailwindcss": "^3.4.10",
    "typescript": "^5.5.3",
    "vite": "^5.4.1"
  }
}
```

---

### 3. Comprehensive File Tree Blueprint

The implementation within `C:\dev\CNminiproject` is organized as follows:

```
C:\dev\CNminiproject\
|
+-- config\                                # Declarative configurations
|   +-- monitored_keys.yaml                # Monitored hives and key paths
|   +-- detection_rules.yaml               # Deterministic YAML detection rules
|   +-- settings.yaml                      # Server port, database path, log level
|
+-- docs\                                  # Complete Planning & PRD Documentation
|   +-- 01_PROJECT_SUMMARY.md              # Strategic summary, research context
|   +-- 02_PRD_PRODUCT_REQUIREMENTS_DOCUMENT.md # Full product requirements (FR/NFR)
|   +-- 03_TECHNICAL_SPECIFICATIONS_ARCHITECTURE.md # Architecture & technical design
|   +-- 04_WORKFLOW_MAP_AND_SEQUENCE_FLOWS.md # Sequence flows, pipelines, states
|   +-- 05_TECH_STACK_AND_DEPENDENCIES.md  # Stack selection, dependency manifests
|   +-- 06_UI_UX_DESIGN_SYSTEM_AND_WIREFRAMES.md # Design system & ASCII wireframes
|   +-- 07_PHASED_IMPLEMENTATION_PLAN.md   # Implementation roadmap & evaluation metrics
|
+-- research-doc\                          # Academic papers and historical references
|   +-- windows_registry_host_security_monitor.md
|
+-- src\                                   # Backend Python Source Code
|   +-- __init__.py
|   +-- main.py                            # Application entrypoint & CLI runner
|   |
|   +-- collector\                         # Telemetry Collection Layer
|   |   +-- __init__.py
|   |   +-- registry_watcher.py            # Win32 RegNotifyChangeKeyValue loop
|   |   +-- snapshot_diff.py               # winreg key enumeration & value diffing
|   |   +-- sysmon_watcher.py              # Sysmon / EVTX event subscriber
|   |   +-- process_cache.py               # PID to process metadata LRU cache
|   |
|   +-- engine\                            # Detection & Normalization Layer
|   |   +-- __init__.py
|   |   +-- normalizer.py                  # Raw event -> NormalizedEvent schema
|   |   +-- rule_engine.py                 # YAML rule parser and AST evaluator
|   |   +-- alert_manager.py               # Deduplication and alert dispatching
|   |   +-- baseline_manager.py            # System baseline snapshot & diffing
|   |   +-- simulator.py                   # Harmless test persistence mutator
|   |
|   +-- storage\                           # Persistence Layer
|   |   +-- __init__.py
|   |   +-- db.py                          # SQLite connection pool & DDL init
|   |   +-- repository.py                  # CRUD operations for events and alerts
|   |
|   +-- api\                               # REST & WebSocket API Layer
|       +-- __init__.py
|       +-- app.py                         # FastAPI initialization & middleware
|       +-- routes_alerts.py               # Alert query, update, export routes
|       +-- routes_events.py               # Normalized event query routes
|       +-- routes_rules.py                # Rule management and hot-reload routes
|       +-- routes_system.py               # Health, baseline, simulation routes
|       +-- websocket_hub.py               # Live WebSocket telemetry broadcaster
|
+-- frontend\                              # React 19 + TypeScript + Vite UI
|   +-- package.json
|   +-- vite.config.ts
|   +-- tailwind.config.js
|   +-- tsconfig.json
|   +-- src\
|       +-- main.tsx
|       +-- App.tsx
|       +-- index.css                      # Design tokens, cyber-defense theme
|       +-- components\
|       |   +-- Header.tsx                 # System status, live telemetry badge
|       |   +-- AlertFeed.tsx              # Real-time alert list with triage status
|       |   +-- ForensicDrawer.tsx         # Slide-out evidence and diff inspector
|       |   +-- EventTable.tsx             # Paginated historical event explorer
|       |   +-- BaselineDiff.tsx           # Visual baseline comparison view
|       |   +-- RuleManager.tsx            # Rule studio and regex tester
|       |   +-- SimulationLab.tsx          # Harmless self-test mutation runner
|       +-- services\
|           +-- api.ts                     # Fetch API client for FastAPI
|           +-- websocket.ts               # Resilient WebSocket client with reconnect
|
+-- tests\                                 # Automated Verification & Test Suite
|   +-- conftest.py                        # Fixtures (in-memory SQLite, mock events)
|   +-- test_registry_watcher.py           # Unit tests for diff engine
|   +-- test_normalizer.py                 # Unit tests for event schema validation
|   +-- test_rule_engine.py                # Unit tests for rule condition evaluator
|   +-- test_alert_manager.py              # Unit tests for deduplication filter
|   +-- test_api.py                        # Integration tests for FastAPI endpoints
|   +-- test_simulation.py                 # End-to-end harmless simulation test
|
+-- scripts\                               # Operational Scripts
|   +-- setup_dev.ps1                      # Environment setup (venv, npm install)
|   +-- run_monitor.ps1                    # Launch backend and watcher supervisor
|   +-- run_frontend.ps1                   # Launch Vite development server
|   +-- run_eval_suite.ps1                 # Execute evaluation benchmarking suite
|
+-- winreg_hids.db                         # SQLite WAL Database (Generated at runtime)
+-- README.md                              # Master project overview & quickstart guide
```
