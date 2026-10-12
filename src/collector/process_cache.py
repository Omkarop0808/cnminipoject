import threading
import time
from typing import Dict, Any, Optional
import psutil

class ProcessCache:
    """
    Thread-safe process cache and real-time process metadata resolver.
    """
    def __init__(self, max_entries: int = 5000):
        self.max_entries = max_entries
        self.lock = threading.Lock()
        self._cache: Dict[int, Dict[str, Any]] = {}
        self._guid_map: Dict[str, int] = {}

    def update_from_event(self, pid: int, image_path: str, command_line: str, 
                          parent_pid: Optional[int] = None, parent_image: Optional[str] = None, 
                          user: Optional[str] = None, process_guid: Optional[str] = None):
        """Updates cache when a process creation event (Sysmon Event ID 1) is detected."""
        with self.lock:
            image_name = image_path.split("\\")[-1] if image_path else "unknown.exe"
            info = {
                "pid": pid,
                "process_guid": process_guid,
                "image_name": image_name,
                "image_path": image_path,
                "command_line": command_line,
                "parent_pid": parent_pid,
                "parent_image": parent_image,
                "user_name": user,
                "attribution_confidence": "CONFIRMED",
                "timestamp": time.time()
            }
            self._cache[pid] = info
            if process_guid:
                self._guid_map[process_guid] = pid

            if len(self._cache) > self.max_entries:
                oldest_pid = min(self._cache, key=lambda k: self._cache[k]["timestamp"])
                old_info = self._cache.pop(oldest_pid, None)
                if old_info and old_info.get("process_guid"):
                    self._guid_map.pop(old_info["process_guid"], None)

    def resolve_pid(self, pid: Optional[int] = None, process_guid: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Resolves process info from cache, falling back to psutil for live processes."""
        with self.lock:
            if process_guid and process_guid in self._guid_map:
                target_pid = self._guid_map[process_guid]
                if target_pid in self._cache:
                    return dict(self._cache[target_pid])
            if pid and pid in self._cache:
                return dict(self._cache[pid])

        if not pid:
            return None

        # Fallback to psutil for live process inspection (attributed as INFERRED)
        try:
            p = psutil.Process(pid)
            parent = p.parent()
            parent_pid = parent.pid if parent else None
            parent_img = parent.exe() if parent else None
            
            info = {
                "pid": pid,
                "process_guid": None,
                "image_name": p.name(),
                "image_path": p.exe(),
                "command_line": " ".join(p.cmdline()) if p.cmdline() else p.name(),
                "parent_pid": parent_pid,
                "parent_image": parent_img,
                "user_name": p.username() if hasattr(p, "username") else None,
                "attribution_confidence": "INFERRED",
                "timestamp": time.time()
            }
            with self.lock:
                self._cache[pid] = info
            return info
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            return None

    def get_current_process_info(self) -> Dict[str, Any]:
        """Returns metadata for the current running Python process."""
        p = psutil.Process()
        parent = p.parent()
        return {
            "pid": p.pid,
            "image_name": p.name(),
            "image_path": p.exe(),
            "command_line": " ".join(p.cmdline()) if p.cmdline() else p.name(),
            "parent_pid": parent.pid if parent else None,
            "parent_image": parent.exe() if parent else None,
            "user_name": p.username() if hasattr(p, "username") else None,
            "timestamp": time.time()
        }

# Global Singleton Process Cache
process_cache = ProcessCache()
