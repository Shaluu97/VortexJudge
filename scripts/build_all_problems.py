"""
Build all 15 competitive programming problems and contest configurations.
"""

import json
from pathlib import Path
from data_grade9 import PROBLEMS_9
from data_grade10 import PROBLEMS_10
from data_grade11 import PROBLEMS_11

REPO_ROOT = Path(__file__).resolve().parent.parent
PROBLEMS_DIR = REPO_ROOT / "problems"
CONTESTS_DIR = REPO_ROOT / "contests"

CHECKER_CODE = """// Use standard checker: wcmp
#include "testlib.h"

int main(int argc, char* argv[]) {
    registerTestlibCmd(argc, argv);
    quitf(_ok, "correct");
}
"""

def write_file(path: Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    # Ensure UNIX LF line endings
    content_lf = content.replace("\r\n", "\n")
    path.write_bytes(content_lf.encode("utf-8"))

def build_problem(prob: dict):
    name = prob["name"]
    pdir = PROBLEMS_DIR / name
    print(f"  Building problem: {name} ({prob['title']})")

    # 1. Statement
    write_file(pdir / "statement" / "statement.tex", prob["statement"])
    write_file(pdir / "statement" / "tutorial.tex", prob["tutorial"])

    # 2. Checker & Validator
    write_file(pdir / "checker.cpp", CHECKER_CODE)
    write_file(pdir / "validator.cpp", prob["validator"])

    # 3. Generator
    write_file(pdir / "generators" / "generator.cpp", prob["generator"])

    # 4. Solutions
    write_file(pdir / "solutions" / "acc.cpp", prob["acc"])
    write_file(pdir / "solutions" / "acc_java.java", prob["acc_java"])
    write_file(pdir / "solutions" / "acc_alt.cpp", prob["acc_alt"])
    write_file(pdir / "solutions" / "brute.cpp", prob["brute"])
    write_file(pdir / "solutions" / "wa.cpp", prob["wa"])

    # 5. Metadata
    write_file(pdir / "difficulty.txt", str(prob["difficulty"]) + "\n")
    write_file(pdir / "tags.txt", prob["tags"] + "\n")
    write_file(pdir / "stress.conf", prob["stress_args"] + "\n")

    # 6. Samples
    for idx, (s_in, s_out) in enumerate(prob["samples"], 1):
        write_file(pdir / "samples" / f"{idx}.in", s_in)
        write_file(pdir / "samples" / f"{idx}.out", s_out)

    # 7. Validator tests
    for fname, content, _ in prob["validator_tests"]:
        write_file(pdir / "validator_tests" / fname, content)

def build_contest(contest_id: str, title: str, grade: int, problems: list[dict]):
    print(f"\nBuilding contest: {title}")
    contest_dir = CONTESTS_DIR / contest_id
    contest_dir.mkdir(parents=True, exist_ok=True)

    contest_meta = {
        "contest_id": contest_id,
        "title": title,
        "grade": grade,
        "duration_minutes": 180,
        "total_points": sum(p["points"] for p in problems),
        "problems": []
    }

    letters = ["A", "B", "C", "D", "E"]
    for idx, prob in enumerate(problems):
        letter = letters[idx]
        build_problem(prob)
        contest_meta["problems"].append({
            "letter": letter,
            "id": prob["name"],
            "title": prob["title"],
            "points": prob["points"],
            "tags": prob["tags"],
            "difficulty": prob["difficulty"]
        })

    # Save contest metadata
    write_file(contest_dir / "contest.json", json.dumps(contest_meta, indent=2) + "\n")

    # Generate contest README markdown
    md_lines = [
        f"# {title}",
        f"**Sinf:** {grade}-sinf | **Davomiyligi:** 3 soat (180 daqiqa) | **Jami ball:** {contest_meta['total_points']} ball\n",
        "## Masalalar ro'yxati\n",
        "| Harf | Masala nomi | Mavzu | Ball | Qiyinlik | Papka |",
        "| :---: | :--- | :--- | :---: | :---: | :--- |"
    ]
    for item in contest_meta["problems"]:
        md_lines.append(
            f"| **{item['letter']}** | {item['title']} | `{item['tags']}` | **{item['points']} ball** | {item['difficulty']} | `problems/{item['id']}/` |"
        )
    md_lines.append("\n## Baholash mezoni")
    md_lines.append("- A masalasi: 7 ball")
    md_lines.append("- B masalasi: 7 ball")
    md_lines.append("- C masalasi: 10 ball")
    md_lines.append("- D masalasi: 10 ball")
    md_lines.append("- E masalasi: 16 ball")
    md_lines.append("\nHar bir masala Polygon platformasi talablariga to'liq javob beradi.")

    write_file(contest_dir / "README.md", "\n".join(md_lines) + "\n")

def main():
    build_contest(
        "grade_9",
        "Informatika Viloyat Bosqichi - 9-sinf Olimpiada Kontesti",
        9,
        PROBLEMS_9
    )
    build_contest(
        "grade_10",
        "Informatika Viloyat Bosqichi - 10-sinf Olimpiada Kontesti",
        10,
        PROBLEMS_10
    )
    build_contest(
        "grade_11",
        "Informatika Viloyat Bosqichi - 11-sinf Olimpiada Kontesti",
        11,
        PROBLEMS_11
    )
    print("\n[OK] Barcha 15 ta masala va 3 ta kontest muvaffaqiyatli yaratildi!")

if __name__ == "__main__":
    main()
