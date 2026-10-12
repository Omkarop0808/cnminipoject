import winreg
import hashlib
from typing import Dict, Any, List, Tuple, Optional

HIVE_MAP = {
    "HKLM": winreg.HKEY_LOCAL_MACHINE,
    "HKEY_LOCAL_MACHINE": winreg.HKEY_LOCAL_MACHINE,
    "HKCU": winreg.HKEY_CURRENT_USER,
    "HKEY_CURRENT_USER": winreg.HKEY_CURRENT_USER,
    "HKCR": winreg.HKEY_CLASSES_ROOT,
    "HKEY_CLASSES_ROOT": winreg.HKEY_CLASSES_ROOT,
    "HKU": winreg.HKEY_USERS,
    "HKEY_USERS": winreg.HKEY_USERS,
}

REG_TYPES = {
    winreg.REG_SZ: "REG_SZ",
    winreg.REG_EXPAND_SZ: "REG_EXPAND_SZ",
    winreg.REG_BINARY: "REG_BINARY",
    winreg.REG_DWORD: "REG_DWORD",
    winreg.REG_DWORD_BIG_ENDIAN: "REG_DWORD_BIG_ENDIAN",
    winreg.REG_MULTI_SZ: "REG_MULTI_SZ",
    winreg.REG_QWORD: "REG_QWORD",
    winreg.REG_NONE: "REG_NONE",
}

def get_hive_constant(hive_str: str) -> int:
    hive_upper = hive_str.upper().strip()
    if hive_upper in HIVE_MAP:
        return HIVE_MAP[hive_upper]
    raise ValueError(f"Unknown registry hive: {hive_str}")

def serialize_registry_value(raw_data: Any, reg_type: int) -> Tuple[str, str]:
    """
    Serializes a registry value into a safe string representation and SHA-256 hash.
    Returns (string_representation, sha256_hex_hash).
    """
    if reg_type in (winreg.REG_SZ, winreg.REG_EXPAND_SZ):
        s = str(raw_data)
        data_hash = hashlib.sha256(s.encode("utf-8", errors="replace")).hexdigest()
        return s, data_hash
    elif reg_type in (winreg.REG_DWORD, winreg.REG_QWORD):
        s = str(raw_data)
        data_hash = hashlib.sha256(s.encode("utf-8")).hexdigest()
        return s, data_hash
    elif reg_type == winreg.REG_MULTI_SZ:
        s = "\n".join(str(item) for item in raw_data)
        data_hash = hashlib.sha256(s.encode("utf-8", errors="replace")).hexdigest()
        return s, data_hash
    elif reg_type == winreg.REG_BINARY:
        if isinstance(raw_data, (bytes, bytearray)):
            hex_str = raw_data.hex()
            data_hash = hashlib.sha256(raw_data).hexdigest()
            return hex_str[:1024], data_hash
        s = str(raw_data)
        return s, hashlib.sha256(s.encode("utf-8")).hexdigest()
    else:
        s = str(raw_data)
        return s, hashlib.sha256(s.encode("utf-8", errors="replace")).hexdigest()

class SnapshotDiffEngine:
    @staticmethod
    def snapshot_key(hive: str, key_path: str) -> Dict[str, Any]:
        """
        Takes an instantaneous snapshot of a registry key's subkeys and values.
        Returns:
            {
                "subkeys": set of subkey names,
                "values": { value_name: { "type": str, "data": str, "hash": str } }
            }
        """
        h_root = get_hive_constant(hive)
        result: Dict[str, Any] = {"subkeys": set(), "values": {}}
        
        try:
            with winreg.OpenKey(h_root, key_path, 0, winreg.KEY_READ) as h_key:
                # 1. Enumerate subkeys
                index = 0
                while True:
                    try:
                        subkey = winreg.EnumKey(h_key, index)
                        result["subkeys"].add(subkey)
                        index += 1
                    except OSError:
                        break

                # 2. Enumerate values
                index = 0
                while True:
                    try:
                        v_name, v_data, v_type = winreg.EnumValue(h_key, index)
                        val_str, val_hash = serialize_registry_value(v_data, v_type)
                        type_name = REG_TYPES.get(v_type, f"REG_UNKNOWN({v_type})")
                        result["values"][v_name] = {
                            "type": type_name,
                            "data": val_str,
                            "hash": val_hash
                        }
                        index += 1
                    except OSError:
                        break
        except (FileNotFoundError, PermissionError):
            pass
            
        return result

    @staticmethod
    def diff_snapshots(hive: str, key_path: str, old_state: Dict[str, Any], new_state: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Compares two snapshots and generates atomic mutation events.
        """
        events: List[Dict[str, Any]] = []
        old_vals = old_state.get("values", {})
        new_vals = new_state.get("values", {})

        # Detect new values or modified values
        for v_name, v_info in new_vals.items():
            if v_name not in old_vals:
                events.append({
                    "hive": hive,
                    "key_path": key_path,
                    "value_name": v_name,
                    "value_type": v_info["type"],
                    "previous_data": None,
                    "new_data": v_info["data"],
                    "operation": "CREATE"
                })
            elif old_vals[v_name]["hash"] != v_info["hash"]:
                events.append({
                    "hive": hive,
                    "key_path": key_path,
                    "value_name": v_name,
                    "value_type": v_info["type"],
                    "previous_data": old_vals[v_name]["data"],
                    "new_data": v_info["data"],
                    "operation": "MODIFY"
                })

        # Detect deleted values
        for v_name, v_info in old_vals.items():
            if v_name not in new_vals:
                events.append({
                    "hive": hive,
                    "key_path": key_path,
                    "value_name": v_name,
                    "value_type": v_info["type"],
                    "previous_data": v_info["data"],
                    "new_data": None,
                    "operation": "DELETE"
                })

        # Detect created and deleted subkeys
        old_subs = old_state.get("subkeys", set())
        new_subs = new_state.get("subkeys", set())

        for s in new_subs - old_subs:
            events.append({
                "hive": hive,
                "key_path": f"{key_path}\\{s}",
                "value_name": None,
                "value_type": None,
                "previous_data": None,
                "new_data": None,
                "operation": "CREATE"
            })

        for s in old_subs - new_subs:
            events.append({
                "hive": hive,
                "key_path": f"{key_path}\\{s}",
                "value_name": None,
                "value_type": None,
                "previous_data": None,
                "new_data": None,
                "operation": "DELETE"
            })

        return events
