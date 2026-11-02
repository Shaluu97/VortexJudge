# -*- coding: utf-8 -*-
import sqlite3
import os

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'data', 'database.sqlite'))

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# Find IDs for problems 1001..1005
cur.execute("SELECT id, code, title FROM problems WHERE code IN ('1001', '1002', '1003', '1004', '1005') ORDER BY code ASC")
rows = cur.fetchall()
prob_map = {code: pid for pid, code, title in rows}
print("Problem Map:", prob_map)

# 1. Update contest_problems for contest_id = 1
cur.execute("DELETE FROM contest_problems WHERE contest_id = 1")
letters = ['A', 'B', 'C', 'D', 'E']
codes = ['1001', '1002', '1003', '1004', '1005']

for idx, code in enumerate(codes):
    pid = prob_map.get(code)
    if pid:
        cur.execute("""
            INSERT INTO contest_problems (contest_id, problem_id, problem_order, letter, score)
            VALUES (1, ?, ?, ?, 100)
        """, (pid, idx + 1, letters[idx]))

# 2. Complete editorials for contest 1 problems
EDITORIALS = [
    {
        "code": "1001",
        "explanation": """### Masala tahlili: A + B (Ikkita son yig'indisi)

Ushbu masalada ikkita butun son $A$ va $B$ berilgan. Ularning yig'indisini hisoblab ekranga chiqarish talab qilinadi.

#### Matematik g'oya:
- Masala cheklovlari: $1 \\le A, B \\le 10^9$.
- $A + B$ qiymati maksimal $2 \\times 10^9$ bo'lishi mumkin. Bu 32-bitli signed integer (`int`) sig'imiga yaqin. C++ da xavfsizlik uchun `long long`, Java da `long` turidan foydalanish tavsiya etiladi.

#### Murakkablik:
- **Vaqt murakkabligi:** $O(1)$
- **Xotira murakkabligi:** $O(1)$
""",
        "code_cpp": """#include <iostream>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    long long a, b;
    if (cin >> a >> b) {
        cout << a + b << "\\n";
    }
    return 0;
}""",
        "code_python": """import sys

def solve():
    tokens = sys.stdin.read().split()
    if len(tokens) >= 2:
        a = int(tokens[0])
        b = int(tokens[1])
        print(a + b)

if __name__ == '__main__':
    solve()""",
        "code_java": """import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        if (in.hasNextLong()) {
            long a = in.nextLong();
            long b = in.nextLong();
            System.out.println(a + b);
        }
    }
}"""
    },
    {
        "code": "1002",
        "explanation": """### Masala tahlili: Katta-kichik (Sonlarni taqqoslash)

Berilgan $A$ va $B$ butun sonlarini o'zaro taqqoslab, mos ravishda `>`, `<` yoki `=` belgisini chiqarish lozim.

#### Algoritm:
- Agar $A > B$ bo'lsa, `>` belgisini chiqaramiz.
- Agar $A < B$ bo'lsa, `<` belgisini chiqaramiz.
- Aks holda (ya'ni $A = B$ bo'lsa), `=` belgisini chiqaramiz.

#### Murakkablik:
- **Vaqt murakkabligi:** $O(1)$
- **Xotira murakkabligi:** $O(1)$
""",
        "code_cpp": """#include <iostream>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    long long a, b;
    if (cin >> a >> b) {
        if (a > b) cout << ">\\n";
        else if (a < b) cout << "<\\n";
        else cout << "=\\n";
    }
    return 0;
}""",
        "code_python": """import sys

def solve():
    tokens = sys.stdin.read().split()
    if len(tokens) >= 2:
        a = int(tokens[0])
        b = int(tokens[1])
        if a > b:
            print(">")
        elif a < b:
            print("<")
        else:
            print("=")

if __name__ == '__main__':
    solve()""",
        "code_java": """import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        if (in.hasNextLong()) {
            long a = in.nextLong();
            long b = in.nextLong();
            if (a > b) System.out.println(">");
            else if (a < b) System.out.println("<");
            else System.out.println("=");
        }
    }
}"""
    },
    {
        "code": "1003",
        "explanation": """### Masala tahlili: Massiv yig'indisi

$N$ ta butun sondan iborat massiv elementlarining umumiy yig'indisini hisoblash lozim.

#### Muhim nuqta:
- $N \\le 10^5$, har bir element $A_i \\le 10^9$.
- Maksimal yig'indi: $10^5 \\times 10^9 = 10^{14}$. Bu qiymat 32-bitli integer chegarasidan ($2 \\times 10^9$) oshib ketadi (Overflow).
- Shu sababli yig'indi o'zgaruvchisini 64-bitli butun son turida (`long long` C++ da, `long` Java da) e'lon qilish shart!

#### Murakkablik:
- **Vaqt murakkabligi:** $O(N)$
- **Xotira murakkabligi:** $O(1)$
""",
        "code_cpp": """#include <iostream>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n;
    if (cin >> n) {
        long long sum = 0;
        for (int i = 0; i < n; i++) {
            long long x;
            cin >> x;
            sum += x;
        }
        cout << sum << "\\n";
    }
    return 0;
}""",
        "code_python": """import sys

def solve():
    tokens = sys.stdin.read().split()
    if not tokens:
        return
    n = int(tokens[0])
    total = sum(int(x) for x in tokens[1:1+n])
    print(total)

if __name__ == '__main__':
    solve()""",
        "code_java": """import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        if (in.hasNextInt()) {
            int n = in.nextInt();
            long sum = 0;
            for (int i = 0; i < n; i++) {
                sum += in.nextLong();
            }
            System.out.println(sum);
        }
    }
}"""
    },
    {
        "code": "1004",
        "explanation": """### Masala tahlili: Palindrom son

Berilgan butun son chapdan o'ngga va o'ngdan chapga bir xil o'qilishini (palindromlik) tekshirish lozim.

#### Yondashuv:
1. Sonni qator (string) sifatida o'qiymiz.
2. Qatorni teskari o'giramiz (reverse).
3. Agar asl qator teskarisiga teng bo'lsa, demak son palindrom (`YES`), aks holda `NO`.

#### Murakkablik:
- **Vaqt murakkabligi:** $O(L)$, bu yerda $L$ — raqamlar soni ($L \\le 10$).
- **Xotira murakkabligi:** $O(L)$
""",
        "code_cpp": """#include <iostream>
#include <string>
#include <algorithm>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    string s;
    if (cin >> s) {
        string rev = s;
        reverse(rev.begin(), rev.end());
        if (s == rev) cout << "YES\\n";
        else cout << "NO\\n";
    }
    return 0;
}""",
        "code_python": """import sys

def solve():
    s = sys.stdin.read().strip()
    if s:
        word = s.split()[0]
        if word == word[::-1]:
            print("YES")
        else:
            print("NO")

if __name__ == '__main__':
    solve()""",
        "code_java": """import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        if (in.hasNext()) {
            String s = in.next();
            String rev = new StringBuilder(s).reverse().toString();
            if (s.equals(rev)) {
                System.out.println("YES");
            } else {
                System.out.println("NO");
            }
        }
    }
}"""
    },
    {
        "code": "1005",
        "explanation": """### Masala tahlili: Bo'luvchilar soni

Berilgan $N$ natural sonining barcha natural bo'luvchilari sonini topish kerak.

#### Matematik g'oya:
- Oddiy $1$ dan $N$ gacha qidirish $O(N)$ vaqt oladi, $N = 10^9$ da bu Time Limit Exceeded (TLE) beradi.
- Bo'luvchilar doimo juft bo'lib keladi: agar $d$ soni $N$ ning bo'luvchisi bo'lsa, u holda $N / d$ ham bo'luvchi bo'ladi.
- Shuning uchun faqat $1 \\le d \\le \\sqrt{N}$ gacha tekshirish yetarli:
  - Agar $d$ bo'luvchi bo'lsa: hisoblagichga $+2$ qo'shamiz (agar $d \\times d = N$ bo'lsa, faqat $+1$).

#### Murakkablik:
- **Vaqt murakkabligi:** $O(\\sqrt{N})$
- **Xotira murakkabligi:** $O(1)$
""",
        "code_cpp": """#include <iostream>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    long long n;
    if (cin >> n) {
        long long count = 0;
        for (long long i = 1; i * i <= n; i++) {
            if (n % i == 0) {
                count++;
                if (i * i != n) count++;
            }
        }
        cout << count << "\\n";
    }
    return 0;
}""",
        "code_python": """import sys

def solve():
    tokens = sys.stdin.read().split()
    if tokens:
        n = int(tokens[0])
        count = 0
        i = 1
        while i * i <= n:
            if n % i == 0:
                count += 1
                if i * i != n:
                    count += 1
            i += 1
        print(count)

if __name__ == '__main__':
    solve()""",
        "code_java": """import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        if (in.hasNextLong()) {
            long n = in.nextLong();
            long count = 0;
            for (long i = 1; i * i <= n; i++) {
                if (n % i == 0) {
                    count++;
                    if (i * i != n) count++;
                }
            }
            System.out.println(count);
        }
    }
}"""
    }
]

cur.execute("DELETE FROM contest_editorials WHERE contest_id = 1")
for ed in EDITORIALS:
    pid = prob_map.get(ed["code"])
    if pid:
        cur.execute("""
            INSERT INTO contest_editorials (contest_id, problem_id, explanation, code_cpp, code_python, code_java, is_published)
            VALUES (1, ?, ?, ?, ?, ?, 1)
        """, (pid, ed["explanation"], ed["code_cpp"], ed["code_python"], ed["code_java"]))
        print(f"  Inserted editorial for problem {ed['code']} (id={pid})")

# Enable editorial for contest 1 and contest 6
cur.execute("UPDATE contests SET editorial_enabled = 1, editorial_published = 1 WHERE id IN (1, 6)")

conn.commit()
conn.close()
print("Contest 1 problems and editorials updated successfully!")
