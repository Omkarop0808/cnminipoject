import threading
import time
import xml.etree.ElementTree as ET
from typing import Callable, Dict, Any, Optional
from .process_cache import process_cache

try:
    import win32evtlog
    HAS_WIN32EVTLOG = True
except ImportError:
    HAS_WIN32EVTLOG = False

class SysmonWatcherThread(threading.Thread):
    def __init__(self, callback: Callable[[Dict[str, Any]], None], 
                 channel: str = "Microsoft-Windows-Sysmon/Operational",
                 stop_event: Optional[threading.Event] = None):
        super().__init__(daemon=True)
        self.callback = callback
        self.channel = channel
        self.stop_event = stop_event or threading.Event()
        self.is_active = False

    def run(self):
        if not HAS_WIN32EVTLOG:
            return

        flags = win32evtlog.EvtSubscribeToFutureEvents
        try:
            h_sub = win32evtlog.EvtSubscribe(
                self.channel,
                flags,
                None,
                None,
                None,
                None
            )
            self.is_active = True
        except Exception:
            # Sysmon may not be installed or configured on this endpoint
            self.is_active = False
            return

        try:
            while not self.stop_event.is_set():
                events = win32evtlog.EvtNext(h_sub, 10, 1000, 0)
                if not events:
                    continue

                for h_ev in events:
                    try:
                        xml_data = win32evtlog.EvtRender(h_ev, win32evtlog.EvtRenderEventXml)
                        self._process_event_xml(xml_data)
                    except Exception:
                        pass
        finally:
            self.is_active = False

    def _process_event_xml(self, xml_str: str):
        try:
            root = ET.fromstring(xml_str)
            ns = {"ns": "http://schemas.microsoft.com/win/2004/08/events/event"}
            
            system = root.find("ns:System", ns)
            if system is None:
                return

            event_id_elem = system.find("ns:EventID", ns)
            if event_id_elem is None:
                return
            event_id = int(event_id_elem.text)

            event_data = root.find("ns:EventData", ns)
            data_map: Dict[str, str] = {}
            if event_data is not None:
                for data_item in event_data.findall("ns:Data", ns):
                    name = data_item.attrib.get("Name")
                    val = data_item.text or ""
                    if name:
                        data_map[name] = val

            # Event ID 1: Process Creation
            if event_id == 1:
                pid = int(data_map.get("ProcessId", 0))
                guid = data_map.get("ProcessGuid")
                image = data_map.get("Image", "")
                cmd = data_map.get("CommandLine", "")
                parent_pid = int(data_map.get("ParentProcessId", 0)) if data_map.get("ParentProcessId") else None
                parent_img = data_map.get("ParentImage")
                user = data_map.get("User")
                if pid:
                    process_cache.update_from_event(
                        pid=pid,
                        image_path=image,
                        command_line=cmd,
                        parent_pid=parent_pid,
                        parent_image=parent_img,
                        user=user,
                        process_guid=guid
                    )

            # Event ID 12 (Create/Delete), 13 (SetValue), 14 (Rename)
            elif event_id in (12, 13, 14):
                target_object = data_map.get("TargetObject", "")
                details = data_map.get("Details")
                event_type = data_map.get("EventType", "")
                pid = int(data_map.get("ProcessId", 0)) if data_map.get("ProcessId") else None
                guid = data_map.get("ProcessGuid")
                image = data_map.get("Image", "")

                # Split target_object into Hive and Key Path
                hive = "HKLM"
                key_path = target_object
                if target_object.startswith("\\REGISTRY\\MACHINE\\"):
                    hive = "HKLM"
                    key_path = target_object.replace("\\REGISTRY\\MACHINE\\", "")
                elif target_object.startswith("\\REGISTRY\\USER\\"):
                    hive = "HKCU"
                    # User subkeys typically have SID\path
                    parts = target_object.replace("\\REGISTRY\\USER\\", "").split("\\", 1)
                    key_path = parts[1] if len(parts) > 1 else parts[0]

                val_name = None
                if event_id == 13 and "\\" in key_path:
                    key_path, val_name = key_path.rsplit("\\", 1)

                op = "MODIFY"
                if "create" in event_type.lower() or event_id == 12:
                    op = "CREATE"
                elif "delete" in event_type.lower():
                    op = "DELETE"
                elif event_id == 14:
                    op = "RENAME"

                raw_event = {
                    "source": "SYSMON",
                    "source_event_id": f"Sysmon-{event_id}",
                    "hive": hive,
                    "key_path": key_path,
                    "value_name": val_name,
                    "value_type": "REG_SZ",
                    "previous_data": None,
                    "new_data": details,
                    "operation": op,
                    "process_pid": pid,
                    "process_guid": guid,
                    "process_image": image,
                    "attribution_confidence": "CONFIRMED"
                }
                self.callback(raw_event)

        except Exception:
            pass
