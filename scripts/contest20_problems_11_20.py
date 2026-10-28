# -*- coding: utf-8 -*-
"""
Contest 20: Problems 11 to 20 definitions, test generators, solutions, and explanations.
"""
import random

PROBLEMS_11_20 = []

# ==============================================================================
# PROBLEM 11: p11_yoqolgan_raqam
# ==============================================================================
def gen_tests_11():
    tests = []
    # 2 Samples
    tests.append(("5\n1 3 5 2\n", "4\n"))
    tests.append(("3\n2 3\n", "1\n"))
    # Boundaries
    tests.append(("2\n1\n", "2\n"))
    tests.append(("2\n2\n", "1\n"))
    tests.append(("4\n1 2 3\n", "4\n"))
    # Randoms
    rnd = random.Random(4011)
    for n in [10, 50, 500, 5000, 50000, 200000]:
        for _ in range(4):
            missing = rnd.randint(1, n)
            arr = [x for x in range(1, n + 1) if x != missing]
            rnd.shuffle(arr)
            inp = f"{n}\n" + " ".join(map(str, arr)) + "\n"
            tests.append((inp, f"{missing}\n"))
    return tests[:27]

PROBLEMS_11_20.append({
    "code": "4011",
    "slug": "p11_yoqolgan_raqam",
    "letter": "K",
    "title": "Yo'qolgan sehrli raqam",
    "statement": (
        "Qadimgi xazinaning temir sandig'ini ochish uchun $1$ dan $N$ gacha bo'lgan barcha butun sonlarni "
        "boshqaruv paneliga bir martadan kiritish talab etiladi. Sehrgar shoshib sonlarni terayotib, "
        "ulardan aynan bittasini tushirib qoldirdi va panelga jami $N-1$ ta turli sonni kiritdi.\n\n"
        "Sehrgarga xazinani ochish uchun aynan qaysi son yetishmayotganini aniqlab bering."
    ),
    "input_format": (
        "Birinchi qatorda butun son $N$ ($2 \\le N \\le 2 \\times 10^5$) kiritiladi.\n"
        "Ikkinchi qatorda $N-1$ ta turli butun son $A_1, A_2, \\dots, A_{N-1}$ ($1 \\le A_i \\le N$) probel bilan kiritiladi."
    ),
    "output_format": "Tushirib qoldirilgan bitta butun sonni chiqaring.",
    "note": "1-namunada: $N=5$. 1, 3, 5, 2 kiritilgan. 1 dan 5 gacha sonlar orasida 4 tushirib qoldirilgan.",
    "time_limit": 1000,
    "memory_limit": 256,
    "explanation": (
        "### Masala tahlili:\n"
        "1 dan $N$ gacha bo'lgan barcha sonlar yig'indisi arifmetik progressiya formulasiga ko'ra:\n"
        "$$S_{to'liq} = \\frac{N \\times (N + 1)}{2}$$\n\n"
        "Kiritilgan $N-1$ ta sonning haqiqiy yig'indisini $S_{bor} = \\sum_{i=1}^{N-1} A_i$ deb olsak, "
        "tushirib qoldirilgan son aynan ularning ayirmasiga teng bo'ladi:\n"
        "$$A_{yo'qolgan} = S_{to'liq} - S_{bor}$$\n\n"
        "$N = 2 \\times 10^5$ bo'lganda $S_{to'liq} \\approx 2 \\times 10^{10}$ bo'ladi, shuning uchun "
        "yig'indini hisoblashda 64-bitli butun son (`long long`) ishlatish zarur.\n\n"
        "**Vaqt murakkabligi:** $O(N)$.\n"
        "**Xotira murakkabligi:** $O(1)$."
    ),
    "cpp": (
        "#include <iostream>\n"
        "using namespace std;\n\n"
        "int main() {\n"
        "    ios_base::sync_with_stdio(false);\n"
        "    cin.tie(NULL);\n"
        "    long long n;\n"
        "    if (cin >> n) {\n"
        "        long long expected = n * (n + 1) / 2;\n"
        "        long long actual = 0;\n"
        "        for (int i = 0; i < n - 1; i++) {\n"
        "            long long x;\n"
        "            cin >> x;\n"
        "            actual += x;\n"
        "        }\n"
        "        cout << (expected - actual) << \"\\n\";\n"
        "    }\n"
        "    return 0;\n"
        "}\n"
    ),
    "py": (
        "import sys\n\n"
        "def main():\n"
        "    tokens = sys.stdin.read().split()\n"
        "    if not tokens:\n"
        "        return\n"
        "    n = int(tokens[0])\n"
        "    expected = n * (n + 1) // 2\n"
        "    actual = sum(int(x) for x in tokens[1:n])\n"
        "    print(expected - actual)\n\n"
        "if __name__ == '__main__':\n"
        "    main()\n"
    ),
    "java": (
        "import java.io.*;\n"
        "import java.util.*;\n\n"
        "public class Solution11 {\n"
        "    public static void main(String[] args) throws IOException {\n"
        "        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n"
        "        String line = br.readLine();\n"
        "        if (line == null) return;\n"
        "        StringTokenizer st = new StringTokenizer(line);\n"
        "        int n = Integer.parseInt(st.nextToken());\n"
        "        long expected = (long)n * (n + 1) / 2;\n"
        "        long actual = 0;\n"
        "        for (int i = 0; i < n - 1; i++) {\n"
        "            while (!st.hasMoreTokens()) {\n"
        "                line = br.readLine();\n"
        "                if (line == null) break;\n"
        "                st = new StringTokenizer(line);\n"
        "            }\n"
        "            actual += Long.parseLong(st.nextToken());\n"
        "        }\n"
        "        System.out.println(expected - actual);\n"
        "    }\n"
        "}\n"
    ),
    "tests": gen_tests_11()
})

# ==============================================================================
# PROBLEM 12: p12_qorovullar_masofasi
# ==============================================================================
def gen_tests_12():
    tests = []
    # 2 Samples
    tests.append(("4\n10 3 25 12\n", "2\n"))
    tests.append(("3\n1 100 50\n", "49\n"))
    # Boundaries
    tests.append(("2\n0 1000000000\n", "1000000000\n"))
    tests.append(("2\n100 101\n", "1\n"))
    tests.append(("5\n1 2 4 8 16\n", "1\n"))
    # Randoms
    rnd = random.Random(4012)
    for n in [10, 50, 500, 5000, 50000, 200000]:
        for _ in range(4):
            arr = list(set(rnd.randint(0, 10**9) for _i in range(n + 100)))[:n]
            if len(arr) < n:
                arr = list(range(n))
            arr_sorted = sorted(arr)
            min_d = min(arr_sorted[i] - arr_sorted[i - 1] for i in range(1, len(arr_sorted)))
            rnd.shuffle(arr)
            inp = f"{n}\n" + " ".join(map(str, arr)) + "\n"
            tests.append((inp, f"{min_d}\n"))
    return tests[:27]

PROBLEMS_11_20.append({
    "code": "4012",
    "slug": "p12_qorovullar_masofasi",
    "letter": "L",
    "title": "Chegara qorovullari masofasi",
    "statement": (
        "Davlat chegarasi to'g'ri chiziq bo'ylab cho'zilgan. Chegara bo'ylab $N$ ta mudofaa minorasi joylashgan "
        "bo'lib, $i$-minoraning koordinatasi $X_i$ ga teng. Barcha minoralar turli koordinatalarda joylashgan.\n\n"
        "Xavf yuz berganda xabarni eng tez yetkazish uchun chegaradagi bir-biriga eng yaqin joylashgan "
        "ikkita minora o'rtasidagi masofa muhim strategik ahamiyatga ega. "
        "Har qanday ikkita minora orasidagi eng kichik masofani toping."
    ),
    "input_format": (
        "Birinchi qatorda minoralar soni $N$ ($2 \\le N \\le 2 \\times 10^5$) kiritiladi.\n"
        "Ikkinchi qatorda $N$ ta turli butun son $X_1, X_2, \\dots, X_N$ ($0 \\le X_i \\le 10^9$) probel bilan kiritiladi."
    ),
    "output_format": "Har qanday ikkita minora orasidagi eng kichik masofani bitta butun son sifatida chiqaring.",
    "note": "1-namunada: Minoralar koordinatalari: 3, 10, 12, 25. Eng yaqin minoralar 10 va 12, ular orasidagi masofa $|12 - 10| = 2$.",
    "time_limit": 1000,
    "memory_limit": 256,
    "explanation": (
        "### Masala tahlili:\n"
        "To'g'ri chiziqdagi nuqtalar orasidagi minimal masofani topish uchun ularni o'sish tartibida saralash (sorting) yetarli.\n\n"
        "Saralangan massivda $X_1 < X_2 < \\dots < X_N$ bo'lganda, eng yaqin ikkita nuqta albatta ketma-ket joylashgan bo'ladi:\n"
        "$$\\min_{1 \\le i < N} (X_{i+1} - X_i)$$\n\n"
        "Barcha juftliklarni tekshirish $O(N^2)$ vaqt olib, Time Limit Exceeded beradi. Saralash orqali masalani $O(N \\log N)$ da yechamiz.\n\n"
        "**Vaqt murakkabligi:** $O(N \\log N)$.\n"
        "**Xotira murakkabligi:** $O(N)$."
    ),
    "cpp": (
        "#include <iostream>\n"
        "#include <vector>\n"
        "#include <algorithm>\n"
        "using namespace std;\n\n"
        "int main() {\n"
        "    ios_base::sync_with_stdio(false);\n"
        "    cin.tie(NULL);\n"
        "    int n;\n"
        "    if (cin >> n) {\n"
        "        vector<long long> x(n);\n"
        "        for (int i = 0; i < n; i++) cin >> x[i];\n"
        "        sort(x.begin(), x.end());\n"
        "        long long min_diff = x[1] - x[0];\n"
        "        for (int i = 2; i < n; i++) {\n"
        "            min_diff = min(min_diff, x[i] - x[i - 1]);\n"
        "        }\n"
        "        cout << min_diff << \"\\n\";\n"
        "    }\n"
        "    return 0;\n"
        "}\n"
    ),
    "py": (
        "import sys\n\n"
        "def main():\n"
        "    tokens = sys.stdin.read().split()\n"
        "    if not tokens:\n"
        "        return\n"
        "    n = int(tokens[0])\n"
        "    x = sorted(int(t) for t in tokens[1:n+1])\n"
        "    min_diff = min(x[i] - x[i-1] for i in range(1, n))\n"
        "    print(min_diff)\n\n"
        "if __name__ == '__main__':\n"
        "    main()\n"
    ),
    "java": (
        "import java.io.*;\n"
        "import java.util.*;\n\n"
        "public class Solution12 {\n"
        "    public static void main(String[] args) throws IOException {\n"
        "        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n"
        "        String line = br.readLine();\n"
        "        if (line == null) return;\n"
        "        StringTokenizer st = new StringTokenizer(line);\n"
        "        int n = Integer.parseInt(st.nextToken());\n"
        "        long[] x = new long[n];\n"
        "        for (int i = 0; i < n; i++) {\n"
        "            while (!st.hasMoreTokens()) {\n"
        "                line = br.readLine();\n"
        "                if (line == null) break;\n"
        "                st = new StringTokenizer(line);\n"
        "            }\n"
        "            x[i] = Long.parseLong(st.nextToken());\n"
        "        }\n"
        "        Arrays.sort(x);\n"
        "        long minDiff = x[1] - x[0];\n"
        "        for (int i = 2; i < n; i++) {\n"
        "            if (x[i] - x[i - 1] < minDiff) {\n"
        "                minDiff = x[i] - x[i - 1];\n"
        "            }\n"
        "        }\n"
        "        System.out.println(minDiff);\n"
        "    }\n"
        "}\n"
    ),
    "tests": gen_tests_12()
})

# ==============================================================================
# PROBLEM 13: p13_poytaxt_bekatlari (HAS ASCII-ART DIAGRAM)
# ==============================================================================
def gen_tests_13():
    tests = []
    # 2 Samples
    tests.append(("3\n2 3\n-4 1\n1 -2\n", "5\n"))
    tests.append(("2\n0 0\n-10 -20\n", "30\n"))
    # Boundaries
    tests.append(("1\n0 0\n", "0\n"))
    tests.append(("1\n1000000000 1000000000\n", "2000000000\n"))
    tests.append(("1\n-1000000000 -1000000000\n", "2000000000\n"))
    # Randoms
    rnd = random.Random(4013)
    for n in [5, 20, 500, 5000, 50000, 100000]:
        for _ in range(4):
            pts = []
            max_d = 0
            for _i in range(n):
                x = rnd.randint(-10**9, 10**9)
                y = rnd.randint(-10**9, 10**9)
                d = abs(x) + abs(y)
                if d > max_d:
                    max_d = d
                pts.append(f"{x} {y}")
            inp = f"{n}\n" + "\n".join(pts) + "\n"
            tests.append((inp, f"{max_d}\n"))
    return tests[:27]

PROBLEMS_11_20.append({
    "code": "4013",
    "slug": "p13_poytaxt_bekatlari",
    "letter": "M",
    "title": "Poytaxt bekatlari",
    "statement": (
        "Zamonaviy poytaxt shahrining markazida koordinatasi $(0, 0)$ bo'lgan Markaziy Maydon joylashgan. "
        "Shaharda $N$ ta tezyurar bekat qurilgan bo'lib, $i$-bekatning koordinatasi $(X_i, Y_i)$ ga teng.\n\n"
        "Shahar ko'chalari qat'iy kataksimon (to'rsimon) bo'lgani sababli, harakatlanish faqat gorizontal va "
        "vertikal yo'nalishlarda amalga oshiriladi. Shu sababli, maydondan bekatgacha bo'lgan masofa "
        "Manxetten masofasi bo'yicha o'lchanadi: $|X_i| + |Y_i|$.\n\n"
        "Quyidagi sxemada Manxetten masofasining hisoblanishi ko'rsatilgan:\n\n"
        "```\n"
        "           Y\n"
        "           ^\n"
        "           |       * B (X=2, Y=3)\n"
        "           |       |  Manxetten masofasi:\n"
        "   --------+-------+-----> X   |X| + |Y| = |2| + |3| = 5\n"
        "         (0,0)     |\n"
        "```\n\n"
        "Barcha $N$ ta bekat orasidan Markaziy Maydondan eng uzoqda joylashgan bekatgacha bo'lgan "
        "masofani toping."
    ),
    "input_format": (
        "Birinchi qatorda bekatlar soni $N$ ($1 \\le N \\le 10^5$) kiritiladi.\n"
        "Keyingi $N$ ta qatorda ikkitadan butun son $X_i, Y_i$ ($-10^9 \\le X_i, Y_i \\le 10^9$) kiritiladi."
    ),
    "output_format": "Markaziy Maydondan eng uzoq bekat masofasini bitta butun son sifatida chiqaring.",
    "note": "1-namunada: Bekatlar masofalari: $|2|+|3|=5$, $|-4|+|1|=5$, $|1|+|-2|=3$. Eng kattasi 5.",
    "time_limit": 1000,
    "memory_limit": 256,
    "explanation": (
        "### Masala tahlili:\n"
        "Har bir $(X_i, Y_i)$ nuqta uchun Markaziy Maydon $(0, 0)$ gacha bo'lgan Manxetten masofasi $|X_i| + |Y_i|$ formulasi bilan hisoblanadi.\n\n"
        "Biz barcha $N$ ta nuqta uchun ushbu qiymatlarning maksimalini topishimiz zarur:\n"
        "$$D_{max} = \\max_{1 \\le i \\le N} (|X_i| + |Y_i|)$$\n\n"
        "Koordinatalar $10^9$ gacha bo'lganligi sababli, masofa $2 \\times 10^9$ ga yetishi mumkin. 64-bit butun son (`long long`) ishlatiladi.\n\n"
        "**Vaqt murakkabligi:** $O(N)$.\n"
        "**Xotira murakkabligi:** $O(1)$."
    ),
    "cpp": (
        "#include <iostream>\n"
        "#include <cmath>\n"
        "#include <algorithm>\n"
        "using namespace std;\n\n"
        "int main() {\n"
        "    ios_base::sync_with_stdio(false);\n"
        "    cin.tie(NULL);\n"
        "    int n;\n"
        "    if (cin >> n) {\n"
        "        long long max_dist = 0;\n"
        "        for (int i = 0; i < n; i++) {\n"
        "            long long x, y;\n"
        "            cin >> x >> y;\n"
        "            long long d = llabs(x) + llabs(y);\n"
        "            if (d > max_dist) max_dist = d;\n"
        "        }\n"
        "        cout << max_dist << \"\\n\";\n"
        "    }\n"
        "    return 0;\n"
        "}\n"
    ),
    "py": (
        "import sys\n\n"
        "def main():\n"
        "    tokens = sys.stdin.read().split()\n"
        "    if not tokens:\n"
        "        return\n"
        "    n = int(tokens[0])\n"
        "    max_dist = 0\n"
        "    idx = 1\n"
        "    for _ in range(n):\n"
        "        x = int(tokens[idx])\n"
        "        y = int(tokens[idx + 1])\n"
        "        idx += 2\n"
        "        d = abs(x) + abs(y)\n"
        "        if d > max_dist:\n"
        "            max_dist = d\n"
        "    print(max_dist)\n\n"
        "if __name__ == '__main__':\n"
        "    main()\n"
    ),
    "java": (
        "import java.io.*;\n"
        "import java.util.*;\n\n"
        "public class Solution13 {\n"
        "    public static void main(String[] args) throws IOException {\n"
        "        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n"
        "        String line = br.readLine();\n"
        "        if (line == null) return;\n"
        "        StringTokenizer st = new StringTokenizer(line);\n"
        "        int n = Integer.parseInt(st.nextToken());\n"
        "        long maxDist = 0;\n"
        "        for (int i = 0; i < n; i++) {\n"
        "            while (!st.hasMoreTokens()) {\n"
        "                line = br.readLine();\n"
        "                if (line == null) break;\n"
        "                st = new StringTokenizer(line);\n"
        "            }\n"
        "            long x = Long.parseLong(st.nextToken());\n"
        "            long y = Long.parseLong(st.nextToken());\n"
        "            long d = Math.abs(x) + Math.abs(y);\n"
        "            if (d > maxDist) maxDist = d;\n"
        "        }\n"
        "        System.out.println(maxDist);\n"
        "    }\n"
        "}\n"
    ),
    "tests": gen_tests_13()
})

# ==============================================================================
# PROBLEM 14: p14_uchburchakli_gulzor (HAS ASCII-ART DIAGRAM)
# ==============================================================================
def gen_tests_14():
    tests = []
    # 2 Samples
    tests.append(("0 0\n3 0\n0 4\n", "YES\n"))
    tests.append(("1 1\n2 2\n3 3\n", "NO\n"))
    # Boundaries
    tests.append(("0 0\n0 1\n0 2\n", "NO\n"))
    tests.append(("0 0\n1 0\n2 0\n", "NO\n"))
    tests.append(("-1000000000 -1000000000\n0 0\n1000000000 1000000000\n", "NO\n"))
    tests.append(("-1000000000 0\n0 1000000000\n1000000000 0\n", "YES\n"))
    # Randoms
    rnd = random.Random(4014)
    for _ in range(21):
        mode = rnd.choice(["collinear", "triangle"])
        if mode == "collinear":
            x1 = rnd.randint(-10**8, 10**8)
            y1 = rnd.randint(-10**8, 10**8)
            dx = rnd.randint(-10**4, 10**4)
            dy = rnd.randint(-10**4, 10**4)
            k1 = rnd.randint(1, 10)
            k2 = rnd.randint(11, 20)
            x2 = x1 + k1 * dx
            y2 = y1 + k1 * dy
            x3 = x1 + k2 * dx
            y3 = y1 + k2 * dy
        else:
            x1 = rnd.randint(-10**9, 10**9)
            y1 = rnd.randint(-10**9, 10**9)
            x2 = rnd.randint(-10**9, 10**9)
            y2 = rnd.randint(-10**9, 10**9)
            x3 = rnd.randint(-10**9, 10**9)
            y3 = rnd.randint(-10**9, 10**9)
        
        cross = (x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1)
        ans = "YES" if cross != 0 else "NO"
        tests.append((f"{x1} {y1}\n{x2} {y2}\n{x3} {y3}\n", f"{ans}\n"))
    return tests

PROBLEMS_11_20.append({
    "code": "4014",
    "slug": "p14_uchburchakli_gulzor",
    "letter": "N",
    "title": "Uchburchakli gulzor",
    "statement": (
        "Tajribali bog'bon yangi park hududida uchburchak shaklidagi gulzor barpo etmoqchi. "
        "U tekislikdagi uchta nuqtaga ustun qo'ydi: $A(X_1, Y_1)$, $B(X_2, Y_2)$ va $C(X_3, Y_3)$.\n\n"
        "Agar bu uchta nuqta bitta to'g'ri chiziqda yotmasa, ustunlar orasiga tasma tortib haqiqiy gulzor "
        "yaratish mumkin bo'ladi. Ammo, agar uchala nuqta bitta to'g'ri chiziqda yotib qolsa, yuzasi nolga "
        "teng bo'lib, gulzor qurib bo'lmaydi.\n\n"
        "Quyidagi sxemada ikkala holat tasvirlangan:\n\n"
        "```\n"
        "      Haqiqiy gulzor (YES):           Bitta to'g'ri chiziqda (NO):\n"
        "             C (X3, Y3)\n"
        "            / \\\n"
        "           /   \\                         A           B           C\n"
        "          /     \\                     (X1,Y1)     (X2,Y2)     (X3,Y3)\n"
        "         *-------*\n"
        "     A(X1,Y1)   B(X2,Y2)\n"
        "```\n\n"
        "Bog'bon tanlagan nuqtalar asosida haqiqiy uchburchakli gulzor yarata oladimi? "
        "Agar yarata olsa `YES`, aks holda `NO` so'zini chiqaring."
    ),
    "input_format": (
        "Uchta alohida qatorda mos ravishda $X_1, Y_1$, so'ng $X_2, Y_2$, va $X_3, Y_3$ koordinatalari "
        "($-10^9 \\le X_i, Y_i \\le 10^9$) kiritiladi."
    ),
    "output_format": "Haqiqiy uchburchak hosil bo'lsa `YES`, aks holda `NO` chiqaring.",
    "note": "1-namunada: (0,0), (3,0), (0,4) nuqtalari to'g'ri burchakli uchburchak hosil qiladi (`YES`). 2-namunada esa nuqtalar $y = x$ chizig'ida yotadi (`NO`).",
    "time_limit": 1000,
    "memory_limit": 256,
    "explanation": (
        "### Masala tahlili:\n"
        "Uchta nuqta $A, B, C$ bitta to'g'ri chiziqda yotmasligi (kollinear bo'lmasligi) sharti ularning "
        "vektor ko'paytmasi (cross product) yoki ikki karra uchburchak yuzasining noldan farqli bo'lishidir:\n"
        "$$\\Delta = (X_2 - X_1)(Y_3 - Y_1) - (Y_2 - Y_1)(X_3 - X_1)$$\n\n"
        "- Agar $\\Delta \\ne 0$ bo'lsa, nuqtalar bitta chiziqda yotmaydi va uchburchak hosil qiladi (`YES`).\n"
        "- Agar $\\Delta = 0$ bo'lsa, nuqtalar bitta chiziqda yotadi (`NO`).\n\n"
        "Koordinatalar farqi $2 \\times 10^9$ gacha bo'lishi mumkinligi sababli ularning ko'paytmasi $4 \\times 10^{18}$ "
        "ga yetadi. C++ da `__int128_t` yoki `long long`, Python va Java da katta sonlar bilan ishlash tavsiya etiladi.\n\n"
        "**Vaqt murakkabligi:** $O(1)$.\n"
        "**Xotira murakkabligi:** $O(1)$."
    ),
    "cpp": (
        "#include <iostream>\n"
        "using namespace std;\n\n"
        "int main() {\n"
        "    ios_base::sync_with_stdio(false);\n"
        "    cin.tie(NULL);\n"
        "    long long x1, y1, x2, y2, x3, y3;\n"
        "    if (cin >> x1 >> y1 >> x2 >> y2 >> x3 >> y3) {\n"
        "        __int128 dx1 = x2 - x1;\n"
        "        __int128 dy1 = y2 - y1;\n"
        "        __int128 dx2 = x3 - x1;\n"
        "        __int128 dy2 = y3 - y1;\n"
        "        __int128 cross = dx1 * dy2 - dy1 * dx2;\n"
        "        if (cross != 0) cout << \"YES\\n\";\n"
        "        else cout << \"NO\\n\";\n"
        "    }\n"
        "    return 0;\n"
        "}\n"
    ),
    "py": (
        "import sys\n\n"
        "def main():\n"
        "    tokens = sys.stdin.read().split()\n"
        "    if not tokens:\n"
        "        return\n"
        "    x1, y1, x2, y2, x3, y3 = map(int, tokens[:6])\n"
        "    cross = (x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1)\n"
        "    print(\"YES\" if cross != 0 else \"NO\")\n\n"
        "if __name__ == '__main__':\n"
        "    main()\n"
    ),
    "java": (
        "import java.io.*;\n"
        "import java.math.BigInteger;\n"
        "import java.util.*;\n\n"
        "public class Solution14 {\n"
        "    public static void main(String[] args) {\n"
        "        Scanner in = new Scanner(System.in);\n"
        "        if (in.hasNextLong()) {\n"
        "            long x1 = in.nextLong();\n"
        "            long y1 = in.nextLong();\n"
        "            long x2 = in.nextLong();\n"
        "            long y2 = in.nextLong();\n"
        "            long x3 = in.nextLong();\n"
        "            long y3 = in.nextLong();\n"
        "            BigInteger dx1 = BigInteger.valueOf(x2 - x1);\n"
        "            BigInteger dy1 = BigInteger.valueOf(y2 - y1);\n"
        "            BigInteger dx2 = BigInteger.valueOf(x3 - x1);\n"
        "            BigInteger dy2 = BigInteger.valueOf(y3 - y1);\n"
        "            BigInteger cross = dx1.multiply(dy2).subtract(dy1.multiply(dx2));\n"
        "            System.out.println(cross.signum() != 0 ? \"YES\" : \"NO\");\n"
        "        }\n"
        "    }\n"
        "}\n"
    ),
    "tests": gen_tests_14()
})

# ==============================================================================
# PROBLEM 15: p15_unikal_mevalar
# ==============================================================================
def gen_tests_15():
    tests = []
    # 2 Samples
    tests.append(("6\n5 2 3 5 2 7\n", "2\n"))
    tests.append(("4\n10 10 20 20\n", "0\n"))
    # Boundaries
    tests.append(("1\n100\n", "1\n"))
    tests.append(("3\n1 2 3\n", "3\n"))
    tests.append(("5\n7 7 7 7 7\n", "0\n"))
    # Randoms
    rnd = random.Random(4015)
    for n in [10, 50, 500, 5000, 50000, 200000]:
        for _ in range(4):
            arr = []
            for _i in range(n):
                arr.append(rnd.randint(1, 10**9 if rnd.random() < 0.3 else 1000))
            from collections import Counter
            counts = Counter(arr)
            ans = sum(1 for v in counts.values() if v == 1)
            inp = f"{n}\n" + " ".join(map(str, arr)) + "\n"
            tests.append((inp, f"{ans}\n"))
    return tests[:27]

PROBLEMS_11_20.append({
    "code": "4015",
    "slug": "p15_unikal_mevalar",
    "letter": "O",
    "title": "Noyob mevalar savati",
    "statement": (
        "Sehrli bog'dan yangi hosil terib olindi. Savatda jami $N$ ta meva bor bo'lib, har bir mevaning "
        "navini bildiruvchi butun sonli kodi bor: $A_1, A_2, \\dots, A_N$.\n\n"
        "Bog'bon faqatgina savatda **aynan bir dona** mavjud bo'lgan (boshqa hech bir meva bilan navi takrorlanmaydigan) "
        "mevalarni \"noyob meva\" deb ataydi.\n\n"
        "Savatdagi barcha mevalar orasida nechta noyob meva borligini aniqlang."
    ),
    "input_format": (
        "Birinchi qatorda mevalar soni $N$ ($1 \\le N \\le 2 \\times 10^5$) kiritiladi.\n"
        "Ikkinchi qatorda $N$ ta butun son $A_1, A_2, \\dots, A_N$ ($1 \\le A_i \\le 10^9$) probel bilan kiritiladi."
    ),
    "output_format": "Savatdagi noyob mevalar sonini bitta butun son sifatida chiqaring.",
    "note": "1-namunada: 5 ikki marta, 2 ikki marta uchragan. 3 va 7 esa aynan bir martadan uchragan. Jami 2 ta noyob meva bor.",
    "time_limit": 1000,
    "memory_limit": 256,
    "explanation": (
        "### Masala tahlili:\n"
        "Bizdan massivda takrorlanishlar soni aynan 1 ga teng bo'lgan elementlar miqdorini topish talab qilinadi.\n\n"
        "**Usul:** Massivni saralaymiz ($O(N \\log N)$). Saralangan massivda bir xil elementlar yonma-yon joylashadi.\n"
        "Har bir $i$ element uchun: agar u o'zidan oldingi ($A_{i-1}$) va keyingi ($A_{i+1}$) elementga teng bo'lmasa, demak u noyobdir.\n"
        "Shu tariqa barcha noyob elementlarni bitta siklda sanab chiqish mumkin.\n\n"
        "**Vaqt murakkabligi:** $O(N \\log N)$.\n"
        "**Xotira murakkabligi:** $O(N)$."
    ),
    "cpp": (
        "#include <iostream>\n"
        "#include <vector>\n"
        "#include <algorithm>\n"
        "using namespace std;\n\n"
        "int main() {\n"
        "    ios_base::sync_with_stdio(false);\n"
        "    cin.tie(NULL);\n"
        "    int n;\n"
        "    if (cin >> n) {\n"
        "        vector<long long> a(n);\n"
        "        for (int i = 0; i < n; i++) cin >> a[i];\n"
        "        sort(a.begin(), a.end());\n"
        "        int unique_count = 0;\n"
        "        for (int i = 0; i < n; i++) {\n"
        "            bool left_diff = (i == 0 || a[i] != a[i - 1]);\n"
        "            bool right_diff = (i == n - 1 || a[i] != a[i + 1]);\n"
        "            if (left_diff && right_diff) {\n"
        "                unique_count++;\n"
        "            }\n"
        "        }\n"
        "        cout << unique_count << \"\\n\";\n"
        "    }\n"
        "    return 0;\n"
        "}\n"
    ),
    "py": (
        "import sys\n\n"
        "def main():\n"
        "    tokens = sys.stdin.read().split()\n"
        "    if not tokens:\n"
        "        return\n"
        "    n = int(tokens[0])\n"
        "    a = sorted(int(x) for x in tokens[1:n+1])\n"
        "    ans = 0\n"
        "    for i in range(n):\n"
        "        left_diff = (i == 0 or a[i] != a[i - 1])\n"
        "        right_diff = (i == n - 1 or a[i] != a[i + 1])\n"
        "        if left_diff and right_diff:\n"
        "            ans += 1\n"
        "    print(ans)\n\n"
        "if __name__ == '__main__':\n"
        "    main()\n"
    ),
    "java": (
        "import java.io.*;\n"
        "import java.util.*;\n\n"
        "public class Solution15 {\n"
        "    public static void main(String[] args) throws IOException {\n"
        "        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n"
        "        String line = br.readLine();\n"
        "        if (line == null) return;\n"
        "        StringTokenizer st = new StringTokenizer(line);\n"
        "        int n = Integer.parseInt(st.nextToken());\n"
        "        long[] a = new long[n];\n"
        "        for (int i = 0; i < n; i++) {\n"
        "            while (!st.hasMoreTokens()) {\n"
        "                line = br.readLine();\n"
        "                if (line == null) break;\n"
        "                st = new StringTokenizer(line);\n"
        "            }\n"
        "            a[i] = Long.parseLong(st.nextToken());\n"
        "        }\n"
        "        Arrays.sort(a);\n"
        "        int count = 0;\n"
        "        for (int i = 0; i < n; i++) {\n"
        "            boolean leftDiff = (i == 0 || a[i] != a[i - 1]);\n"
        "            boolean rightDiff = (i == n - 1 || a[i] != a[i + 1]);\n"
        "            if (leftDiff && rightDiff) count++;\n"
        "        }\n"
        "        System.out.println(count);\n"
        "    }\n"
        "}\n"
    ),
    "tests": gen_tests_15()
})

# ==============================================================================
# PROBLEM 16: p16_zaharli_tuman (HAS ASCII-ART DIAGRAM)
# ==============================================================================
def gen_tests_16():
    tests = []
    # 2 Samples
    tests.append(("3 3\n0 0 0\n0 1 0\n0 0 0\n", "4\n"))
    tests.append(("2 2\n0 0\n0 0\n", "4\n"))
    # Boundaries
    tests.append(("1 1\n0\n", "1\n"))
    tests.append(("1 1\n1\n", "0\n"))
    tests.append(("1 3\n0 1 0\n", "0\n"))
    tests.append(("3 1\n0\n1\n0\n", "0\n"))
    # Randoms
    rnd = random.Random(4016)
    for n, m in [(4, 4), (5, 6), (20, 20), (50, 50), (200, 200), (500, 500)]:
        for _ in range(4):
            grid = []
            for _r in range(n):
                row = [1 if rnd.random() < 0.15 else 0 for _c in range(m)]
                grid.append(row)
            # count safe
            safe = 0
            for r in range(n):
                for c in range(m):
                    if grid[r][c] == 0:
                        has_fog = False
                        for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                            nr, nc = r + dr, c + dc
                            if 0 <= nr < n and 0 <= nc < m:
                                if grid[nr][nc] == 1:
                                    has_fog = True
                                    break
                        if not has_fog:
                            safe += 1
            lines = [f"{n} {m}"]
            for row in grid:
                lines.append(" ".join(map(str, row)))
            tests.append(("\n".join(lines) + "\n", f"{safe}\n"))
    return tests[:27]

PROBLEMS_11_20.append({
    "code": "4016",
    "slug": "p16_zaharli_tuman",
    "letter": "P",
    "title": "Zaharli tuman va xavfsiz kataklar",
    "statement": (
        "Qadimiy yerosti labirinti $N \\times M$ o'lchamli to'rsimon maydondan iborat. "
        "Maydonning ba'zi kataklarida zaharli tuman manbalari mavjud (ular `1` bilan belgilanadi). "
        "Qolgan barcha bo'sh kataklar esa `0` bilan belgilanadi.\n\n"
        "Zaharli tuman o'zi joylashgan katakdan to'rtta asosiy qo'shni katakka (yuqoriga, pastga, "
        "chapga va o'ngga) tarqaladi. Bo'sh katak (`0`) faqatgina o'zida ham, unga qo'shni bo'lgan "
        "4 ta katakning birortasida ham zaharli tuman manbai (`1`) bo'lmagandagina **mutlaqo xavfsiz** hisoblanadi.\n\n"
        "Quyidagi sxemada xavfsizlik sharti tasvirlangan:\n\n"
        "```\n"
        "                (i-1, j)\n"
        "                   |\n"
        "     (i, j-1) ---- + ---- (i, j+1)\n"
        "                   |\n"
        "                (i+1, j)\n"
        "     Katak (i, j) va uning 4 qo'shnisida\n"
        "     zahar ('1') bo'lmasa -> XAVFSIZ!\n"
        "```\n\n"
        "Labirintda jami nechta mutlaqo xavfsiz katak borligini aniqlang."
    ),
    "input_format": (
        "Birinchi qatorda ikkita butun son $N$ va $M$ ($1 \\le N, M \\le 1000$) kiritiladi.\n"
        "Keyingi $N$ ta qatorda $M$ tadan $0$ yoki $1$ raqamlari probel bilan kiritiladi."
    ),
    "output_format": "Mutlaqo xavfsiz bo'lgan kataklar sonini bitta butun son sifatida chiqaring.",
    "note": "1-namunada: Markazdagi (1,1) katakda zahar bor. Uning 4 ta qo'shnisi zaharlanadi. Faqat 4 ta burchak kataklari xavfsiz qoladi.",
    "time_limit": 1000,
    "memory_limit": 256,
    "explanation": (
        "### Masala tahlili:\n"
        "Har bir $(r, c)$ katak uchun:\n"
        "1. Uning qiymati $grid[r][c] == 0$ bo'lishi kerak;\n"
        "2. Uning mavjud 4 ta ortogonal qo'shnisi $(r-1, c), (r+1, c), (r, c-1), (r, c+1)$ larining hech birida $1$ bo'lmasligi kerak.\n\n"
        "Bu shartlarni qanoatlantiruvchi kataklarni $N \\times M$ matritsani bir marta ko'rib chiqish orqali sanaymiz.\n\n"
        "**Vaqt murakkabligi:** $O(N \\times M)$.\n"
        "**Xotira murakkabligi:** $O(N \\times M)$."
    ),
    "cpp": (
        "#include <iostream>\n"
        "#include <vector>\n"
        "using namespace std;\n\n"
        "int main() {\n"
        "    ios_base::sync_with_stdio(false);\n"
        "    cin.tie(NULL);\n"
        "    int n, m;\n"
        "    if (cin >> n >> m) {\n"
        "        vector<vector<int>> g(n, vector<int>(m));\n"
        "        for (int i = 0; i < n; i++) {\n"
        "            for (int j = 0; j < m; j++) cin >> g[i][j];\n"
        "        }\n"
        "        int safe_count = 0;\n"
        "        int dr[] = {-1, 1, 0, 0};\n"
        "        int dc[] = {0, 0, -1, 1};\n"
        "        for (int i = 0; i < n; i++) {\n"
        "            for (int j = 0; j < m; j++) {\n"
        "                if (g[i][j] == 0) {\n"
        "                    bool ok = true;\n"
        "                    for (int d = 0; d < 4; d++) {\n"
        "                        int ni = i + dr[d];\n"
        "                        int nj = j + dc[d];\n"
        "                        if (ni >= 0 && ni < n && nj >= 0 && nj < m) {\n"
        "                            if (g[ni][nj] == 1) { ok = false; break; }\n"
        "                        }\n"
        "                    }\n"
        "                    if (ok) safe_count++;\n"
        "                }\n"
        "            }\n"
        "        }\n"
        "        cout << safe_count << \"\\n\";\n"
        "    }\n"
        "    return 0;\n"
        "}\n"
    ),
    "py": (
        "import sys\n\n"
        "def main():\n"
        "    input_data = sys.stdin.read().split()\n"
        "    if not input_data:\n"
        "        return\n"
        "    n = int(input_data[0])\n"
        "    m = int(input_data[1])\n"
        "    idx = 2\n"
        "    g = []\n"
        "    for _ in range(n):\n"
        "        g.append([int(x) for x in input_data[idx:idx+m]])\n"
        "        idx += m\n"
        "    safe = 0\n"
        "    dirs = [(-1, 0), (1, 0), (0, -1), (0, 1)]\n"
        "    for i in range(n):\n"
        "        for j in range(m):\n"
        "            if g[i][j] == 0:\n"
        "                has_fog = False\n"
        "                for di, dj in dirs:\n"
        "                    ni, nj = i + di, j + dj\n"
        "                    if 0 <= ni < n and 0 <= nj < m and g[ni][nj] == 1:\n"
        "                        has_fog = True\n"
        "                        break\n"
        "                if not has_fog:\n"
        "                    safe += 1\n"
        "    print(safe)\n\n"
        "if __name__ == '__main__':\n"
        "    main()\n"
    ),
    "java": (
        "import java.io.*;\n"
        "import java.util.*;\n\n"
        "public class Solution16 {\n"
        "    public static void main(String[] args) throws IOException {\n"
        "        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n"
        "        String line = br.readLine();\n"
        "        if (line == null) return;\n"
        "        StringTokenizer st = new StringTokenizer(line);\n"
        "        int n = Integer.parseInt(st.nextToken());\n"
        "        int m = Integer.parseInt(st.nextToken());\n"
        "        int[][] g = new int[n][m];\n"
        "        for (int i = 0; i < n; i++) {\n"
        "            for (int j = 0; j < m; j++) {\n"
        "                while (!st.hasMoreTokens()) {\n"
        "                    line = br.readLine();\n"
        "                    if (line == null) break;\n"
        "                    st = new StringTokenizer(line);\n"
        "                }\n"
        "                g[i][j] = Integer.parseInt(st.nextToken());\n"
        "            }\n"
        "        }\n"
        "        int safe = 0;\n"
        "        int[] dr = {-1, 1, 0, 0};\n"
        "        int[] dc = {0, 0, -1, 1};\n"
        "        for (int i = 0; i < n; i++) {\n"
        "            for (int j = 0; j < m; j++) {\n"
        "                if (g[i][j] == 0) {\n"
        "                    boolean ok = true;\n"
        "                    for (int d = 0; d < 4; d++) {\n"
        "                        int ni = i + dr[d];\n"
        "                        int nj = j + dc[d];\n"
        "                        if (ni >= 0 && ni < n && nj >= 0 && nj < m) {\n"
        "                            if (g[ni][nj] == 1) { ok = false; break; }\n"
        "                        }\n"
        "                    }\n"
        "                    if (ok) safe++;\n"
        "                }\n"
        "            }\n"
        "        }\n"
        "        System.out.println(safe);\n"
        "    }\n"
        "}\n"
    ),
    "tests": gen_tests_16()
})

# ==============================================================================
# PROBLEM 17: p17_tekis_hudud (HAS ASCII-ART DIAGRAM)
# ==============================================================================
def gen_tests_17():
    tests = []
    # 2 Samples
    tests.append(("3 3\n10 12 20\n11 13 25\n30 35 40\n", "3\n"))
    tests.append(("2 2\n5 5\n5 5\n", "0\n"))
    # Boundaries
    tests.append(("2 2\n1 100\n1 100\n", "99\n"))
    tests.append(("2 2\n0 1000000000\n0 1000000000\n", "1000000000\n"))
    # Randoms
    rnd = random.Random(4017)
    for n, m in [(3, 4), (5, 5), (10, 10), (50, 50), (200, 200), (400, 400)]:
        for _ in range(4):
            grid = []
            for _r in range(n):
                grid.append([rnd.randint(0, 10**9) for _c in range(m)])
            min_diff = 10**18
            for r in range(n - 1):
                for c in range(m - 1):
                    vals = [grid[r][c], grid[r+1][c], grid[r][c+1], grid[r+1][c+1]]
                    diff = max(vals) - min(vals)
                    if diff < min_diff:
                        min_diff = diff
            lines = [f"{n} {m}"]
            for row in grid:
                lines.append(" ".join(map(str, row)))
            tests.append(("\n".join(lines) + "\n", f"{min_diff}\n"))
    return tests[:27]

PROBLEMS_11_20.append({
    "code": "4017",
    "slug": "p17_tekis_hudud",
    "letter": "Q",
    "title": "Eng tekis yer maydoni",
    "statement": (
        "Tog'li maskanda yangi istirohat bog'i qurish uchun yer maydonining balandliklari "
        "$N \\times M$ o'lchamli matritsa ko'rinishida o'lchab chiqildi. $H_{i,j}$ katak balandligini bildiradi.\n\n"
        "Qurilish me'yorlariga ko'ra, bino qurish uchun o'lchami roppa-rosa $2 \\times 2$ bo'lgan eng tekis "
        "yer maydonini tanlash talab etiladi. Har qanday $2 \\times 2$ blokning notekislik darajasi undagi "
        "to'rtta katak balandliklarining eng kattasi va eng kichigi orasidagi farqdir: $\\max - \\min$.\n\n"
        "Quyidagi sxemada $2 \\times 2$ blokning o'rganilishi ko'rsatilgan:\n\n"
        "```\n"
        "      Balandliklar matritsasi:        Har bir 2x2 yer maydoni:\n"
        "      +----+----+----+                 +----+----+\n"
        "      | 12 | 15 | 20 |                 | a  | b  |  Notekislik =\n"
        "      +----+----+----+        -->      +----+----+  max(a,b,c,d) - min(a,b,c,d)\n"
        "      | 14 | 16 | 22 |                 | c  | d  |\n"
        "      +----+----+----+                 +----+----+\n"
        "```\n\n"
        "Butun hududdagi barcha mumkin bo'lgan $2 \\times 2$ bloklar orasida eng kichik notekislik darajasini toping."
    ),
    "input_format": (
        "Birinchi qatorda ikkita butun son $N$ va $M$ ($2 \\le N, M \\le 1000$) kiritiladi.\n"
        "Keyingi $N$ ta qatorda $M$ tadan butun son $H_{i,j}$ ($0 \\le H_{i,j} \\le 10^9$) kiritiladi."
    ),
    "output_format": "Barcha $2 \\times 2$ bloklar orasidagi eng kichik notekislik darajasini chiqaring.",
    "note": "1-namunada: Yuqori chap $2 \\times 2$ blok: [10, 12, 11, 13]. Max=13, Min=10. Farq: $13 - 10 = 3$.",
    "time_limit": 1000,
    "memory_limit": 256,
    "explanation": (
        "### Masala tahlili:\n"
        "Matritsada jami $(N - 1) \\times (M - 1)$ ta $2 \\times 2$ o'lchamli blok mavjud.\n\n"
        "Har bir $0 \\le i < N-1, 0 \\le j < M-1$ uchun to'rtta katak qiymatini olamiz:\n"
        "$$a = H_{i,j}, b = H_{i,j+1}, c = H_{i+1,j}, d = H_{i+1,j+1}$$\n"
        "Va farqni hisoblaymiz: $\\max(a, b, c, d) - \\min(a, b, c, d)$.\n\n"
        "Ushbu farqlarning minimalini global o'zgaruvchida saqlab boramiz. $N, M \\le 1000$ bo'lgani uchun "
        "umumiy bloklar soni $10^6$ dan oshmaydi va bitta siklda tez ishlaydi.\n\n"
        "**Vaqt murakkabligi:** $O(N \\times M)$.\n"
        "**Xotira murakkabligi:** $O(N \\times M)$."
    ),
    "cpp": (
        "#include <iostream>\n"
        "#include <vector>\n"
        "#include <algorithm>\n"
        "using namespace std;\n\n"
        "int main() {\n"
        "    ios_base::sync_with_stdio(false);\n"
        "    cin.tie(NULL);\n"
        "    int n, m;\n"
        "    if (cin >> n >> m) {\n"
        "        vector<vector<long long>> h(n, vector<long long>(m));\n"
        "        for (int i = 0; i < n; i++) {\n"
        "            for (int j = 0; j < m; j++) cin >> h[i][j];\n"
        "        }\n"
        "        long long min_diff = 2e18;\n"
        "        for (int i = 0; i < n - 1; i++) {\n"
        "            for (int j = 0; j < m - 1; j++) {\n"
        "                long long a = h[i][j];\n"
        "                long long b = h[i][j + 1];\n"
        "                long long c = h[i + 1][j];\n"
        "                long long d = h[i + 1][j + 1];\n"
        "                long long mx = max({a, b, c, d});\n"
        "                long long mn = min({a, b, c, d});\n"
        "                if (mx - mn < min_diff) min_diff = mx - mn;\n"
        "            }\n"
        "        }\n"
        "        cout << min_diff << \"\\n\";\n"
        "    }\n"
        "    return 0;\n"
        "}\n"
    ),
    "py": (
        "import sys\n\n"
        "def main():\n"
        "    input_data = sys.stdin.read().split()\n"
        "    if not input_data:\n"
        "        return\n"
        "    n = int(input_data[0])\n"
        "    m = int(input_data[1])\n"
        "    idx = 2\n"
        "    h = []\n"
        "    for _ in range(n):\n"
        "        h.append([int(x) for x in input_data[idx:idx+m]])\n"
        "        idx += m\n"
        "    min_diff = 10**18\n"
        "    for i in range(n - 1):\n"
        "        row1 = h[i]\n"
        "        row2 = h[i + 1]\n"
        "        for j in range(m - 1):\n"
        "            a = row1[j]; b = row1[j + 1]\n"
        "            c = row2[j]; d = row2[j + 1]\n"
        "            mx = max(a, b, c, d)\n"
        "            mn = min(a, b, c, d)\n"
        "            diff = mx - mn\n"
        "            if diff < min_diff:\n"
        "                min_diff = diff\n"
        "    print(min_diff)\n\n"
        "if __name__ == '__main__':\n"
        "    main()\n"
    ),
    "java": (
        "import java.io.*;\n"
        "import java.util.*;\n\n"
        "public class Solution17 {\n"
        "    public static void main(String[] args) throws IOException {\n"
        "        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n"
        "        String line = br.readLine();\n"
        "        if (line == null) return;\n"
        "        StringTokenizer st = new StringTokenizer(line);\n"
        "        int n = Integer.parseInt(st.nextToken());\n"
        "        int m = Integer.parseInt(st.nextToken());\n"
        "        long[][] h = new long[n][m];\n"
        "        for (int i = 0; i < n; i++) {\n"
        "            for (int j = 0; j < m; j++) {\n"
        "                while (!st.hasMoreTokens()) {\n"
        "                    line = br.readLine();\n"
        "                    if (line == null) break;\n"
        "                    st = new StringTokenizer(line);\n"
        "                }\n"
        "                h[i][j] = Long.parseLong(st.nextToken());\n"
        "            }\n"
        "        }\n"
        "        long minDiff = Long.MAX_VALUE;\n"
        "        for (int i = 0; i < n - 1; i++) {\n"
        "            for (int j = 0; j < m - 1; j++) {\n"
        "                long a = h[i][j];\n"
        "                long b = h[i][j + 1];\n"
        "                long c = h[i + 1][j];\n"
        "                long d = h[i + 1][j + 1];\n"
        "                long mx = Math.max(Math.max(a, b), Math.max(c, d));\n"
        "                long mn = Math.min(Math.min(a, b), Math.min(c, d));\n"
        "                if (mx - mn < minDiff) minDiff = mx - mn;\n"
        "            }\n"
        "        }\n"
        "        System.out.println(minDiff);\n"
        "    }\n"
        "}\n"
    ),
    "tests": gen_tests_17()
})

# ==============================================================================
# PROBLEM 18: p18_gulchambar_chiroqlari (HAS ASCII-ART DIAGRAM)
# ==============================================================================
def gen_tests_18():
    tests = []
    # 2 Samples
    tests.append(("5 3\n2 1 5 1 4\n", "10\n"))
    tests.append(("4 2\n10 1 2 20\n", "30\n"))
    # Boundaries
    tests.append(("3 3\n5 10 15\n", "30\n"))
    tests.append(("1 1\n1000000000\n", "1000000000\n"))
    tests.append(("4 1\n5 1 8 3\n", "8\n"))
    # Randoms
    rnd = random.Random(4018)
    for n in [10, 50, 500, 5000, 50000, 200000]:
        for _ in range(4):
            k = rnd.randint(1, n)
            arr = [rnd.randint(1, 10**9) for _i in range(n)]
            # circular max sum of window k
            ext = arr + arr[:k - 1]
            cur = sum(ext[:k])
            mx = cur
            for i in range(k, len(ext)):
                cur += ext[i] - ext[i - k]
                if cur > mx:
                    mx = cur
            inp = f"{n} {k}\n" + " ".join(map(str, arr)) + "\n"
            tests.append((inp, f"{mx}\n"))
    return tests[:27]

PROBLEMS_11_20.append({
    "code": "4018",
    "slug": "p18_gulchambar_chiroqlari",
    "letter": "R",
    "title": "Gulchambar chiroqlari",
    "statement": (
        "Bayram archasini bezatish uchun aylanma (halqa) shaklida $N$ ta chiroq osilgan: $A_0, A_1, \\dots, A_{N-1}$. "
        "Halqa bo'lgani sababli $A_{N-1}$ chiroqdan keyin yana $A_0$ chiroq keladi.\n\n"
        "Har bir chiroqning yorug'lik kuchi berilgan. Bezakchi halqa bo'ylab ketma-ket joylashgan "
        "roppa-rosa $K$ ta chiroqni yoqmoqchi. Bu chiroqlar zanjirining umumiy yorug'lik kuchi ularning yig'indisiga teng.\n\n"
        "Quyidagi sxemada aylanma halqa tuzilishi tasvirlangan:\n\n"
        "```\n"
        "                     A[0]\n"
        "                  /        \\\n"
        "              A[N-1]        A[1]       Halqa bo'ylab ketma-ket K ta:\n"
        "                |             |        Oynani siljitish (Sliding Window):\n"
        "              A[N-2]        A[2]       Index: (i + j) % N\n"
        "                  \\        /\n"
        "                     A[3]\n"
        "```\n\n"
        "Halqa bo'ylab ketma-ket $K$ ta chiroqning maksimal mumkin bo'lgan yorug'lik kuchini toping."
    ),
    "input_format": (
        "Birinchi qatorda ikkita butun son $N$ va $K$ ($1 \\le K \\le N \\le 2 \\times 10^5$) kiritiladi.\n"
        "Ikkinchi qatorda $N$ ta butun son $A_0, A_1, \\dots, A_{N-1}$ ($1 \\le A_i \\le 10^9$) probel bilan kiritiladi."
    ),
    "output_format": "Ketma-ket $K$ ta chiroqning maksimal yorug'lik yig'indisini chiqaring.",
    "note": "1-namunada: Ketma-ket 3 ta chiroq yig'indilari: (2+1+5=8), (1+5+1=7), (5+1+4=10), (1+4+2=7), (4+2+1=7). Eng kattasi 10.",
    "time_limit": 1000,
    "memory_limit": 256,
    "explanation": (
        "### Masala tahlili:\n"
        "Bu aylanma massivda qat'iy uzunlikdagi ($K$) qism massivning maksimal yig'indisini topish masalasidir.\n\n"
        "Massiv halqa shaklida bo'lgani sababli, uning oxiriga dastlabki $K-1$ ta elementni ulab, uzunligi $N + K - 1$ "
        "bo'lgan chiziqli massiv hosil qilamiz. So'ngra Slidng Window (suriluvchi oyna) usuli bilan $O(N)$ da eng katta yig'indini topamiz:\n"
        "- Dastlabki $K$ ta element yig'indisini olamiz;\n"
        "- Har bir qadamda yangi elementni qo'shib, oynadan chiqib ketgan elementni ayiramiz.\n\n"
        "Yig'indi $2 \\times 10^5 \\times 10^9 = 2 \\times 10^{14}$ gacha borishi mumkin, shuning uchun 64-bit butun son (`long long`) ishlatiladi.\n\n"
        "**Vaqt murakkabligi:** $O(N)$.\n"
        "**Xotira murakkabligi:** $O(N)$."
    ),
    "cpp": (
        "#include <iostream>\n"
        "#include <vector>\n"
        "#include <algorithm>\n"
        "using namespace std;\n\n"
        "int main() {\n"
        "    ios_base::sync_with_stdio(false);\n"
        "    cin.tie(NULL);\n"
        "    int n, k;\n"
        "    if (cin >> n >> k) {\n"
        "        vector<long long> a(n);\n"
        "        for (int i = 0; i < n; i++) cin >> a[i];\n"
        "        long long cur = 0;\n"
        "        for (int i = 0; i < k; i++) cur += a[i];\n"
        "        long long max_sum = cur;\n"
        "        for (int i = 1; i < n; i++) {\n"
        "            cur -= a[i - 1];\n"
        "            cur += a[(i + k - 1) % n];\n"
        "            if (cur > max_sum) max_sum = cur;\n"
        "        }\n"
        "        cout << max_sum << \"\\n\";\n"
        "    }\n"
        "    return 0;\n"
        "}\n"
    ),
    "py": (
        "import sys\n\n"
        "def main():\n"
        "    tokens = sys.stdin.read().split()\n"
        "    if not tokens:\n"
        "        return\n"
        "    n = int(tokens[0])\n"
        "    k = int(tokens[1])\n"
        "    a = [int(x) for x in tokens[2:n+2]]\n"
        "    cur = sum(a[:k])\n"
        "    max_sum = cur\n"
        "    for i in range(1, n):\n"
        "        cur -= a[i - 1]\n"
        "        cur += a[(i + k - 1) % n]\n"
        "        if cur > max_sum:\n"
        "            max_sum = cur\n"
        "    print(max_sum)\n\n"
        "if __name__ == '__main__':\n"
        "    main()\n"
    ),
    "java": (
        "import java.io.*;\n"
        "import java.util.*;\n\n"
        "public class Solution18 {\n"
        "    public static void main(String[] args) throws IOException {\n"
        "        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n"
        "        String line = br.readLine();\n"
        "        if (line == null) return;\n"
        "        StringTokenizer st = new StringTokenizer(line);\n"
        "        int n = Integer.parseInt(st.nextToken());\n"
        "        int k = Integer.parseInt(st.nextToken());\n"
        "        long[] a = new long[n];\n"
        "        for (int i = 0; i < n; i++) {\n"
        "            while (!st.hasMoreTokens()) {\n"
        "                line = br.readLine();\n"
        "                if (line == null) break;\n"
        "                st = new StringTokenizer(line);\n"
        "            }\n"
        "            a[i] = Long.parseLong(st.nextToken());\n"
        "        }\n"
        "        long cur = 0;\n"
        "        for (int i = 0; i < k; i++) cur += a[i];\n"
        "        long maxSum = cur;\n"
        "        for (int i = 1; i < n; i++) {\n"
        "            cur -= a[i - 1];\n"
        "            cur += a[(i + k - 1) % n];\n"
        "            if (cur > maxSum) maxSum = cur;\n"
        "        }\n"
        "        System.out.println(maxSum);\n"
        "    }\n"
        "}\n"
    ),
    "tests": gen_tests_18()
})

# ==============================================================================
# PROBLEM 19: p19_qahramonlar_dueli
# ==============================================================================
def gen_tests_19():
    tests = []
    # 2 Samples
    tests.append(("5\n2 4 6 1 3\n", "4\n"))
    tests.append(("4\n1 2 3 4\n", "2\n"))
    # Boundaries
    tests.append(("2\n1 3\n", "1\n"))
    tests.append(("2\n1 2\n", "0\n"))
    tests.append(("5\n2 2 2 2 2\n", "10\n"))
    tests.append(("5\n1 1 1 1 1\n", "10\n"))
    # Randoms
    rnd = random.Random(4019)
    for n in [10, 50, 500, 5000, 50000, 200000]:
        for _ in range(4):
            arr = [rnd.randint(1, 10**9) for _i in range(n)]
            evens = sum(1 for x in arr if x % 2 == 0)
            odds = n - evens
            ans = evens * (evens - 1) // 2 + odds * (odds - 1) // 2
            inp = f"{n}\n" + " ".join(map(str, arr)) + "\n"
            tests.append((inp, f"{ans}\n"))
    return tests[:27]

PROBLEMS_11_20.append({
    "code": "4019",
    "slug": "p19_qahramonlar_dueli",
    "letter": "S",
    "title": "Qahramonlar juftligi",
    "statement": (
        "Qadimiy jang maydonida $N$ nafar jangchi saf tortib turibdi. $i$-jangchining jangovar quvvati $A_i$ ga teng.\n\n"
        "Jang qoidalariga ko'ra, ikkita jangchi o'rtasidagi duel faqat ularning quvvatlari ayirmasi $|A_i - A_j|$ "
        "**juft son** bo'lgandagina adolatli va teng kurashli hisoblanadi (ya'ni $(A_i - A_j) \\pmod 2 == 0$).\n\n"
        "Barcha $1 \\le i < j \\le N$ juftliklar orasida nechta adolatli duel tashkil qilish mumkinligini toping."
    ),
    "input_format": (
        "Birinchi qatorda jangchilar soni $N$ ($2 \\le N \\le 2 \\times 10^5$) kiritiladi.\n"
        "Ikkinchi qatorda $N$ ta butun son $A_1, A_2, \\dots, A_N$ ($1 \\le A_i \\le 10^9$) probel bilan kiritiladi."
    ),
    "output_format": "Adolatli duellar sonini bitta butun son sifatida chiqaring.",
    "note": "1-namunada: Juft quvvatlilar: [2, 4, 6] (3 ta juftlik: (2,4), (2,6), (4,6)). Toq quvvatlilar: [1, 3] (1 ta juftlik: (1,3)). Jami $3 + 1 = 4$ ta duel.",
    "time_limit": 1000,
    "memory_limit": 256,
    "explanation": (
        "### Masala tahlili:\n"
        "Matematik invariantga ko'ra, ikkita sonning ayirmasi $A_i - A_j$ juft bo'lishi uchun, ularning juft/toqligi (pariteti) bir xil bo'lishi shart va yetarli:\n"
        "- Juft - Juft = Juft;\n"
        "- Toq - Toq = Juft;\n"
        "- Juft - Toq = Toq.\n\n"
        "Demak, massivdagi barcha juft sonlar sonini $E$, toq sonlar sonini $O$ deb olsak, adolatli juftliklar soni:\n"
        "$$Jami = \\frac{E \\times (E - 1)}{2} + \\frac{O \\times (O - 1)}{2}$$\n\n"
        "$N = 2 \\times 10^5$ bo'lganda juftliklar soni $\\approx 2 \\times 10^{10}$ bo'ladi, shuning uchun 64-bit butun son (`long long`) ishlatiladi.\n\n"
        "**Vaqt murakkabligi:** $O(N)$.\n"
        "**Xotira murakkabligi:** $O(1)$."
    ),
    "cpp": (
        "#include <iostream>\n"
        "using namespace std;\n\n"
        "int main() {\n"
        "    ios_base::sync_with_stdio(false);\n"
        "    cin.tie(NULL);\n"
        "    int n;\n"
        "    if (cin >> n) {\n"
        "        long long even_count = 0, odd_count = 0;\n"
        "        for (int i = 0; i < n; i++) {\n"
        "            long long x;\n"
        "            cin >> x;\n"
        "            if (x % 2 == 0) even_count++;\n"
        "            else odd_count++;\n"
        "        }\n"
        "        long long ans = even_count * (even_count - 1) / 2 + odd_count * (odd_count - 1) / 2;\n"
        "        cout << ans << \"\\n\";\n"
        "    }\n"
        "    return 0;\n"
        "}\n"
    ),
    "py": (
        "import sys\n\n"
        "def main():\n"
        "    tokens = sys.stdin.read().split()\n"
        "    if not tokens:\n"
        "        return\n"
        "    n = int(tokens[0])\n"
        "    evens = 0\n"
        "    odds = 0\n"
        "    for i in range(n):\n"
        "        x = int(tokens[1 + i])\n"
        "        if x % 2 == 0:\n"
        "            evens += 1\n"
        "        else:\n"
        "            odds += 1\n"
        "    ans = evens * (evens - 1) // 2 + odds * (odds - 1) // 2\n"
        "    print(ans)\n\n"
        "if __name__ == '__main__':\n"
        "    main()\n"
    ),
    "java": (
        "import java.io.*;\n"
        "import java.util.*;\n\n"
        "public class Solution19 {\n"
        "    public static void main(String[] args) throws IOException {\n"
        "        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n"
        "        String line = br.readLine();\n"
        "        if (line == null) return;\n"
        "        StringTokenizer st = new StringTokenizer(line);\n"
        "        int n = Integer.parseInt(st.nextToken());\n"
        "        long evens = 0, odds = 0;\n"
        "        for (int i = 0; i < n; i++) {\n"
        "            while (!st.hasMoreTokens()) {\n"
        "                line = br.readLine();\n"
        "                if (line == null) break;\n"
        "                st = new StringTokenizer(line);\n"
        "            }\n"
        "            long x = Long.parseLong(st.nextToken());\n"
        "            if (x % 2 == 0) evens++;\n"
        "            else odds++;\n"
        "        }\n"
        "        long ans = evens * (evens - 1) / 2 + odds * (odds - 1) / 2;\n"
        "        System.out.println(ans);\n"
        "    }\n"
        "}\n"
    ),
    "tests": gen_tests_19()
})

# ==============================================================================
# PROBLEM 20: p20_toshlar_muvozanati
# ==============================================================================
def gen_tests_20():
    tests = []
    # 2 Samples
    tests.append(("4\n1 2 3 2\n", "YES\n"))
    tests.append(("3\n1 1 4\n", "NO\n"))
    # Boundaries
    tests.append(("2\n5 5\n", "YES\n"))
    tests.append(("2\n5 6\n", "NO\n"))
    tests.append(("3\n1 1 1\n", "NO\n"))
    tests.append(("3\n2 2 2\n", "YES\n"))
    tests.append(("2\n1000000000 1000000000\n", "YES\n"))
    # Randoms
    rnd = random.Random(4020)
    for n in [5, 20, 500, 5000, 50000, 100000]:
        for mode in ["valid", "odd_sum", "dominate"]:
            if mode == "valid":
                arr = [rnd.randint(1, 1000) for _i in range(n)]
                s = sum(arr)
                if s % 2 != 0:
                    arr[0] += 1
                mx = max(arr)
                if 2 * mx > sum(arr):
                    arr[arr.index(mx)] = sum(arr) - mx
                ans = "YES" if (sum(arr) % 2 == 0 and 2 * max(arr) <= sum(arr)) else "NO"
            elif mode == "odd_sum":
                arr = [rnd.randint(1, 1000) for _i in range(n)]
                if sum(arr) % 2 == 0:
                    arr[0] += 1
                ans = "NO"
            else:
                arr = [rnd.randint(1, 100) for _i in range(n)]
                s_others = sum(arr[1:])
                arr[0] = s_others + 10
                if sum(arr) % 2 != 0:
                    arr[1] += 1
                ans = "NO"
            inp = f"{n}\n" + " ".join(map(str, arr)) + "\n"
            tests.append((inp, f"{ans}\n"))
    return tests[:27]

PROBLEMS_11_20.append({
    "code": "4020",
    "slug": "p20_toshlar_muvozanati",
    "letter": "T",
    "title": "Sehrli toshlar muvozanati",
    "statement": (
        "Qadimgi sehrli tarozida $N$ ta tosh qo'yilgan. Toshlarning og'irliklari mos ravishda "
        "$A_1, A_2, \\dots, A_N$ ga teng.\n\n"
        "Sehrli qoidaga ko'ra, siz bir harakatda xohlagan **ikkita turli toshni** tanlab, "
        "ularning har birining og'irligini $1$ taga kamaytirishingiz mumkin (kamaytirish uchun ikkala toshning "
        "og'irligi ham kamida $1$ bo'lishi shart).\n\n"
        "Siz istalgancha harakatlar qilib, barcha $N$ ta toshning og'irligini roppa-rosa $0$ ga keltira olasizmi? "
        "Agar barcha toshlarni to'liq yo'qotish mumkin bo'lsa `YES`, aks holda `NO` chiqaring."
    ),
    "input_format": (
        "Birinchi qatorda toshlar soni $N$ ($2 \\le N \\le 10^5$) kiritiladi.\n"
        "Ikkinchi qatorda $N$ ta butun son $A_1, A_2, \\dots, A_N$ ($1 \\le A_i \\le 10^9$) probel bilan kiritiladi."
    ),
    "output_format": "Barcha toshlarni 0 ga keltirish mumkin bo'lsa `YES`, aks holda `NO` chiqaring.",
    "note": "1-namunada: Yig'indi $1+2+3+2 = 8$ juft. Eng katta tosh 3, qolganlar yig'indisi 5. $3 \\le 5$. To'liq 0 qilish mumkin (`YES`).",
    "time_limit": 1000,
    "memory_limit": 256,
    "explanation": (
        "### Masala tahlili:\n"
        "Ushbu masala to'plamlar nazariyasi va grafik invariantlariga asoslanadi.\n\n"
        "Har bir amalda ikkita toshdan 1 dan olinadi, ya'ni umumiy yig'indi $S = \\sum_{i=1}^N A_i$ aynan 2 ga kamayadi.\n"
        "Shu sababli quyidagi ikki shart bajarilishi **zarur va yetarli**:\n"
        "1. Umumiy yig'indi $S$ juft son bo'lishi kerak ($S \\pmod 2 == 0$);\n"
        "2. Eng og'ir tosh $M = \\max(A_1, \\dots, A_N)$ qolgan barcha toshlar yig'indisidan oshib ketmasligi kerak, ya'ni $2 \\times M \\le S$.\n\n"
        "Agar har ikki shart bajarilsa javob `YES`, aks holda `NO`.\n\n"
        "Umumiy yig'indi $10^5 \\times 10^9 = 10^{14}$ gacha borishi mumkinligi sababli 64-bitli arifmetika (`long long`) ishlatiladi.\n\n"
        "**Vaqt murakkabligi:** $O(N)$.\n"
        "**Xotira murakkabligi:** $O(1)$."
    ),
    "cpp": (
        "#include <iostream>\n"
        "#include <algorithm>\n"
        "using namespace std;\n\n"
        "int main() {\n"
        "    ios_base::sync_with_stdio(false);\n"
        "    cin.tie(NULL);\n"
        "    int n;\n"
        "    if (cin >> n) {\n"
        "        long long sum = 0;\n"
        "        long long max_val = 0;\n"
        "        for (int i = 0; i < n; i++) {\n"
        "            long long x;\n"
        "            cin >> x;\n"
        "            sum += x;\n"
        "            if (x > max_val) max_val = x;\n"
        "        }\n"
        "        if (sum % 2 == 0 && 2 * max_val <= sum) {\n"
        "            cout << \"YES\\n\";\n"
        "        } else {\n"
        "            cout << \"NO\\n\";\n"
        "        }\n"
        "    }\n"
        "    return 0;\n"
        "}\n"
    ),
    "py": (
        "import sys\n\n"
        "def main():\n"
        "    tokens = sys.stdin.read().split()\n"
        "    if not tokens:\n"
        "        return\n"
        "    n = int(tokens[0])\n"
        "    a = [int(x) for x in tokens[1:n+1]]\n"
        "    s = sum(a)\n"
        "    mx = max(a)\n"
        "    if s % 2 == 0 and 2 * mx <= s:\n"
        "        print(\"YES\")\n"
        "    else:\n"
        "        print(\"NO\")\n\n"
        "if __name__ == '__main__':\n"
        "    main()\n"
    ),
    "java": (
        "import java.io.*;\n"
        "import java.util.*;\n\n"
        "public class Solution20 {\n"
        "    public static void main(String[] args) throws IOException {\n"
        "        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n"
        "        String line = br.readLine();\n"
        "        if (line == null) return;\n"
        "        StringTokenizer st = new StringTokenizer(line);\n"
        "        int n = Integer.parseInt(st.nextToken());\n"
        "        long sum = 0;\n"
        "        long maxVal = 0;\n"
        "        for (int i = 0; i < n; i++) {\n"
        "            while (!st.hasMoreTokens()) {\n"
        "                line = br.readLine();\n"
        "                if (line == null) break;\n"
        "                st = new StringTokenizer(line);\n"
        "            }\n"
        "            long x = Long.parseLong(st.nextToken());\n"
        "            sum += x;\n"
        "            if (x > maxVal) maxVal = x;\n"
        "        }\n"
        "        if (sum % 2 == 0 && 2 * maxVal <= sum) {\n"
        "            System.out.println(\"YES\");\n"
        "        } else {\n"
        "            System.out.println(\"NO\");\n"
        "        }\n"
        "    }\n"
        "}\n"
    ),
    "tests": gen_tests_20()
})
