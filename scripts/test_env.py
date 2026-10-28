import os
import sys
import json
import sqlite3
import subprocess
import shutil
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
PROBLEMS_DIR = REPO_ROOT / "problems"
DB_PATH = REPO_ROOT / "data" / "database.sqlite"

ENV = dict(os.environ)
ENV["PATH"] = r"C:\msys64\ucrt64\bin;C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot\bin;" + ENV.get("PATH", "")
CXX = r"C:\msys64\ucrt64\bin\g++.exe" if Path(r"C:\msys64\ucrt64\bin\g++.exe").exists() else "g++"
JAVAC = r"C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot\bin\javac.exe" if Path(r"C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot\bin\javac.exe").exists() else "javac"
JAVA = r"C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot\bin\java.exe" if Path(r"C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot\bin\java.exe").exists() else "java"
PYTHON_EXE = sys.executable

print("Environment paths verified:")
print("CXX:", CXX)
print("JAVAC:", JAVAC)
print("JAVA:", JAVA)
print("PYTHON:", PYTHON_EXE)
