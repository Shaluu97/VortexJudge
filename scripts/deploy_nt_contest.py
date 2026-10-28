import os
import re
import sqlite3
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
PROBLEMS_DIR = REPO_ROOT / "problems"
DB_PATH = REPO_ROOT / "data" / "database.sqlite"

ENV = dict(os.environ)
ENV["PATH"] = r"C:\msys64\ucrt64\bin;" + ENV.get("PATH", "")

CXX = "g++"
CXXFLAGS = ["-std=c++17", "-O2"]

PROBLEMS_INFO = [
    {"dir": "p01_prime_check", "code": "2001", "letter": "A", "score": 20, "diff": "Oson", "tl": 1000, "ml": 256},
    {"dir": "p02_sieve_range_primes", "code": "2002", "letter": "B", "score": 40, "diff": "Oson", "tl": 1000, "ml": 256},
    {"dir": "p03_segmented_sieve", "code": "2003", "letter": "C", "score": 60, "diff": "O‘rtacha", "tl": 2000, "ml": 256},
    {"dir": "p04_linear_sieve_spf", "code": "2004", "letter": "D", "score": 80, "diff": "Qiyin", "tl": 2000, "ml": 512},
    {"dir": "p05_lehmer_prime_count", "code": "2005", "letter": "E", "score": 100, "diff": "Qiyin", "tl": 2000, "ml": 256},
    {"dir": "p06_count_sum_divisors", "code": "2006", "letter": "F", "score": 20, "diff": "Oson", "tl": 1000, "ml": 256},
    {"dir": "p07_common_divisors", "code": "2007", "letter": "G", "score": 40, "diff": "Oson", "tl": 1000, "ml": 256},
    {"dir": "p08_sum_divisors_range", "code": "2008", "letter": "H", "score": 60, "diff": "O‘rtacha", "tl": 1500, "ml": 256},
    {"dir": "p09_highly_composite_num", "code": "2009", "letter": "I", "score": 80, "diff": "Qiyin", "tl": 1000, "ml": 256},
    {"dir": "p10_pollard_rho_factor", "code": "2010", "letter": "J", "score": 100, "diff": "Qiyin", "tl": 2000, "ml": 256},
    {"dir": "p11_gcd_lcm_basics", "code": "2011", "letter": "K", "score": 20, "diff": "Oson", "tl": 1000, "ml": 256},
    {"dir": "p12_extended_euclid", "code": "2012", "letter": "L", "score": 40, "diff": "Oson", "tl": 1000, "ml": 256},
    {"dir": "p13_gcd_pairs_sum", "code": "2013", "letter": "M", "score": 60, "diff": "O‘rtacha", "tl": 2000, "ml": 256},
    {"dir": "p14_gcd_counting_pairs", "code": "2014", "letter": "N", "score": 80, "diff": "Qiyin", "tl": 2000, "ml": 256},
    {"dir": "p15_extended_crt", "code": "2015", "letter": "O", "score": 100, "diff": "Qiyin", "tl": 2000, "ml": 256},
]

def parse_markdown_statement(md_text):
    lines = md_text.strip().split('\n')
    title = lines[0].lstrip('#').strip()
    parts = re.split(r'###\s+', '\n'.join(lines[1:]))
    story = parts[0].strip()
    inp, out, note = '', '', ''
    for p in parts[1:]:
        p_lines = p.strip().split('\n', 1)
        h = p_lines[0].strip()
        c = p_lines[1].strip() if len(p_lines) > 1 else ''
        if 'Kiruvchi' in h: inp = c
        elif 'Chiquvchi' in h: out = c
        elif 'Tushuntirish' in h: note = c
    return title, story, inp, out, note

def deploy():
    if not DB_PATH.exists():
        print(f"Error: Database not found at {DB_PATH}")
        sys.exit(1)

    print(f"Connecting to database: {DB_PATH}")
    conn = sqlite3.connect(str(DB_PATH))
    cur = conn.cursor()

    contest_title = "Raqamlar Nazariyasi (Number Theory) Master Kontest — 15 ta Masala"

    # Delete old contest if exists
    cur.execute("SELECT id FROM contests WHERE title = ?", (contest_title,))
    for row in cur.fetchall():
        cid = row[0]
        print(f"Removing existing contest {cid} ({contest_title})")
        cur.execute("DELETE FROM contest_problems WHERE contest_id = ?", (cid,))
        cur.execute("DELETE FROM contest_participants WHERE contest_id = ?", (cid,))
        cur.execute("DELETE FROM contests WHERE id = ?", (cid,))

    # Delete existing problems with codes 2001..2015
    for info in PROBLEMS_INFO:
        code = info["code"]
        cur.execute("SELECT id FROM problems WHERE code = ?", (code,))
        row = cur.fetchone()
        if row:
            pid = row[0]
            print(f"Removing old problem {code} (id {pid})")
            cur.execute("DELETE FROM testcases WHERE problem_id = ?", (pid,))
            cur.execute("DELETE FROM contest_problems WHERE problem_id = ?", (pid,))
            cur.execute("DELETE FROM problems WHERE id = ?", (pid,))

    conn.commit()

    problem_code_to_id = {}

    for info in PROBLEMS_INFO:
        pdir = PROBLEMS_DIR / info["dir"]
        code = info["code"]
        letter = info["letter"]
        stmt_path = pdir / "statement.md"

        with open(stmt_path, "r", encoding="utf-8") as f:
            md_text = f.read()

        title, story, inp_fmt, out_fmt, note = parse_markdown_statement(md_text)

        # Read solutions
        with open(pdir / "solution.cpp", "r", encoding="utf-8") as f:
            sol_code = f.read()

        # Insert problem
        cur.execute("""
            INSERT INTO problems (
                code, title, statement, input_format, output_format, note,
                time_limit, memory_limit, difficulty, score, checker_type,
                is_active, created_at, category, is_secret, is_archived,
                author_name, checker_comparator, checker_lang, checker_code,
                validator_lang, validator_code, validator_mode, has_subtasks,
                is_public, visibility
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            code,
            title,
            story,
            inp_fmt,
            out_fmt,
            note,
            info["tl"],
            info["ml"],
            info["diff"],
            info["score"],
            'default',
            1,
            'Sonlar Nazariyasi',
            0,
            0,
            'Problemsetter',
            'tokens',
            'cpp',
            '',
            'cpp',
            '',
            0,
            0,
            1,
            'public'
        ))
        pid = cur.lastrowid
        problem_code_to_id[code] = pid
        print(f"Inserted problem {code} ({letter}): {title} (id {pid})")

        # Tests
        t1_in = pdir / "tests" / "01.in"
        t1_out = pdir / "tests" / "01.out"
        t2_in = pdir / "tests" / "02.in"
        t2_out = pdir / "tests" / "02.out"

        tests_to_insert = []
        if t1_in.exists() and t1_out.exists():
            tests_to_insert.append((t1_in.read_text(encoding="utf-8"), t1_out.read_text(encoding="utf-8"), 1))
        if t2_in.exists() and t2_out.exists():
            tests_to_insert.append((t2_in.read_text(encoding="utf-8"), t2_out.read_text(encoding="utf-8"), 0))

        # Compile and run generator for test 3 if available
        gen_cpp = pdir / "generator.cpp"
        sol_cpp = pdir / "solution.cpp"
        gen_exe = pdir / "gen.exe"
        sol_exe = pdir / "sol.exe"

        res_g = subprocess.run([CXX, *CXXFLAGS, str(gen_cpp), "-o", str(gen_exe)], env=ENV, capture_output=True)
        res_s = subprocess.run([CXX, *CXXFLAGS, str(sol_cpp), "-o", str(sol_exe)], env=ENV, capture_output=True)

        if res_g.returncode == 0 and res_s.returncode == 0:
            res_gen = subprocess.run([str(gen_exe)], capture_output=True, text=True, env=ENV)
            if res_gen.returncode == 0 and res_gen.stdout.strip():
                gen_inp = res_gen.stdout
                res_sol = subprocess.run([str(sol_exe)], input=gen_inp, capture_output=True, text=True, env=ENV)
                if res_sol.returncode == 0 and res_sol.stdout.strip():
                    tests_to_insert.append((gen_inp, res_sol.stdout, 0))

        for exe in [gen_exe, sol_exe]:
            if exe.exists():
                try:
                    exe.unlink()
                except Exception:
                    pass

        # Insert testcases
        for idx, (inp, out, is_samp) in enumerate(tests_to_insert, 1):
            cur.execute("""
                INSERT INTO testcases (
                    problem_id, test_index, input_data, output_data, is_sample, points, subtask_group
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (pid, idx, inp, out, is_samp, 10, 1))

        print(f"  -> Added {len(tests_to_insert)} testcases")

    # Create Contest
    desc = (
        "Raqobatbardosh dasturlash (Competitive Programming) va xalqaro olimpiadalarga tayyorgarlik uchun "
        "Sonlar Nazariyasi (Number Theory) bo'yicha saralangan 15 ta klassik va zamonaviy masala.\n\n"
        "Mavzular taqsimoti:\n"
        "• A - E (1 - 5): Tub sonlar va Eratosfen g'alviri\n"
        "• F - J (6 - 10): Sonning bo'luvchilari va faktorizatsiya\n"
        "• K - O (11 - 15): Evklid algoritmi, EKUB/EKUK va Kengaytirilgan Evklid"
    )

    cur.execute("""
        INSERT INTO contests (
            title, description, start_time, end_time, contest_type, freeze_minutes,
            contest_mode, allowed_languages, rating_limit, submissions_limit,
            hide_authors, hide_submissions, open_registration, virtual_allowed, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        contest_title,
        desc,
        "2026-10-23T00:00:00.000Z",
        "2026-10-30T23:59:59.000Z",
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
    contest_id = cur.lastrowid
    print(f"\n[OK] Created Contest ID {contest_id}: '{contest_title}'")

    # Link problems to contest
    for idx, info in enumerate(PROBLEMS_INFO, 1):
        pid = problem_code_to_id[info["code"]]
        cur.execute("""
            INSERT INTO contest_problems (
                contest_id, problem_id, problem_order, letter, score
            ) VALUES (?, ?, ?, ?, ?)
        """, (contest_id, pid, idx, info["letter"], info["score"]))

    # Register all users
    cur.execute("SELECT id FROM users")
    users = cur.fetchall()
    for (uid,) in users:
        cur.execute("""
            INSERT OR IGNORE INTO contest_participants (contest_id, user_id, is_official)
            VALUES (?, ?, 1)
        """, (contest_id, uid))

    conn.commit()
    conn.close()
    print(f"[OK] Linked 15 problems (A-O) and registered {len(users)} users.")
    print("ALL 15 PROBLEMS AND CONTEST SUCCESSFULLY DEPLOYED TO LOCAL PLATFORM!")

if __name__ == "__main__":
    deploy()
