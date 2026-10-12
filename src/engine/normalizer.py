import uuid
import re
from datetime import datetime
from typing import Optional, Literal, Dict, Any
from pydantic import BaseModel, Field

class ProcessMetadata(BaseModel):
    pid: Optional[int] = None
    process_guid: Optional[str] = None
    image_name: Optional[str] = None
    image_path: Optional[str] = None
    command_line: Optional[str] = None
    parent_pid: Optional[int] = None
    parent_image: Optional[str] = None
    parent_command_line: Optional[str] = None
    user_sid: Optional[str] = None
    user_name: Optional[str] = None

class NormalizedEvent(BaseModel):
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    source_event_id: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    source: Literal["WIN32_NOTIFY", "SYSMON", "SECURITY_AUDIT", "BASELINE_SCAN"] = "WIN32_NOTIFY"
    hive: Literal["HKLM", "HKCU", "HKCR", "HKU"] = "HKCU"
    key_path: str
    value_name: Optional[str] = None
    value_type: Optional[str] = None
    previous_data: Optional[str] = None
    new_data: Optional[str] = None
    operation: Literal["CREATE", "MODIFY", "DELETE", "RENAME"] = "CREATE"
    process: ProcessMetadata = Field(default_factory=ProcessMetadata)
    is_attributed: bool = False
    attribution_confidence: Literal["CONFIRMED", "INFERRED", "UNATTRIBUTED"] = "UNATTRIBUTED"

def canonicalize_key_path(path: str) -> str:
    """Standardizes registry path with single backslashes and trimmed spaces."""
    cleaned = re.sub(r"[\\/]+", r"\\", path.strip())
    return cleaned.strip("\\")

def normalize_raw_event(raw: Dict[str, Any], process_info: Optional[Dict[str, Any]] = None) -> NormalizedEvent:
    """
    Transforms a raw event dict into a typed NormalizedEvent instance.
    """
    hive = raw.get("hive", "HKCU").upper()
    if hive in ("HKEY_LOCAL_MACHINE", "MACHINE"):
        hive = "HKLM"
    elif hive in ("HKEY_CURRENT_USER", "USER"):
        hive = "HKCU"

    key_path = canonicalize_key_path(raw.get("key_path", ""))
    val_name = raw.get("value_name")
    val_type = raw.get("value_type")
    prev_data = raw.get("previous_data")
    new_data = raw.get("new_data")
    op = raw.get("operation", "MODIFY").upper()
    if op not in ("CREATE", "MODIFY", "DELETE", "RENAME"):
        op = "MODIFY"

    source = raw.get("source", "WIN32_NOTIFY")
    source_event_id = raw.get("source_event_id")
    
    proc_meta = ProcessMetadata()
    if process_info:
        proc_meta = ProcessMetadata(
            pid=process_info.get("pid"),
            process_guid=process_info.get("process_guid"),
            image_name=process_info.get("image_name"),
            image_path=process_info.get("image_path"),
            command_line=process_info.get("command_line"),
            parent_pid=process_info.get("parent_pid"),
            parent_image=process_info.get("parent_image"),
            parent_command_line=process_info.get("parent_command_line"),
            user_sid=process_info.get("user_sid"),
            user_name=process_info.get("user_name"),
        )
    elif raw.get("process_pid") or raw.get("process_image"):
        proc_meta = ProcessMetadata(
            pid=raw.get("process_pid"),
            process_guid=raw.get("process_guid"),
            image_name=raw.get("process_image", "").split("\\")[-1] if raw.get("process_image") else None,
            image_path=raw.get("process_image")
        )

    # Attribution Confidence Determination
    raw_confidence = raw.get("attribution_confidence")
    if raw_confidence in ("CONFIRMED", "INFERRED", "UNATTRIBUTED"):
        confidence = raw_confidence
    elif source == "SYSMON" and (proc_meta.pid or proc_meta.process_guid):
        confidence = "CONFIRMED"
    elif proc_meta.pid or proc_meta.image_path or proc_meta.image_name:
        confidence = "INFERRED"
    else:
        confidence = "UNATTRIBUTED"

    is_attr = (confidence != "UNATTRIBUTED")

    return NormalizedEvent(
        event_id=raw.get("event_id") or str(uuid.uuid4()),
        source_event_id=source_event_id,
        timestamp=raw.get("timestamp") or (datetime.utcnow().isoformat() + "Z"),
        source=source,
        hive=hive,
        key_path=key_path,
        value_name=val_name,
        value_type=val_type,
        previous_data=prev_data,
        new_data=new_data,
        operation=op,
        process=proc_meta,
        is_attributed=is_attr,
        attribution_confidence=confidence
    )
