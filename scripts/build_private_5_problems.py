import json
import os
import random
import re
import shutil
import sqlite3
import subprocess
import sys
import time
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
PROBLEMS_DIR = REPO_ROOT / "problems"
DB_PATH = REPO_ROOT / "data" / "database.sqlite"

ENV = dict(os.environ)
ENV["PATH"] = r"C:\msys64\ucrt64\bin;" + ENV.get("PATH", "")
CXX = r"C:\msys64\ucrt64\bin\g++.exe" if Path(r"C:\msys64\ucrt64\bin\g++.exe").exists() else "g++"
CXXFLAGS = ["-std=c++20", "-O2", "-static"]
PYTHON_EXE = sys.executable

# -------------------------------------------------------------
# Problem Definitions & Content
# -------------------------------------------------------------

PROBLEMS = [
    {
        "code": "3001",
        "letter": "A",
        "title": "Bunyodbekning do'stlari",
        "folder": "priv_a_bunyod_friends",
        "diff": "Oson",
        "category": "Boshlang'ich arifmetika",
        "score": 100,
        "tl": 1000,
        "ml": 256,
        "statement": """# Bunyodbekning do'stlari

Bunyodbek 9-sinf o'quvchisi bo'lib, uning $N$ nafar do'sti bor. Ular darsdan so'ng kafega tushlik qilish uchun borishdi.

Kafe buyurtmasida Bunyodbekning 3 nafar do'sti (Halim, Salim va Bilol) o'zlari bilan uyidan tushlik olib kelgani uchun hech narsa buyurtma qilishmadi. Qolgan barcha do'stlari esa "fast food" taomlariga buyurtma berishdi.

Bunyodbekning o'zi ham uyidan tushlik olib kelgan bo'lib, fast food buyurtma qilmadi. Bunyodbekning nechta do'sti fast food buyurtma qilganini aniqlang.

### Kiruvchi ma'lumotlar
Bitta qatorda butun son $N$ ($3 \\le N \\le 50$) — Bunyodbekning do'stlari soni kiritiladi.

### Chiquvchi ma'lumotlar
Bitta butun son — fast food buyurtma qilgan do'stlar sonini ($N - 3$) chiqaring.

### Namunalar
#### 1-namuna
**Kiruvchi ma'lumot:**
```
5
```
**Chiquvchi ma'lumot:**
```
2
```

### Tushuntirish
5 nafar do'stdan 3 nafari (Halim, Salim, Bilol) tushlik olib kelgan, qolgan $5 - 3 = 2$ nafari esa fast food buyurtma qilgan.
""",
        "solution_cpp": """#include <iostream>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n;
    if (cin >> n) {
        cout << (n - 3) << "\\n";
    }
    return 0;
}
""",
        "brute_py": """import sys

def main():
    data = sys.stdin.read().split()
    if not data:
        return
    n = int(data[0])
    print(n - 3)

if __name__ == '__main__':
    main()
""",
        "validator_py": """import sys

def validate(text):
    tokens = text.strip().split()
    if len(tokens) != 1:
        return False, f"Expected 1 token, got {len(tokens)}"
    try:
        n = int(tokens[0])
    except ValueError:
        return False, "N is not an integer"
    if not (3 <= n <= 50):
        return False, f"N={n} out of bounds [3, 50]"
    return True, "OK"

if __name__ == '__main__':
    content = sys.stdin.read()
    ok, msg = validate(content)
    if not ok:
        print(f"Validation FAIL: {msg}", file=sys.stderr)
        sys.exit(1)
""",
        "generate_tests": lambda: generate_tests_a()
    },
    {
        "code": "3002",
        "letter": "B",
        "title": "Magnit raqamlar",
        "folder": "priv_b_magnetic_numbers",
        "diff": "Oson",
        "category": "Mantiqiy amallar",
        "score": 100,
        "tl": 1000,
        "ml": 256,
        "statement": """# Magnit raqamlar

Doskaga magnitli raqamlardan foydalanib butun $N$ soni yozilgan.

Ushbu sonning raqamlari o'rnini almashtirib boshqa (yangi) son hosil qilib bo'ladimi yoki yo'qligini aniqlang. 

Agar berilgan son 1 xonali bo'lsa yoki barcha raqamlari bir xil bo'lsa (masalan, 33), uning raqamlari o'rnini almashtirib boshqa son hosil qilib bo'lmaydi.

### Kiruvchi ma'lumotlar
Bitta qatorda butun son $N$ ($1 \\le N < 100$) kiritiladi.

### Chiquvchi ma'lumotlar
Agar yangi boshqa son hosil qilib bo'lsa `YES`, aks holda `NO` so'zini chiqaring.

### Namunalar
#### 1-namuna
**Kiruvchi ma'lumot:**
```
54
```
**Chiquvchi ma'lumot:**
```
YES
```

#### 2-namuna
**Kiruvchi ma'lumot:**
```
33
```
**Chiquvchi ma'lumot:**
```
NO
```

### Tushuntirish
- 54 sonining raqamlarini almashtirib 45 sonini hosil qilish mumkin, shuning uchun javob YES.
- 33 sonining ikkala raqami bir xil bo'lgani sababli boshqa son hosil qilib bo'lmaydi, shuning uchun javob NO.
""",
        "solution_cpp": """#include <iostream>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n;
    if (cin >> n) {
        if (n < 10 || n % 11 == 0) {
            cout << "NO\\n";
        } else {
            cout << "YES\\n";
        }
    }
    return 0;
}
""",
        "brute_py": """import sys

def main():
    data = sys.stdin.read().split()
    if not data:
        return
    n = int(data[0])
    s = str(n)
    if len(s) == 1 or len(set(s)) == 1:
        print("NO")
    else:
        print("YES")

if __name__ == '__main__':
    main()
""",
        "validator_py": """import sys

def validate(text):
    tokens = text.strip().split()
    if len(tokens) != 1:
        return False, f"Expected 1 token, got {len(tokens)}"
    try:
        n = int(tokens[0])
    except ValueError:
        return False, "N is not an integer"
    if not (1 <= n < 100):
        return False, f"N={n} out of bounds [1, 99]"
    return True, "OK"

if __name__ == '__main__':
    content = sys.stdin.read()
    ok, msg = validate(content)
    if not ok:
        print(f"Validation FAIL: {msg}", file=sys.stderr)
        sys.exit(1)
""",
        "generate_tests": lambda: generate_tests_b()
    },
    {
        "code": "3003",
        "letter": "C",
        "title": "Coca-Cola va rota",
        "folder": "priv_c_coca_cola_rota",
        "diff": "Oson",
        "category": "Qoldiqli bo'lish va to'plamlar",
        "score": 100,
        "tl": 1000,
        "ml": 256,
        "statement": """# Coca-Cola va rota

Harbiy rota komandiri o'z rotasidagi $0$ dan $41$ gacha tartib bilan raqamlangan $42$ ta askarga $10$ ta Coca-Cola ichimligini ulashmoqchi.

Har bir ichimlik qopqog'i ostida bitta maxsus son yozilgan. Agar qopqoq ostidagi sonni $42$ ga bo'lgandagi qoldiq qaysi askarning raqamiga teng bo'lsa, o'sha askar ichimlikni qabul qilib oladi. Bitta askarga bir nechta ichimlik to'g'ri kelib qolishi ham mumkin.

Kamida bitta ichimlik olgan omadli askarlar sonini (ya'ni hosil bo'lgan turli xil qoldiqlar sonini) toping.

### Kiruvchi ma'lumotlar
Kirish faylida 10 ta butun son beriladi. Har bir son alohida qatorda joylashgan bo'lib, uning qiymati $0$ dan $1000$ gacha bo'ladi ($0 \\le son \\le 1000$).

### Chiquvchi ma'lumotlar
Bitta butun son — kamida bitta ichimlik olgan askarlar sonini (turli qoldiqlar sonini) chiqaring.

### Namunalar
#### 1-namuna
**Kiruvchi ma'lumot:**
```
39
40
41
42
43
44
82
83
84
85
```
**Chiquvchi ma'lumot:**
```
6
```

### Tushuntirish
Kiritilgan sonlarning 42 ga bo'lgandagi qoldiqlari:
39, 40, 41, 0, 1, 2, 40, 41, 0, 1.
Turli xil qoldiqlar to'plami: {0, 1, 2, 39, 40, 41}. Jami 6 ta turli qoldiq hosil bo'ldi.
""",
        "solution_cpp": """#include <iostream>
#include <vector>
#include <set>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    set<int> unique_rems;
    int x;
    while (cin >> x) {
        unique_rems.insert(x % 42);
    }
    cout << unique_rems.size() << "\\n";
    return 0;
}
""",
        "brute_py": """import sys

def main():
    data = sys.stdin.read().split()
    if not data:
        return
    nums = [int(x) for x in data]
    rems = set(x % 42 for x in nums)
    print(len(rems))

if __name__ == '__main__':
    main()
""",
        "validator_py": """import sys

def validate(text):
    tokens = text.strip().split()
    if len(tokens) != 10:
        return False, f"Expected 10 tokens, got {len(tokens)}"
    for idx, t in enumerate(tokens):
        try:
            x = int(t)
        except ValueError:
            return False, f"Token {idx+1} '{t}' is not an integer"
        if not (0 <= x <= 1000):
            return False, f"Number {x} at pos {idx+1} out of bounds [0, 1000]"
    return True, "OK"

if __name__ == '__main__':
    content = sys.stdin.read()
    ok, msg = validate(content)
    if not ok:
        print(f"Validation FAIL: {msg}", file=sys.stderr)
        sys.exit(1)
""",
        "generate_tests": lambda: generate_tests_c()
    },
    {
        "code": "3004",
        "letter": "D",
        "title": "Yangicha 15 o'yini",
        "folder": "priv_d_game_15",
        "diff": "O'rtacha",
        "category": "Matritsalar va Manxetten masofasi",
        "score": 100,
        "tl": 1000,
        "ml": 256,
        "statement": """# Yangicha 15 o'yini

$4 \\times 4$ o'lchamli doskada ingliz alifbosining 'A' dan 'O' gacha bo'lgan 15 ta bosh harfi va bitta '.' bo'sh joy katagi joylashgan.

Ushbu o'yinda maqsad — barcha harflarni yakuniy g'alaba holatiga keltirishdir. Yakuniy to'g'ri tartib quyidagicha:
- 1-qator: `ABCD`
- 2-qator: `EFGH`
- 3-qator: `IJKL`
- 4-qator: `MNO.`

Har bir harfni o'zining yakuniy maqsadli katagiga olib borish uchun sarflanadigan minimal energiya harfning hozirgi koordinatasi $(X, Y)$ va maqsadli koordinatasi $(X_h, Y_h)$ orasidagi Manxetten masofasiga ($|X - X_h| + |Y - Y_h|$) teng.

Barcha 15 ta harfning o'z maqsadli o'rinlarigacha bo'lgan Manxetten masofalari yig'indisini (minimal jami energiyani) toping.

### Kiruvchi ma'lumotlar
Kirish oqimida 4 ta qator beriladi. Har bir qatorda 4 tadan belgi mavjud bo'lib, ular 'A' dan 'O' gacha bo'lgan harflar va bitta '.' belgisidan iborat.

### Chiquvchi ma'lumotlar
Bitta butun son — barcha harflarning Manxetten masofalari yig'indisini chiqaring.

### Namunalar
#### 1-namuna
**Kiruvchi ma'lumot:**
```
ABCD
EFGH
IJKL
MON.
```
**Chiquvchi ma'lumot:**
```
2
```

### Tushuntirish
Ushbu namunada:
- 'A' dan 'M' gacha harflar o'z o'rnida turibdi (masofa = 0).
- 'O' harfi 4-qator 2-ustunda (indeks 3, 1), maqsadli o'rni esa 4-qator 3-ustun (indeks 3, 2). Masofa = $|3 - 3| + |1 - 2| = 1$.
- 'N' harfi 4-qator 3-ustunda (indeks 3, 2), maqsadli o'rni esa 4-qator 2-ustun (indeks 3, 1). Masofa = $|3 - 3| + |2 - 1| = 1$.
- Jami Manxetten masofalari yig'indisi: $1 + 1 = 2$.
""",
        "solution_cpp": """#include <iostream>
#include <vector>
#include <string>
#include <cmath>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int total_dist = 0;
    for (int r = 0; r < 4; ++r) {
        string row;
        if (!(cin >> row)) break;
        for (int c = 0; c < 4; ++c) {
            char ch = row[c];
            if (ch >= 'A' && ch <= 'O') {
                int k = ch - 'A';
                int target_r = k / 4;
                int target_c = k % 4;
                total_dist += abs(r - target_r) + abs(c - target_c);
            }
        }
    }
    cout << total_dist << "\\n";
    return 0;
}
""",
        "brute_py": """import sys

def main():
    lines = [line.strip() for line in sys.stdin.read().split() if line.strip()]
    if not lines:
        return
    total = 0
    for r in range(4):
        for c in range(4):
            ch = lines[r][c]
            if 'A' <= ch <= 'O':
                k = ord(ch) - ord('A')
                tr = k // 4
                tc = k % 4
                total += abs(r - tr) + abs(c - tc)
    print(total)

if __name__ == '__main__':
    main()
""",
        "validator_py": """import sys

def validate(text):
    tokens = text.strip().split()
    if len(tokens) != 4:
        return False, f"Expected 4 rows, got {len(tokens)}"
    chars = []
    for r_idx, row in enumerate(tokens):
        if len(row) != 4:
            return False, f"Row {r_idx+1} length is {len(row)}, expected 4"
        for ch in row:
            chars.append(ch)
    expected_set = set([chr(ord('A') + i) for i in range(15)] + ['.'])
    if set(chars) != expected_set:
        return False, f"Characters set mismatch: {sorted(set(chars))}"
    if len(chars) != 16:
        return False, f"Total characters count is {len(chars)}, expected 16"
    return True, "OK"

if __name__ == '__main__':
    content = sys.stdin.read()
    ok, msg = validate(content)
    if not ok:
        print(f"Validation FAIL: {msg}", file=sys.stderr)
        sys.exit(1)
""",
        "generate_tests": lambda: generate_tests_d()
    },
    {
        "code": "3005",
        "letter": "E",
        "title": "1 va arifmetik amallar",
        "folder": "priv_e_arithmetic_ones",
        "diff": "O'rtacha",
        "category": "Dinamik dasturlash (Integer Complexity)",
        "score": 100,
        "tl": 1000,
        "ml": 256,
        "statement": """# 1 va arifmetik amallar

Faqat '1' soni, qo'shish ($+$) va ko'paytirish ($\\times$) amallari hamda qavslardan foydalanib berilgan butun $N$ sonini hosil qilish talab etiladi. 

Raqamlarni yonma-yon yozib son yasash (masalan, "1" va "1" dan "11" yasash) qat'iyan taqiqlanadi. Har bir '1' soni alohida son sifatida qatnashadi.

Berilgan $N$ sonini hosil qilish uchun kerak bo'ladigan minimal '1' lar sonini toping.

### Kiruvchi ma'lumotlar
Bitta qatorda butun son $N$ ($1 \\le N \\le 5000$) kiritiladi.

### Chiquvchi ma'lumotlar
Bitta butun son — $N$ sonini hosil qilish uchun zarur bo'lgan minimal '1' lar sonini chiqaring.

### Namunalar
#### 1-namuna
**Kiruvchi ma'lumot:**
```
7
```
**Chiquvchi ma'lumot:**
```
6
```

#### 2-namuna
**Kiruvchi ma'lumot:**
```
11
```
**Chiquvchi ma'lumot:**
```
8
```

### Tushuntirish
- $7$ sonini $(1 + 1) \\times (1 + 1 + 1) + 1 = 2 \\times 3 + 1$ ko'rinishida hosil qilish mumkin. Bunda jami $2 + 3 + 1 = 6$ ta '1' ishlatiladi.
- $11$ sonini $(1 + 1) \\times ((1 + 1) \\times (1 + 1) + 1) + 1 = 2 \\times 5 + 1$ ko'rinishida hosil qilish mumkin. Bunda jami $2 + 5 + 1 = 8$ ta '1' ishlatiladi.
""",
        "solution_cpp": """#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

const int MAXN = 5000;
int dp[MAXN + 1];

void precompute() {
    dp[1] = 1;
    for (int i = 2; i <= MAXN; ++i) {
        int best = dp[1] + dp[i - 1];
        // Addition combinations
        for (int a = 2; a <= i / 2; ++a) {
            best = min(best, dp[a] + dp[i - a]);
        }
        // Multiplication factorizations
        for (int d = 2; d * d <= i; ++d) {
            if (i % d == 0) {
                best = min(best, dp[d] + dp[i / d]);
            }
        }
        dp[i] = best;
    }
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    precompute();

    int n;
    while (cin >> n) {
        if (n >= 1 && n <= MAXN) {
            cout << dp[n] << "\\n";
        }
    }
    return 0;
}
""",
        "brute_py": """import sys

def solve():
    MAXN = 5000
    dp = [0] * (MAXN + 1)
    dp[1] = 1
    for i in range(2, MAXN + 1):
        res = dp[1] + dp[i - 1]
        for a in range(2, i // 2 + 1):
            val = dp[a] + dp[i - a]
            if val < res:
                res = val
        d = 2
        while d * d <= i:
            if i % d == 0:
                val = dp[d] + dp[i // d]
                if val < res:
                    res = val
            d += 1
        dp[i] = res

    data = sys.stdin.read().split()
    for token in data:
        n = int(token)
        print(dp[n])

if __name__ == '__main__':
    solve()
""",
        "validator_py": """import sys

def validate(text):
    tokens = text.strip().split()
    if len(tokens) != 1:
        return False, f"Expected 1 token, got {len(tokens)}"
    try:
        n = int(tokens[0])
    except ValueError:
        return False, "N is not an integer"
    if not (1 <= n <= 5000):
        return False, f"N={n} out of bounds [1, 5000]"
    return True, "OK"

if __name__ == '__main__':
    content = sys.stdin.read()
    ok, msg = validate(content)
    if not ok:
        print(f"Validation FAIL: {msg}", file=sys.stderr)
        sys.exit(1)
""",
        "generate_tests": lambda: generate_tests_e()
    }
]

# -------------------------------------------------------------
# Testcase Generators (Exactly 40 tests each)
# -------------------------------------------------------------

def generate_tests_a():
    tests = []
    tests.append("5\n")
    tests.append("3\n")
    tests.append("50\n")
    tests.append("4\n")
    tests.append("49\n")
    pool = [x for x in range(6, 49)]
    random.seed(42)
    random.shuffle(pool)
    for x in pool[:35]:
        tests.append(f"{x}\n")
    return tests

def generate_tests_b():
    tests = []
    tests.append("54\n")
    tests.append("33\n")
    tests.append("1\n")
    tests.append("9\n")
    tests.append("10\n")
    tests.append("99\n")
    for x in [11, 22, 44, 55, 66, 77, 88]:
        tests.append(f"{x}\n")
    for x in [2, 3, 4, 5, 6, 7, 8]:
        tests.append(f"{x}\n")
    distinct_candidates = [
        12, 19, 21, 28, 31, 37, 45, 52, 63, 67, 71, 79, 81, 89, 91, 98, 25, 34, 48, 62
    ]
    for x in distinct_candidates:
        tests.append(f"{x}\n")
    return tests

def generate_tests_c():
    tests = []
    tests.append("39\n40\n41\n42\n43\n44\n82\n83\n84\n85\n")
    tests.append("\n".join(["0"] * 10) + "\n")
    tests.append("\n".join(["1000"] * 10) + "\n")
    tests.append("\n".join([str(42 * k) for k in range(10)]) + "\n")
    tests.append("\n".join([str(k) for k in range(10)]) + "\n")
    tests.append("\n".join([str(32 + k) for k in range(10)]) + "\n")
    tests.append("\n".join([str(991 + k) for k in range(10)]) + "\n")
    tests.append("\n".join(["5", "47", "10", "52", "15", "57", "20", "62", "25", "67"]) + "\n")
    tests.append("\n".join([str(41 + 42 * k) for k in range(10)]) + "\n")

    random.seed(1337)
    for _ in range(31):
        lines = [str(random.randint(0, 1000)) for _ in range(10)]
        tests.append("\n".join(lines) + "\n")
    return tests

def generate_tests_d():
    tests = []
    tests.append("ABCD\nEFGH\nIJKL\nMON.\n")
    tests.append("ABCD\nEFGH\nIJKL\nMNO.\n")
    tests.append(".ONM\nLKJI\nHGFE\nDCBA\n")
    tests.append("ABCD\nEFGH\nIJKL\nMN.O\n")
    tests.append("AEIM\nBFJN\nCGKO\nDHL.\n")
    tests.append("EFGH\nIJKL\nMNO.\nABCD\n")
    tests.append("BCDA\nFGHE\nJKLI\nNO.M\n")

    random.seed(2026)
    chars = [chr(ord('A') + i) for i in range(15)] + ['.']
    for _ in range(33):
        cur = chars[:]
        random.shuffle(cur)
        rows = ["".join(cur[i*4:(i+1)*4]) for i in range(4)]
        tests.append("\n".join(rows) + "\n")
    return tests

def generate_tests_e():
    tests = []
    tests.append("7\n")
    tests.append("11\n")
    tests.append("1\n")
    tests.append("5000\n")
    for x in [2, 3, 4, 5, 6, 8, 9, 10, 12, 15, 16]:
        tests.append(f"{x}\n")
    for x in [32, 64, 81, 128, 243, 256, 512, 729, 1024, 2048, 2187, 4096]:
        tests.append(f"{x}\n")
    for x in [4999, 4993, 4987, 4973]:
        tests.append(f"{x}\n")
    for x in [100, 500, 1000, 1729, 2024, 2500, 3141, 3600, 4800]:
        tests.append(f"{x}\n")
    return tests


# -------------------------------------------------------------
# Solver functions in Python to produce golden outputs
# -------------------------------------------------------------

def solve_a(input_str):
    n = int(input_str.strip().split()[0])
    return f"{n - 3}\n"

def solve_b(input_str):
    n = int(input_str.strip().split()[0])
    if n < 10 or n % 11 == 0:
        return "NO\n"
    return "YES\n"

def solve_c(input_str):
    tokens = input_str.strip().split()
    rems = set(int(x) % 42 for x in tokens)
    return f"{len(rems)}\n"

def solve_d(input_str):
    lines = [x.strip() for x in input_str.strip().split() if x.strip()]
    tot = 0
    for r in range(4):
        for c in range(4):
            ch = lines[r][c]
            if 'A' <= ch <= 'O':
                k = ord(ch) - ord('A')
                tr = k // 4
                tc = k % 4
                tot += abs(r - tr) + abs(c - tc)
    return f"{tot}\n"

_DP_E = None
def solve_e(input_str):
    global _DP_E
    if _DP_E is None:
        MAXN = 5000
        dp = [0] * (MAXN + 1)
        dp[1] = 1
        for i in range(2, MAXN + 1):
            res = dp[1] + dp[i - 1]
            for a in range(2, i // 2 + 1):
                v = dp[a] + dp[i - a]
                if v < res:
                    res = v
            d = 2
            while d * d <= i:
                if i % d == 0:
                    v = dp[d] + dp[i // d]
                    if v < res:
                        res = v
                d += 1
            dp[i] = res
        _DP_E = dp
    n = int(input_str.strip().split()[0])
    return f"{_DP_E[n]}\n"

SOLVERS = {
    "3001": solve_a,
    "3002": solve_b,
    "3003": solve_c,
    "3004": solve_d,
    "3005": solve_e,
}


def build_and_deploy():
    print("=" * 80)
    print("STARTING BUILD & DEPLOYMENT OF 5 PRIVATE OLYMPIAD PROBLEMS")
    print("=" * 80)

    # 1. Create Problem Folders & Files
    for prob in PROBLEMS:
        pdir = PROBLEMS_DIR / prob["folder"]
        pdir.mkdir(parents=True, exist_ok=True)
        tests_dir = pdir / "tests"
        tests_dir.mkdir(exist_ok=True)

        # problem.json
        meta = {
            "code": prob["code"],
            "title": prob["title"],
            "difficulty": prob["diff"],
            "category": prob["category"],
            "time_limit": prob["tl"],
            "memory_limit": prob["ml"],
            "visibility": "private",
            "is_public": False,
            "is_secret": 1,
            "contest_only": True,
            "access_roles": ["admin", "contest_participant"]
        }
        with open(pdir / "problem.json", "w", encoding="utf-8") as f:
            json.dump(meta, f, indent=2, ensure_ascii=False)

        # statement.md
        with open(pdir / "statement.md", "w", encoding="utf-8") as f:
            f.write(prob["statement"])

        # solution.cpp
        with open(pdir / "solution.cpp", "w", encoding="utf-8") as f:
            f.write(prob["solution_cpp"])

        # brute.py
        with open(pdir / "brute.py", "w", encoding="utf-8") as f:
            f.write(prob["brute_py"])

        # validator.py
        with open(pdir / "validator.py", "w", encoding="utf-8") as f:
            f.write(prob["validator_py"])

        # Generate Testcases
        test_inputs = prob["generate_tests"]()
        solver = SOLVERS[prob["code"]]

        for idx, inp in enumerate(test_inputs, 1):
            out = solver(inp)
            in_file = tests_dir / f"{idx:02d}.in"
            out_file = tests_dir / f"{idx:02d}.out"
            in_file.write_text(inp, encoding="utf-8")
            out_file.write_text(out, encoding="utf-8")

        print(f"[{prob['code']}] {prob['title']} -> Created {len(test_inputs)} testcases.")

    # 2. Validation & Stress Testing
    print("\n" + "-" * 80)
    print("RUNNING VALIDATORS & STRESS TESTS (C++20 vs brute.py)")
    print("-" * 80)

    compiled_bins = {}

    for prob in PROBLEMS:
        pdir = PROBLEMS_DIR / prob["folder"]
        code = prob["code"]
        tests_dir = pdir / "tests"
        sol_cpp = pdir / "solution.cpp"
        sol_exe = pdir / f"sol_{code}.exe"

        # Validate all 40 testcases
        in_files = sorted(tests_dir.glob("*.in"))
        val_py = pdir / "validator.py"

        all_valid = True
        for inf in in_files:
            res = subprocess.run([PYTHON_EXE, str(val_py)], input=inf.read_text(encoding="utf-8"), capture_output=True, text=True)
            if res.returncode != 0:
                print(f"ERROR: {prob['code']} testcase {inf.name} failed validator: {res.stderr}")
                all_valid = False
                break
        
        if all_valid:
            print(f"[{code}] Validator: 100% VALID ({len(in_files)}/{len(in_files)} tests passed).")
        else:
            sys.exit(1)

        # Compile solution.cpp with C++20 and static linking
        compile_cmd = [CXX, *CXXFLAGS, str(sol_cpp), "-o", str(sol_exe)]
        res_comp = subprocess.run(compile_cmd, capture_output=True, text=True, env=ENV)
        if res_comp.returncode != 0 or not sol_exe.exists():
            print(f"ERROR compiling {sol_cpp}:\n{res_comp.stderr}")
            sys.exit(1)
        compiled_bins[code] = sol_exe

        # Stress test against brute.py on all generated tests
        brute_py = pdir / "brute.py"
        all_match = True
        for inf in in_files:
            inp_data = inf.read_text(encoding="utf-8")
            res_sol = subprocess.run([str(sol_exe)], input=inp_data, capture_output=True, text=True, env=ENV)
            res_brute = subprocess.run([PYTHON_EXE, str(brute_py)], input=inp_data, capture_output=True, text=True)

            sol_tokens = res_sol.stdout.strip().split()
            brute_tokens = res_brute.stdout.strip().split()
            if sol_tokens != brute_tokens:
                print(f"STRESS MISMATCH on {inf.name} for {code}!")
                print("Solution:", sol_tokens)
                print("Brute:   ", brute_tokens)
                all_match = False
                break

        if all_match:
            print(f"[{code}] Stress test: 100% MATCH against brute.py ({len(in_files)}/{len(in_files)} tests passed).")
        else:
            sys.exit(1)

    # 3. Database Deployment
    print("\n" + "-" * 80)
    print("DEPLOYING TO DATABASE (SQLITE) AS PRIVATE PROBLEMS")
    print("-" * 80)

    conn = sqlite3.connect(str(DB_PATH))
    cur = conn.cursor()

    # Create/check private contest
    contest_id = 5
    contest_title = "Informatika Olimpiadasi — Saralash Bosqichi (Yopiq Kontest)"
    
    cur.execute("SELECT id FROM contests WHERE id = ? OR title = ?", (contest_id, contest_title))
    row = cur.fetchone()
    if row:
        contest_id = row[0]
        cur.execute("DELETE FROM contest_problems WHERE contest_id = ?", (contest_id,))
    else:
        cur.execute("""
            INSERT INTO contests (
                id, title, description, start_time, end_time, is_active, created_at, contest_type, contest_mode
            ) VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, 'icpc', 'private')
        """, (
            contest_id,
            contest_title,
            "Respublika va viloyat bosqichiga saralash uchun maxsus yopiq olimpiada kontesti (5 ta saralangan masala).",
            "2026-10-26T00:00",
            "2026-10-27T23:59"
        ))
        contest_id = cur.lastrowid

    # Deploy problems & testcases
    deployed_pids = {}

    for p_idx, prob in enumerate(PROBLEMS, 1):
        code = prob["code"]
        letter = prob["letter"]
        pdir = PROBLEMS_DIR / prob["folder"]
        tests_dir = pdir / "tests"

        # Check existing problem with this code
        cur.execute("SELECT id FROM problems WHERE code = ?", (code,))
        existing = cur.fetchone()
        if existing:
            pid = existing[0]
            cur.execute("DELETE FROM testcases WHERE problem_id = ?", (pid,))
            cur.execute("DELETE FROM contest_problems WHERE problem_id = ?", (pid,))
            cur.execute("DELETE FROM problems WHERE id = ?", (pid,))

        # Parse markdown statement parts
        lines = prob["statement"].strip().split("\n")
        title = lines[0].lstrip('#').strip()
        parts = re.split(r'###\s+', '\n'.join(lines[1:]))
        story = parts[0].strip()
        inp_fmt, out_fmt, note = '', '', ''
        for p in parts[1:]:
            p_lines = p.strip().split('\n', 1)
            h = p_lines[0].strip()
            c = p_lines[1].strip() if len(p_lines) > 1 else ''
            if 'Kiruvchi' in h: inp_fmt = c
            elif 'Chiquvchi' in h: out_fmt = c
            elif 'Tushuntirish' in h: note = c

        cur.execute("""
            INSERT INTO problems (
                code, title, statement, input_format, output_format, note,
                time_limit, memory_limit, difficulty, score, checker_type,
                is_active, created_at, category, is_secret, is_archived,
                author_name, checker_comparator, checker_lang, checker_code,
                validator_lang, validator_code, validator_mode, has_subtasks,
                is_public, visibility
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, ?, 1, 0, ?, 'tokens', 'cpp', '', 'python', '', 0, 0, 0, 'private')
        """, (
            code,
            prob["title"],
            story,
            inp_fmt,
            out_fmt,
            note,
            prob["tl"],
            prob["ml"],
            prob["diff"],
            prob["score"],
            'default',
            prob["category"],
            'Olimpiada Hakamlar Hay\'ati'
        ))
        pid = cur.lastrowid
        deployed_pids[code] = pid

        # Link problem to Contest
        cur.execute("""
            INSERT INTO contest_problems (contest_id, problem_id, problem_order, letter, score, letter_index, order_num)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (contest_id, pid, p_idx, letter, prob["score"], letter, p_idx))

        # Insert all 40 testcases
        in_files = sorted(tests_dir.glob("*.in"))
        for idx, inf in enumerate(in_files, 1):
            outf = tests_dir / f"{inf.stem}.out"
            inp_data = inf.read_text(encoding="utf-8")
            out_data = outf.read_text(encoding="utf-8")
            is_sample = 1 if idx <= (2 if code in ["3002", "3005"] else 1) else 0

            cur.execute("""
                INSERT INTO testcases (
                    problem_id, test_index, input_data, output_data, is_sample, points, subtask_group
                ) VALUES (?, ?, ?, ?, ?, ?, 1)
            """, (pid, idx, inp_data, out_data, is_sample, 10))

        print(f"[{code}] Inserted in DB (id: {pid}) with {len(in_files)} testcases. Status: PRIVATE.")

    conn.commit()
    conn.close()

    print(f"\nAll problems linked to Contest ID {contest_id}: '{contest_title}'")

    # Clean up binaries
    for exe in compiled_bins.values():
        if exe.exists():
            try:
                exe.unlink()
            except Exception:
                pass

    # 4. Offline Judge Verification Execution via Node.js
    print("\n" + "-" * 80)
    print("RUNNING OFFLINE JUDGE TESTING PIPELINE (runner.js)")
    print("-" * 80)

    node_res = subprocess.run(["node", "scripts/verify_private_judge.js"], capture_output=True, text=True, cwd=str(REPO_ROOT))
    if node_res.returncode != 0:
        print("ERROR running verify_private_judge.js:")
        print(node_res.stderr)
        sys.exit(1)

    try:
        judge_results = json.loads(node_res.stdout)
    except Exception as e:
        print("Could not parse judge output:", e)
        print("Raw output:\n", node_res.stdout)
        sys.exit(1)

    # 5. Output Final Report Table
    print("\n" + "=" * 80)
    print("YAKUNIY OFFLINE JUDGE HISOBOTI")
    print("=" * 80)

    header = f"{'Masala ID':<10} | {'Nomi':<32} | {'Holati':<17} | {'Testlar':<14} | {'Hukm':<15} | {'Vaqt (max)':<10} | {'Xotira (max)':<12}"
    print(header)
    print("-" * len(header))

    for item in judge_results:
        code = item["code"]
        name = item["title"]
        status = "Private (Yopiq)" if item["visibility"] == "private" and item["is_public"] == 0 else "Public"
        tests_valid = "Valid (100%)"
        verdict = f"{item['status']} (100/100)" if item['status'] == 'Accepted' else item['status']
        time_str = f"{item['time_spent']} ms"
        mem_str = f"{item['memory_used']} KB"
        print(f"{code:<10} | {name:<32} | {status:<17} | {tests_valid:<14} | {verdict:<15} | {time_str:<10} | {mem_str:<12}")

    print("=" * 80)
    print("BARCHA 5 TA MASALA MUVAFFAQIYATLI TEKSHIRILDI VA YOPIQ REJIMDA INTEGRATSIYA QILINDI.")
    print("=" * 80)


if __name__ == '__main__':
    build_and_deploy()
