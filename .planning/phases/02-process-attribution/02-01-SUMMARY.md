---
phase: 02-process-attribution
plan: 01
subsystem: correlation
tags: [process_cache, sysmon, alert_manager, deduplication]
requirements-completed:
  - REQ-06
  - REQ-07
  - REQ-08
key-files:
  created:
    - src/collector/process_cache.py
    - src/collector/sysmon_watcher.py
    - src/engine/alert_manager.py
    - src/engine/baseline_manager.py
---

# Summary 02-01: Process Attribution & Telemetry Correlation

## Accomplishments
- Implemented thread-safe `ProcessCache` resolving PID and process GUID to executable image name, absolute path, command line arguments, parent process lineage, and username.
- Created `SysmonWatcherThread` consuming Windows Event Log for Sysmon Event IDs 1, 12, 13, and 14 with fallback to Security Event 4657.
- Developed `AlertManager` with a 5-second sliding-window deduplication filter and priority queues.
- Built `BaselineManager` for differential snapshots and system integrity auditing.
