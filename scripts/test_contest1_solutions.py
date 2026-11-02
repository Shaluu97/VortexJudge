# -*- coding: utf-8 -*-
import sqlite3
import os
import subprocess
import tempfile
import sys

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'data', 'database.sqlite'))
GXX = r"C:\msys64\ucrt64\bin\g++.exe"
JAVAC = r"C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot\bin\javac.exe"
JAVA = r"C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot\bin\java.exe"
PYTHON = sys.executable

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

cur.execute("""
    SELECT p.code, p.id, ce.code_cpp, ce.code_python, ce.code_java
    FROM contest_editorials ce
    JOIN problems p ON ce.problem_id = p.id
    WHERE ce.contest_id = 1
    ORDER BY p.code ASC
""")
rows = cur.fetchall()

print("=" * 60)
print(f"TESTING EDITORIAL SOLUTIONS FOR CONTEST 1 ({len(rows)} problems)")
print("=" * 60)

all_passed = True
tmp_dir = tempfile.mkdtemp(prefix="contest1_qa_")

for code, pid, cpp_code, py_code, java_code in rows:
    cur.execute("SELECT input_data, output_data FROM testcases WHERE problem_id = ? ORDER BY test_index ASC", (pid,))
    tests = cur.fetchall()
    print(f"\nProblem {code} (ID: {pid}) with {len(tests)} testcases:")

    # 1. Test Python
    py_ok = True
    py_file = os.path.join(tmp_dir, f"sol_{code}.py")
    with open(py_file, "w", encoding="utf-8") as f:
        f.write(py_code)
    for idx, (tin, tout) in enumerate(tests, 1):
        p = subprocess.run([PYTHON, py_file], input=tin, text=True, capture_output=True, timeout=5)
        got = p.stdout.strip().split()
        expected = tout.strip().split()
        if got != expected:
            print(f"   [FAIL Python] Test {idx}: Expected {expected}, got {got}")
            py_ok = False
            all_passed = False
            break
    if py_ok:
        print(f"   [PASS] Python 3: All {len(tests)} testcases Accepted!")

    # 2. Test C++
    if os.path.exists(GXX):
        cpp_ok = True
        cpp_file = os.path.join(tmp_dir, f"sol_{code}.cpp")
        cpp_exe = os.path.join(tmp_dir, f"sol_{code}.exe")
        with open(cpp_file, "w", encoding="utf-8") as f:
            f.write(cpp_code)
        comp = subprocess.run([GXX, "-O2", "-std=c++17", cpp_file, "-o", cpp_exe], capture_output=True, text=True, env={"PATH": r"C:\msys64\ucrt64\bin;" + os.environ.get("PATH", "")})
        if comp.returncode != 0:
            print(f"   [FAIL C++ Compile]: {comp.stderr}")
            all_passed = False
        else:
            for idx, (tin, tout) in enumerate(tests, 1):
                p = subprocess.run([cpp_exe], input=tin, text=True, capture_output=True, timeout=5, env={"PATH": r"C:\msys64\ucrt64\bin;" + os.environ.get("PATH", "")})
                got = p.stdout.strip().split()
                expected = tout.strip().split()
                if got != expected:
                    print(f"   [FAIL C++] Test {idx}: Expected {expected}, got {got}")
                    cpp_ok = False
                    all_passed = False
                    break
            if cpp_ok:
                print(f"   [PASS] C++: All {len(tests)} testcases Accepted!")

    # 3. Test Java
    if os.path.exists(JAVAC):
        java_ok = True
        p_java_dir = os.path.join(tmp_dir, f"java_{code}")
        os.makedirs(p_java_dir, exist_ok=True)
        java_file = os.path.join(p_java_dir, "Solution.java")
        with open(java_file, "w", encoding="utf-8") as f:
            f.write(java_code)
        comp = subprocess.run([JAVAC, java_file], capture_output=True, text=True)
        if comp.returncode != 0:
            print(f"   [FAIL Java Compile]: {comp.stderr}")
            all_passed = False
        else:
            for idx, (tin, tout) in enumerate(tests, 1):
                p = subprocess.run([JAVA, "-cp", p_java_dir, "Solution"], input=tin, text=True, capture_output=True, timeout=5)
                got = p.stdout.strip().split()
                expected = tout.strip().split()
                if got != expected:
                    print(f"   [FAIL Java] Test {idx}: Expected {expected}, got {got}")
                    java_ok = False
                    all_passed = False
                    break
            if java_ok:
                print(f"   [PASS] Java: All {len(tests)} testcases Accepted!")

print("\n" + "=" * 60)
if all_passed:
    print("ALL CONTEST 1 EDITORIAL SOLUTIONS PASSED WITH ACCEPTED (AC)!")
else:
    print("SOME SOLUTIONS FAILED!")
print("=" * 60)

conn.close()
