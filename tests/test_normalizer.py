from src.engine.normalizer import normalize_raw_event, canonicalize_key_path

def test_canonicalize_key_path():
    p1 = r"//Software\\Microsoft///Windows//CurrentVersion\Run/"
    c1 = canonicalize_key_path(p1)
    assert c1 == r"Software\Microsoft\Windows\CurrentVersion\Run"

def test_normalize_raw_event():
    raw = {
        "hive": "HKEY_LOCAL_MACHINE",
        "key_path": r"Software\Microsoft\Windows\CurrentVersion\Run",
        "value_name": "TestService",
        "value_type": "REG_SZ",
        "new_data": r"C:\app.exe",
        "operation": "create",
        "source": "WIN32_NOTIFY"
    }
    proc_info = {
        "pid": 5050,
        "image_name": "powershell.exe",
        "image_path": r"C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe",
        "command_line": "powershell.exe -enc ...",
        "user_name": "SYSTEM"
    }

    norm = normalize_raw_event(raw, proc_info)
    assert norm.hive == "HKLM"
    assert norm.operation == "CREATE"
    assert norm.is_attributed is True
    assert norm.process.pid == 5050
    assert norm.process.image_name == "powershell.exe"
