# -*- coding: utf-8 -*-
"""
Build 20 Complete Contest:
- Validates all 20 problems across C++20, Python 3, and Java 21 on 25-30 testcases each
- Writes problem packages to problems/
- Deploys problems, testcases, Contest 6, and contest_editorials to data/database.sqlite
"""
import os
import sys
import shutil
import sqlite3
import subprocess
import tempfile

# Force UTF-8 stdout
sys.stdout.reconfigure(encoding='utf-8')

from contest20_problems_1_10 import PROBLEMS_1_10
from contest20_problems_11_20 import PROBLEMS_11_20

ALL_PROBLEMS = PROBLEMS_1_10 + PROBLEMS_11_20

# Compiler configurations
GXX = r"C:\msys64\ucrt64\bin\g++.exe"
JAVAC = r"C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot\bin\javac.exe"
JAVA = r"C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot\bin\java.exe"
PYTHON = sys.executable

ENV = os.environ.copy()
ENV["PATH"] = r"C:\msys64\ucrt64\bin;" + r"C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot\bin;" + ENV.get("PATH", "")

def normalize_output(text):
    return text.strip().split()

def run_qa_tests():
    print("=" * 70)
    print("STARTING QA TEST VERIFICATION FOR 20 PROBLEMS (C++, PYTHON, JAVA)")
    print("=" * 70)
    
    tmp_dir = tempfile.mkdtemp(prefix="cp20_qa_")
    all_passed = True

    try:
        for idx, p in enumerate(ALL_PROBLEMS, 1):
            letter = p["letter"]
            code = p["code"]
            slug = p["slug"]
            tests = p["tests"]
            print(f"\n[{idx}/20] Checking Problem {letter} ({code}: {p['title']}) with {len(tests)} testcases...")

            # 1. Compile C++
            cpp_src = os.path.join(tmp_dir, f"sol_{code}.cpp")
            cpp_exe = os.path.join(tmp_dir, f"sol_{code}.exe")
            with open(cpp_src, "w", encoding="utf-8") as f:
                f.write(p["cpp"])
            
            comp_cpp = subprocess.run(
                [GXX, "-std=c++20", "-O2", "-static", cpp_src, "-o", cpp_exe],
                capture_output=True, text=True, env=ENV
            )
            if comp_cpp.returncode != 0:
                print(f"  [!] C++ Compilation Failed: {comp_cpp.stderr}")
                all_passed = False
                continue

            # 2. Compile Java
            java_class_name = f"Solution{code[-2:]}"
            java_src = os.path.join(tmp_dir, f"{java_class_name}.java")
            with open(java_src, "w", encoding="utf-8") as f:
                f.write(p["java"])
            
            comp_java = subprocess.run(
                [JAVAC, java_src],
                capture_output=True, text=True, env=ENV
            )
            if comp_java.returncode != 0:
                print(f"  [!] Java Compilation Failed: {comp_java.stderr}")
                all_passed = False
                continue

            # 3. Save Python
            py_src = os.path.join(tmp_dir, f"sol_{code}.py")
            with open(py_src, "w", encoding="utf-8") as f:
                f.write(p["py"])

            # 4. Run all tests for all 3 languages
            cpp_ok = 0
            py_ok = 0
            java_ok = 0

            for t_idx, (t_in, t_out) in enumerate(tests, 1):
                exp = normalize_output(t_out)

                # Test C++
                proc_cpp = subprocess.run(
                    [cpp_exe],
                    input=t_in, capture_output=True, text=True, timeout=5, env=ENV
                )
                if proc_cpp.returncode == 0 and normalize_output(proc_cpp.stdout) == exp:
                    cpp_ok += 1
                else:
                    print(f"  [!] C++ Failed on test {t_idx}: expected {exp}, got {normalize_output(proc_cpp.stdout)}")

                # Test Python
                proc_py = subprocess.run(
                    [PYTHON, py_src],
                    input=t_in, capture_output=True, text=True, timeout=5, env=ENV
                )
                if proc_py.returncode == 0 and normalize_output(proc_py.stdout) == exp:
                    py_ok += 1
                else:
                    print(f"  [!] Python Failed on test {t_idx}: expected {exp}, got {normalize_output(proc_py.stdout)}")

                # Test Java
                proc_java = subprocess.run(
                    [JAVA, "-cp", tmp_dir, java_class_name],
                    input=t_in, capture_output=True, text=True, timeout=5, env=ENV
                )
                if proc_java.returncode == 0 and normalize_output(proc_java.stdout) == exp:
                    java_ok += 1
                else:
                    print(f"  [!] Java Failed on test {t_idx}: expected {exp}, got {normalize_output(proc_java.stdout)}")

            total_t = len(tests)
            if cpp_ok == total_t and py_ok == total_t and java_ok == total_t:
                print(f"  --> C++20: {cpp_ok}/{total_t} AC | Python 3: {py_ok}/{total_t} AC | Java 21: {java_ok}/{total_t} AC (100% ACCEPTED)")
            else:
                print(f"  --> C++: {cpp_ok}/{total_t}, Py: {py_ok}/{total_t}, Java: {java_ok}/{total_t} FAILED")
                all_passed = False

    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)

    return all_passed

def save_problems_to_disk():
    print("\n" + "=" * 70)
    print("SAVING PROBLEMS AND TESTS TO DISK (problems/ directory)")
    print("=" * 70)
    
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "problems"))
    os.makedirs(base_dir, exist_ok=True)

    for p in ALL_PROBLEMS:
        slug = p["slug"]
        p_dir = os.path.join(base_dir, slug)
        os.makedirs(os.path.join(p_dir, "statement"), exist_ok=True)
        os.makedirs(os.path.join(p_dir, "solutions"), exist_ok=True)
        os.makedirs(os.path.join(p_dir, "tests"), exist_ok=True)

        # Write statement
        stmt_path = os.path.join(p_dir, "statement", "statement.md")
        with open(stmt_path, "w", encoding="utf-8") as f:
            f.write(f"# {p['letter']}. {p['title']}\n\n")
            f.write(p["statement"] + "\n\n")
            f.write("### Kiruvchi ma'lumotlar\n" + p["input_format"] + "\n\n")
            f.write("### Chiquvchi ma'lumotlar\n" + p["output_format"] + "\n\n")
            f.write("### Izoh\n" + p["note"] + "\n")

        # Write solutions
        with open(os.path.join(p_dir, "solutions", "acc.cpp"), "w", encoding="utf-8") as f:
            f.write(p["cpp"])
        with open(os.path.join(p_dir, "solutions", "acc.py"), "w", encoding="utf-8") as f:
            f.write(p["py"])
        with open(os.path.join(p_dir, "solutions", f"Solution{p['code'][-2:]}.java"), "w", encoding="utf-8") as f:
            f.write(p["java"])

        # Write tests
        for t_idx, (t_in, t_out) in enumerate(p["tests"], 1):
            prefix = f"{t_idx:02d}"
            with open(os.path.join(p_dir, "tests", f"{prefix}.in"), "w", encoding="utf-8") as f:
                f.write(t_in)
            with open(os.path.join(p_dir, "tests", f"{prefix}.out"), "w", encoding="utf-8") as f:
                f.write(t_out)
        
        print(f"  Saved {slug} ({len(p['tests'])} tests)")

def deploy_to_database():
    print("\n" + "=" * 70)
    print("DEPLOYING TO SQLITE DATABASE (data/database.sqlite)")
    print("=" * 70)

    db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "database.sqlite"))
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # 1. Insert or update Contest 6
    contest_id = 6
    contest_title = "Informatika va Sport Dasturlashi — 20 ta Saralangan Masala"
    contest_desc = (
        "O'zbek tilidagi qiziqarli, ertaknamo va chuqur algoritmik mantiqqa asoslangan 20 ta original masaladan "
        "iborat maxsus olimpiada kontesti. Har bir masala uchun batafsil tahlil (Editorial) va uch dasturlash tilida "
        "(C++, Python, Java) namunaviy yechimlar taqdim etilgan."
    )

    cur.execute("""
        INSERT OR REPLACE INTO contests (
            id, title, description, start_time, end_time, duration,
            rules, participation_mode, participation_type, is_active,
            editorial_published, default_language, allowed_programming_languages
        ) VALUES (
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?
        )
    """, (
        contest_id, contest_title, contest_desc, "2026-10-28T09:00", "2026-11-28T18:00", "04:00",
        "ICPC", "NORMAL", "INDIVIDUAL", 1,
        0, "uz", "cpp,python,java"
    ))

    # Clear previous contest links and editorials for contest 6
    cur.execute("DELETE FROM contest_problems WHERE contest_id = ?", (contest_id,))
    cur.execute("DELETE FROM contest_editorials WHERE contest_id = ?", (contest_id,))

    # 2. Insert Problems, Testcases, Contest Links, and Editorials
    for order, p in enumerate(ALL_PROBLEMS, 1):
        prob_id = int(p["code"])
        code = f"P{p['code']}"
        letter = p["letter"]
        title = p["title"]
        slug = p["slug"]
        stmt = p["statement"]
        inp_fmt = p["input_format"]
        out_fmt = p["output_format"]
        note = p["note"]
        time_lim = p["time_limit"]
        mem_lim = p["memory_limit"]
        diff = 800 + (order - 1) * 50

        # Insert / Update problem
        cur.execute("""
            INSERT OR REPLACE INTO problems (
                id, code, title, statement, input_format, output_format,
                note, time_limit, memory_limit, difficulty, score,
                checker_type, is_active, category, is_secret, is_public, visibility
            ) VALUES (
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?
            )
        """, (
            prob_id, code, title, stmt, inp_fmt, out_fmt,
            note, time_lim, mem_lim, diff, 100,
            "token", 1, "contest", 1, 0, "RESTRICTED"
        ))

        # Insert Testcases
        cur.execute("DELETE FROM testcases WHERE problem_id = ?", (prob_id,))
        for t_idx, (t_in, t_out) in enumerate(p["tests"], 1):
            is_sample = 1 if t_idx <= 2 else 0
            cur.execute("""
                INSERT INTO testcases (
                    problem_id, test_index, input_data, output_data, is_sample, points
                ) VALUES (?, ?, ?, ?, ?, ?)
            """, (
                prob_id, t_idx, t_in, t_out, is_sample, 100 // len(p["tests"])
            ))

        # Link to Contest 6
        cur.execute("""
            INSERT INTO contest_problems (
                contest_id, problem_id, problem_order, letter, score, letter_index
            ) VALUES (?, ?, ?, ?, ?, ?)
        """, (
            contest_id, prob_id, order, letter, 100, order - 1
        ))

        # Insert Editorial
        cur.execute("""
            INSERT INTO contest_editorials (
                contest_id, problem_id, explanation, code_cpp, code_python, code_java, is_published, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        """, (
            contest_id, prob_id, p["explanation"], p["cpp"], p["py"], p["java"], 1
        ))

        print(f"  [DB] Deployed {letter}: {title} (ID: {prob_id}) with {len(p['tests'])} tests and Editorial")

    conn.commit()
    conn.close()
    print("\nDatabase deployment completed successfully!")

if __name__ == '__main__':
    print("Initiating 20 Contest Problems Build & Verification Pipeline...")
    passed = run_qa_tests()
    if not passed:
        print("\n[ERROR] One or more QA tests failed. Fix errors before deploying.")
        sys.exit(1)
    
    save_problems_to_disk()
    deploy_to_database()
    print("\nALL 20 PROBLEMS VERIFIED, SAVED, AND DEPLOYED!")
