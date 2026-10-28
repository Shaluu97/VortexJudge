"""
Deployment script: Imports all 15 Viloyat Olympiad problems and creates 3 separate contests
in the local RoboContest Offline platform (http://localhost:3000/admin, SQLite database).
"""

import os
import re
import shutil
import sqlite3
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT))
PROBLEMS_DIR = REPO_ROOT / "problems"
LOCAL_DB = REPO_ROOT / "data" / "database.sqlite"
FALLBACK_DB = Path(r"D:\RoboContest_Offline_Server\data\database.sqlite")
DB_PATH = LOCAL_DB if LOCAL_DB.parent.exists() else FALLBACK_DB

ENV = dict(os.environ)
ENV["PATH"] = r"C:\msys64\ucrt64\bin;" + ENV.get("PATH", "")

CXX = "g++"
CXXFLAGS = [
    "-std=c++17",
    "-O2",
    "-Wall",
    "-Wextra",
    f"-I{TESTLIB_DIR}"
]

from scripts.data_grade9 import PROBLEMS_9
from scripts.data_grade10 import PROBLEMS_10
from scripts.data_grade11 import PROBLEMS_11

CONTESTS_DEF = [
    {
        "id": "grade_9",
        "title": "Informatika Viloyat Bosqichi — 9-sinf Olimpiada Kontesti",
        "grade": 9,
        "description": (
            "O'zbekiston Respublikasi fan olimpiadalari viloyat bosqichi standart matritsasi asosidagi 9-sinf olimpiadasi.\n\n"
            "Mavzular taqsimoti:\n"
            "• A masalasi (7 ball): Ad-hoc, Prefiks maksimum (O(N))\n"
            "• B masalasi (7 ball): Raqamlar nazariyasi, EKUB va tublik tekshirish\n"
            "• C masalasi (10 ball): Saralash va Prefiks yig'indilar\n"
            "• D masalasi (10 ball): Dinamik dasturlash, 0/1 Ryukzak (Knapsack DP)\n"
            "• E masalasi (16 ball): Kombinatorika, Aylanani bo'yash (Rekursiya / Modulo)\n\n"
            "Davomiyligi: 3 soat. Jami: 5 ta masala, 50 ball."
        ),
        "code_prefix": "090",
        "problems": PROBLEMS_9,
        "codes": ["0901", "0902", "0903", "0904", "0905"],
        "letters": ["A", "B", "C", "D", "E"],
        "scores": [7, 7, 10, 10, 16],
        "category": "9-sinf Viloyat"
    },
    {
        "id": "grade_10",
        "title": "Informatika Viloyat Bosqichi — 10-sinf Olimpiada Kontesti",
        "grade": 10,
        "description": (
            "O'zbekiston Respublikasi fan olimpiadalari viloyat bosqichi standart matritsasi asosidagi 10-sinf olimpiadasi.\n\n"
            "Mavzular taqsimoti:\n"
            "• A masalasi (7 ball): Ad-hoc, Bir yo'nalishli tekislash (O(N))\n"
            "• B masalasi (7 ball): Modul arifmetikasi, Daraja va Teskari element (Fermat)\n"
            "• C masalasi (10 ball): Javob bo'yicha Ikkilik Qidiruv (Binary Search on Answer)\n"
            "• D masalasi (10 ball): 2D Jadval (Grid) bo'ylab Minimal Xarajatli Yo'l DP\n"
            "• E masalasi (16 ball): Graflar nazariyasi, Eng qisqa yo'l (Dijkstra algoritmi)\n\n"
            "Davomiyligi: 3 soat. Jami: 5 ta masala, 50 ball."
        ),
        "code_prefix": "100",
        "problems": PROBLEMS_10,
        "codes": ["1006", "1007", "1008", "1009", "1010"],
        "letters": ["A", "B", "C", "D", "E"],
        "scores": [7, 7, 10, 10, 16],
        "category": "10-sinf Viloyat"
    },
    {
        "id": "grade_11",
        "title": "Informatika Viloyat Bosqichi — 11-sinf Olimpiada Kontesti",
        "grade": 11,
        "description": (
            "O'zbekiston Respublikasi fan olimpiadalari viloyat bosqichi standart matritsasi asosidagi 11-sinf olimpiadasi.\n\n"
            "Mavzular taqsimoti:\n"
            "• A masalasi (7 ball): Ad-hoc, Prefiks va suffiks muvozanati (O(N))\n"
            "• B masalasi (7 ball): Ochko'z saralash, Intervallar bilan ishlash (Interval Scheduling)\n"
            "• C masalasi (10 ball): Ikki ko'rsatkich, Sirpanuvchi oyna (Two Pointers / Sliding Window)\n"
            "• D masalasi (10 ball): Eng uzun o'suvchi qism-ketma-ketlik (LIS, O(N log N))\n"
            "• E masalasi (16 ball): Daraxtlar ustida amallar, Daraxt diametri (O(N))\n\n"
            "Davomiyligi: 3 soat. Jami: 5 ta masala, 50 ball."
        ),
        "code_prefix": "110",
        "problems": PROBLEMS_11,
        "codes": ["1101", "1102", "1103", "1104", "1105"],
        "letters": ["A", "B", "C", "D", "E"],
        "scores": [7, 7, 10, 10, 16],
        "category": "11-sinf Viloyat"
    }
]

def clean_latex(txt: str) -> str:
    txt = re.sub(r'\\textbf\{\\Large\s*[^}]+\}', '', txt)
    txt = re.sub(r'\\textbf\{([^}]+)\}', r'**\1**', txt)
    txt = re.sub(r'\\begin\{itemize\}', '', txt)
    txt = re.sub(r'\\end\{itemize\}', '', txt)
    txt = re.sub(r'\\item\s*', '- ', txt)
    txt = txt.replace('~---', ' — ').replace('---', ' — ')
    txt = txt.replace(r'\leq', r'\le').replace(r'\geq', r'\ge').replace(r'\times', r'\times').replace(r'\ldots', r'...')
    return txt.strip()

def parse_statement(raw_stmt: str):
    parts = re.split(r'\\textbf\{(Input|Output|Notes)\}', raw_stmt)
    story = clean_latex(parts[0])
    inp = ''
    out = ''
    notes = ''
    for i in range(1, len(parts), 2):
        sec = parts[i].strip()
        content = clean_latex(parts[i+1])
        if sec == 'Input':
            inp = content
        elif sec == 'Output':
            out = content
        elif sec == 'Notes':
            notes = content
    return story, inp, out, notes

def to_windows_eol(data: bytes) -> bytes:
    return data.replace(b"\r\n", b"\n").replace(b"\n", b"\r\n")

def run_cmd(cmd: list[str], input_bytes: bytes = None, timeout: float = 15.0):
    if input_bytes is not None:
        input_bytes = to_windows_eol(input_bytes)
    try:
        proc = subprocess.run(
            cmd,
            input=input_bytes,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=timeout,
            env=ENV,
            check=False
        )
        return proc.returncode, proc.stdout, proc.stderr
    except subprocess.TimeoutExpired:
        return -999, b"", b"TIMEOUT"

def diff_to_label(diff: int) -> str:
    if diff <= 900:
        return 'Oson'
    elif diff <= 1200:
        return 'O‘rtacha'
    return 'Qiyin'

def main():
    if not DB_PATH.exists():
        print(f"Error: Database file not found at {DB_PATH}")
        sys.exit(1)

    print(f"Connecting to SQLite database: {DB_PATH}")
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    cursor.execute("PRAGMA foreign_keys = ON;")

    # Remove any old contests created by this script
    for cdef in CONTESTS_DEF:
        cursor.execute("SELECT id FROM contests WHERE title = ?", (cdef["title"],))
        old_contests = cursor.fetchall()
        for oc in old_contests:
            cid = oc[0]
            print(f"Removing old contest id {cid} ({cdef['title']})")
            cursor.execute("DELETE FROM contest_problems WHERE contest_id = ?", (cid,))
            cursor.execute("DELETE FROM contest_participants WHERE contest_id = ?", (cid,))
            cursor.execute("DELETE FROM contests WHERE id = ?", (cid,))

    # Remove any old problems with these codes
    all_codes = []
    for cdef in CONTESTS_DEF:
        all_codes.extend(cdef["codes"])

    for code in all_codes:
        cursor.execute("SELECT id FROM problems WHERE code = ?", (code,))
        row = cursor.fetchone()
        if row:
            pid = row[0]
            print(f"Removing old problem {code} (id {pid})")
            cursor.execute("DELETE FROM testcases WHERE problem_id = ?", (pid,))
            cursor.execute("DELETE FROM contest_problems WHERE problem_id = ?", (pid,))
            cursor.execute("DELETE FROM problems WHERE id = ?", (pid,))

    conn.commit()

    build_dir = REPO_ROOT / "data_build_tmp"
    shutil.rmtree(build_dir, ignore_errors=True)
    build_dir.mkdir(parents=True, exist_ok=True)

    problem_code_to_id = {}

    for cdef in CONTESTS_DEF:
        print(f"\n=======================================================")
        print(f"Processing Contest: {cdef['title']}")
        print(f"=======================================================")

        for idx, pmeta in enumerate(cdef["problems"]):
            pname = pmeta["name"]
            code = cdef["codes"][idx]
            letter = cdef["letters"][idx]
            score = cdef["scores"][idx]
            diff_label = diff_to_label(pmeta.get("difficulty", 1000))
            pdir = PROBLEMS_DIR / pname

            print(f"--> Problem {letter} (#{code}): {pmeta['title']} [{pname}]")

            # Parse statement
            story, inp_fmt, out_fmt, note = parse_statement(pmeta["statement"])

            # Compile generator, validator, acc
            gen_bin = build_dir / f"{pname}_gen.exe"
            acc_bin = build_dir / f"{pname}_acc.exe"
            val_bin = build_dir / f"{pname}_val.exe"

            rc, _, err = run_cmd([CXX, *CXXFLAGS, str(pdir / "generators" / "generator.cpp"), "-o", str(gen_bin)])
            if rc != 0:
                print(f"  [ERROR] Compiling generator failed: {err.decode('utf-8', errors='ignore')}")
                sys.exit(1)

            rc, _, err = run_cmd([CXX, *CXXFLAGS, str(pdir / "solutions" / "acc.cpp"), "-o", str(acc_bin)])
            if rc != 0:
                print(f"  [ERROR] Compiling acc failed: {err.decode('utf-8', errors='ignore')}")
                sys.exit(1)

            rc, _, err = run_cmd([CXX, *CXXFLAGS, str(pdir / "validator.cpp"), "-o", str(val_bin)])
            if rc != 0:
                print(f"  [ERROR] Compiling validator failed: {err.decode('utf-8', errors='ignore')}")
                sys.exit(1)

            # Insert problem into database
            cursor.execute("""
                INSERT INTO problems (
                    code, title, statement, input_format, output_format, note,
                    time_limit, memory_limit, difficulty, score, checker_type,
                    category, is_secret, is_archived, author_name,
                    checker_comparator, checker_lang, checker_code,
                    validator_lang, validator_code, validator_mode, has_subtasks
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                code,
                pmeta["title"],
                story,
                inp_fmt,
                out_fmt,
                note,
                1000,
                256,
                diff_label,
                score,
                'default',
                cdef["category"],
                0,
                0,
                "Viloyat Olimpiada Hakamlar Hay'ati",
                'default',
                'cpp',
                '',
                'cpp',
                '',
                0,
                0
            ))
            problem_id = cursor.lastrowid
            problem_code_to_id[code] = problem_id

            # Collect test inputs
            test_inputs = []

            # 1. Sample 1
            sample_in_path = pdir / "samples" / "01"
            if sample_in_path.exists():
                test_inputs.append((sample_in_path.read_bytes(), True))

            # 2. Validator tests
            val_tests = sorted((pdir / "validator_tests").glob("valid_*.in"))
            for vpath in val_tests[:3]:
                test_inputs.append((vpath.read_bytes(), False))

            # 3. Generator tests
            stress_args = pmeta.get("stress_args", "")
            tokens = stress_args.split() if stress_args else []
            for seed in range(1, 9):
                cmd = [str(gen_bin), *tokens, str(seed)]
                rc, out, _ = run_cmd(cmd)
                if rc == 0 and out:
                    # Validate
                    vrc, _, _ = run_cmd([str(val_bin)], input_bytes=out)
                    if vrc == 0:
                        test_inputs.append((out, False))

            # Deduplicate test inputs
            unique_tests = []
            seen_bytes = set()
            for inp_b, is_samp in test_inputs:
                norm = inp_b.replace(b"\r\n", b"\n").strip()
                if norm not in seen_bytes:
                    seen_bytes.add(norm)
                    unique_tests.append((inp_b, is_samp))

            # Run ACC to get outputs and insert into testcases
            test_idx = 1
            for inp_b, is_samp in unique_tests:
                rc, out_b, err = run_cmd([str(acc_bin)], input_bytes=inp_b)
                if rc != 0:
                    print(f"  [ERROR] ACC crashed on test {test_idx}: {err.decode('utf-8', errors='ignore')}")
                    sys.exit(1)

                inp_str = inp_b.decode('utf-8', errors='ignore').replace("\r\n", "\n")
                if not inp_str.endswith("\n"):
                    inp_str += "\n"

                out_str = out_b.decode('utf-8', errors='ignore').replace("\r\n", "\n")
                if not out_str.endswith("\n"):
                    out_str += "\n"

                cursor.execute("""
                    INSERT INTO testcases (
                        problem_id, test_index, input_data, output_data, is_sample, points, subtask_group
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    problem_id,
                    test_idx,
                    inp_str,
                    out_str,
                    1 if is_samp else 0,
                    10,
                    1
                ))
                test_idx += 1

            print(f"  [OK] Inserted problem id={problem_id} with {test_idx - 1} testcases (1 sample).")

        # Now create the Contest
        cursor.execute("""
            INSERT INTO contests (
                title, description, start_time, end_time, contest_type, freeze_minutes,
                contest_mode, allowed_languages, rating_limit, submissions_limit,
                hide_authors, hide_submissions, open_registration, virtual_allowed, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            cdef["title"],
            cdef["description"],
            "2026-10-14T00:00:00.000Z",
            "2026-10-21T23:59:59.000Z",
            "ioi",
            60,
            "public",
            '["cpp","java","python"]',
            0,
            0,
            0,
            0,
            1,
            1,
            1
        ))
        contest_id = cursor.lastrowid
        print(f"  [OK] Created Contest id={contest_id}: '{cdef['title']}'")

        # Link problems to contest
        for idx, code in enumerate(cdef["codes"]):
            pid = problem_code_to_id[code]
            letter = cdef["letters"][idx]
            score = cdef["scores"][idx]

            cursor.execute("""
                INSERT INTO contest_problems (
                    contest_id, problem_id, problem_order, letter, score
                ) VALUES (?, ?, ?, ?, ?)
            """, (
                contest_id,
                pid,
                idx + 1,
                letter,
                score
            ))

        # Register all existing users to this contest
        cursor.execute("SELECT id FROM users")
        user_ids = [r[0] for r in cursor.fetchall()]
        for uid in user_ids:
            cursor.execute("""
                INSERT OR IGNORE INTO contest_participants (contest_id, user_id, is_official)
                VALUES (?, ?, 1)
            """, (contest_id, uid))

        print(f"  [OK] Linked 5 problems (A-E) with scores {cdef['scores']} and registered {len(user_ids)} users.")

    conn.commit()
    conn.close()
    shutil.rmtree(build_dir, ignore_errors=True)

    print("\n" + "=" * 50)
    print("ALL 15 PROBLEMS AND 3 CONTESTS DEPLOYED SUCCESSFULLY!")
    print("=" * 50)

if __name__ == "__main__":
    main()
