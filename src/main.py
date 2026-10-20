import uvicorn
import os
import sys

def main():
    print("==========================================================")
    print("  WinReg-HIDS: Windows Registry Host Security Monitor    ")
    print("  Starting REST API and Background Registry Watchers...   ")
    print("==========================================================")
    uvicorn.run("src.api.app:app", host="0.0.0.0", port=8000, reload=False, log_level="info")

if __name__ == "__main__":
    main()
