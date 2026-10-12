import ctypes
import threading
import time
import winreg
from typing import Dict, Any, List, Callable, Optional
from ctypes import wintypes
from .snapshot_diff import SnapshotDiffEngine, get_hive_constant

advapi32 = ctypes.windll.advapi32
kernel32 = ctypes.windll.kernel32

# Win32 Constants
KEY_NOTIFY = 0x0010
KEY_READ = 0x20019
REG_NOTIFY_CHANGE_NAME = 0x00000001
REG_NOTIFY_CHANGE_ATTRIBUTES = 0x00000002
REG_NOTIFY_CHANGE_LAST_SET = 0x00000004
REG_NOTIFY_CHANGE_SECURITY = 0x00000008

WAIT_OBJECT_0 = 0x00000000
WAIT_TIMEOUT = 0x00000102

class KeyWatcherThread(threading.Thread):
    def __init__(self, hive: str, key_path: str, recursive: bool, 
                 callback: Callable[[List[Dict[str, Any]]], None], 
                 stop_event: threading.Event):
        super().__init__(daemon=True)
        self.hive = hive
        self.key_path = key_path
        self.recursive = recursive
        self.callback = callback
        self.stop_event = stop_event
        self.last_state = SnapshotDiffEngine.snapshot_key(hive, key_path)
        self.is_active = False

    def run(self):
        h_root = get_hive_constant(self.hive)
        filter_flags = (REG_NOTIFY_CHANGE_NAME | 
                        REG_NOTIFY_CHANGE_ATTRIBUTES | 
                        REG_NOTIFY_CHANGE_LAST_SET | 
                        REG_NOTIFY_CHANGE_SECURITY)

        while not self.stop_event.is_set():
            h_key = wintypes.HANDLE()
            status = advapi32.RegOpenKeyExW(
                wintypes.HKEY(h_root),
                self.key_path,
                0,
                KEY_NOTIFY | KEY_READ,
                ctypes.byref(h_key)
            )

            if status != 0:
                # Key may not exist yet or access denied; sleep and retry
                time.sleep(2.0)
                continue

            h_event = kernel32.CreateEventW(None, True, False, None)
            if not h_event:
                advapi32.RegCloseKey(h_key)
                time.sleep(2.0)
                continue

            self.is_active = True

            try:
                while not self.stop_event.is_set():
                    # Arm asynchronous notification
                    arm_status = advapi32.RegNotifyChangeKeyValue(
                        h_key,
                        self.recursive,
                        filter_flags,
                        h_event,
                        True  # Asynchronous
                    )

                    if arm_status != 0:
                        break

                    # Wait with 500ms timeout for responsive thread exit
                    wait_res = kernel32.WaitForSingleObject(h_event, 500)

                    if wait_res == WAIT_OBJECT_0:
                        # Event signaled! Compute snapshot diff
                        kernel32.ResetEvent(h_event)
                        new_state = SnapshotDiffEngine.snapshot_key(self.hive, self.key_path)
                        events = SnapshotDiffEngine.diff_snapshots(
                            self.hive, self.key_path, self.last_state, new_state
                        )
                        self.last_state = new_state
                        
                        if events:
                            for ev in events:
                                ev["source"] = "WIN32_NOTIFY"
                            self.callback(events)

                    elif wait_res == WAIT_TIMEOUT:
                        continue
                    else:
                        break
            finally:
                self.is_active = False
                kernel32.CloseHandle(h_event)
                advapi32.RegCloseKey(h_key)

class RegistryWatcher:
    """
    Supervises multiple Win32 KeyWatcherThreads across configured registry paths.
    """
    def __init__(self, key_configs: List[Dict[str, Any]], callback: Callable[[List[Dict[str, Any]]], None]):
        self.key_configs = key_configs
        self.callback = callback
        self.stop_event = threading.Event()
        self.threads: List[KeyWatcherThread] = []

    def start(self):
        self.stop_event.clear()
        for cfg in self.key_configs:
            hive = cfg["hive"]
            path = cfg["path"]
            recursive = cfg.get("recursive", False)
            t = KeyWatcherThread(hive, path, recursive, self.callback, self.stop_event)
            self.threads.append(t)
            t.start()

    def stop(self):
        self.stop_event.set()
        for t in self.threads:
            t.join(timeout=1.0)
        self.threads.clear()

    def active_watchers_count(self) -> int:
        return sum(1 for t in self.threads if t.is_alive() and t.is_active)
