# -*- coding: utf-8 -*-
"""
Contest 20: Problems 01 to 10 definitions, test generators, solutions, and explanations.
"""
import random

PROBLEMS_1_10 = []

# ==============================================================================
# PROBLEM 01: p01_sehrli_qozon
# ==============================================================================
def gen_tests_01():
    tests = []
    # 2 Samples
    tests.append(("14 4\n", "2\n"))
    tests.append(("100 10\n", "0\n"))
    # Boundaries
    tests.append(("1 1\n", "0\n"))
    tests.append(("1 2\n", "1\n"))
    tests.append(("1000000000000000000 1\n", "0\n"))
    tests.append(("1000000000000000000 1000000000\n", "0\n"))
    tests.append(("999999999999999999 1000000000\n", "999999999\n"))
    tests.append(("1000000000000000000 3\n", "1\n"))
    tests.append(("1000000000000000000 7\n", "1\n"))
    # Randoms
    rnd = random.Random(4001)
    for _ in range(18):
        n = rnd.randint(1, 10**18)
        k = rnd.randint(1, 10**9)
        tests.append((f"{n} {k}\n", f"{n % k}\n"))
    return tests

PROBLEMS_1_10.append({
    "code": "4001",
    "slug": "p01_sehrli_qozon",
    "letter": "A",
    "title": "Sehrli qozon",
    "statement": (
        "Sehrgar Qorabay qadimiy qasrda sehrli qaynatma tayyorlamoqda. Har bir marosim uchun u katta "
        "cho'yan qozonga $N$ tomchi sehrli sharbat quyadi. So'ngra sehrli tayoqchasini silkitib, sharbatni "
        "har biri roppa-rosa $K$ tomchidan sig'adigan billur idishlarga to'liq taqsimlaydi.\n\n"
        "Barcha to'liq idishlar to'ldirib olingach, qozon tubida qolib ketgan, yangi idish to'ldirishga "
        "yetmaydigan tomchilar sehr kuchini yo'qotadi. Sehrgar qozon tubida qoladigan ortiqcha tomchilar "
        "sonini oldindan bilishi zarur. Unga yordam bering."
    ),
    "input_format": "Bitta qatorda ikkita butun son $N$ va $K$ ($1 \\le N \\le 10^{18}$, $1 \\le K \\le 10^9$) kiritiladi.",
    "output_format": "Qozon tubida qolgan tomchilar sonini bitta butun son sifatida chiqaring.",
    "note": "1-namunada: 14 tomchi 4 tadan taqsimlansa, 3 ta to'liq idish olinadi va qozon tubida 2 tomchi qoladi ($14 \\pmod 4 = 2$).",
    "time_limit": 1000,
    "memory_limit": 256,
    "explanation": (
        "### Masala tahlili:\n"
        "Ushbu masalada $N$ tomchi sharbat $K$ tadan taqsimlanganda ortib qoladigan qoldiqni topish talab etiladi.\n\n"
        "Matematik jihatdan javob $N \\pmod K$ amali orqali hisoblanadi.\n\n"
        "**Muhim jihat:** $N$ soni $10^{18}$ gacha bo'lishi mumkinligi sababli, 32-bitli butun son chegarasidan oshib ketadi. "
        "Shu bois C++ da `long long`, Java da `long`, Python da esa odatiy butun son turidan foydalanish lozim.\n\n"
        "**Vaqt murakkabligi:** $O(1)$.\n"
        "**Xotira murakkabligi:** $O(1)$."
    ),
    "cpp": (
        "#include <iostream>\n"
        "using namespace std;\n\n"
        "int main() {\n"
        "    ios_base::sync_with_stdio(false);\n"
        "    cin.tie(NULL);\n"
        "    long long n, k;\n"
        "    if (cin >> n >> k) {\n"
        "        cout << (n % k) << \"\\n\";\n"
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
        "    print(n % k)\n\n"
        "if __name__ == '__main__':\n"
        "    main()\n"
    ),
    "java": (
        "import java.util.Scanner;\n\n"
        "public class Solution01 {\n"
        "    public static void main(String[] args) {\n"
        "        Scanner in = new Scanner(System.in);\n"
        "        if (in.hasNextLong()) {\n"
        "            long n = in.nextLong();\n"
        "            long k = in.nextLong();\n"
        "            System.out.println(n % k);\n"
        "        }\n"
        "    }\n"
        "}\n"
    ),
    "tests": gen_tests_01()
})

# ==============================================================================
# PROBLEM 02: p02_mayoq_chiroqlari
# ==============================================================================
def gen_tests_02():
    tests = []
    # 2 Samples
    tests.append(("5 15 3\n", "4\n"))
    tests.append(("10 20 25\n", "0\n"))
    # Boundaries
    tests.append(("1 1 1\n", "1\n"))
    tests.append(("1 100 101\n", "0\n"))
    tests.append(("1 1000000000000000000 1\n", "1000000000000000000\n"))
    tests.append(("1000000000000000000 1000000000000000000 1000000000\n", "1\n"))
    tests.append(("999999999999999999 1000000000000000000 1000000000\n", "1\n"))
    tests.append(("1 1000000000000000000 1000000000\n", "1000000000\n"))
    # Randoms
    rnd = random.Random(4002)
    for _ in range(20):
        x = rnd.randint(1, 10**18)
        y = rnd.randint(x, 10**18)
        d = rnd.randint(1, 10**9)
        ans = (y // d) - ((x - 1) // d)
        tests.append((f"{x} {y} {d}\n", f"{ans}\n"))
    return tests

PROBLEMS_1_10.append({
    "code": "4002",
    "slug": "p02_mayoq_chiroqlari",
    "letter": "B",
    "title": "Mayoq chiroqlari",
    "statement": (
        "Tungi okean sohilidagi qadimiy mayoq dengizchilarga yo'l ko'rsatish maqsadida har $D$ soniyada "
        "bir marta qisqa, ammo o'ta yorqin nur sochadi (ya'ni $D, 2D, 3D, 4D, \\dots$ soniyalarda).\n\n"
        "Kema kapitani dengiz xaritasini o'rganayotib, vaqt hisoblagichining $X$-soniyasidan $Y$-soniyasigacha "
        "bo'lgan vaqt oralig'ida (ikkala soniya ham hisobga olinadi) mayoqni kuzatdi. Kapitan ushbu oraliqda "
        "mayoq nuri necha marta porlaganini ko'rganini aniqlang."
    ),
    "input_format": "Bitta qatorda uchta butun son $X, Y, D$ ($1 \\le X \\le Y \\le 10^{18}$, $1 \\le D \\le 10^9$) kiritiladi.",
    "output_format": "Kuzatuv oralig'ida mayoq necha marta porlaganini bildiruvchi bitta butun sonni chiqaring.",
    "note": "1-namunada: $[5, 15]$ oralig'ida 3 ga karrali soniyalar: 6, 9, 12, 15. Jami 4 marta.",
    "time_limit": 1000,
    "memory_limit": 256,
    "explanation": (
        "### Masala tahlili:\n"
        "Oraliq $[X, Y]$ da $D$ ga qoldiqsiz bo'linuvchi sonlar sonini topish kerak.\n\n"
        "1 dan $Y$ gacha bo'lgan sonlar orasida $D$ ga karralilar soni: $\\lfloor Y / D \\rfloor$.\n"
        "1 dan $X - 1$ gacha bo'lgan sonlar orasida $D$ ga karralilar soni: $\\lfloor (X - 1) / D \\rfloor$.\n\n"
        "Demak, oraliqdagi mayoq chaqnashlari soni: $\\lfloor Y / D \\rfloor - \\lfloor (X - 1) / D \\rfloor$.\n"
        "Sikl (loop) ishlatish $Y \\le 10^{18}$ da Time Limit Exceeded keltirib chiqaradi, shuning uchun $O(1)$ formula shart.\n\n"
        "**Vaqt murakkabligi:** $O(1)$.\n"
        "**Xotira murakkabligi:** $O(1)$."
    ),
    "cpp": (
        "#include <iostream>\n"
        "using namespace std;\n\n"
        "int main() {\n"
        "    ios_base::sync_with_stdio(false);\n"
        "    cin.tie(NULL);\n"
        "    long long x, y, d;\n"
        "    if (cin >> x >> y >> d) {\n"
        "        long long ans = (y / d) - ((x - 1) / d);\n"
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
        "    x = int(tokens[0])\n"
        "    y = int(tokens[1])\n"
        "    d = int(tokens[2])\n"
        "    print((y // d) - ((x - 1) // d))\n\n"
        "if __name__ == '__main__':\n"
        "    main()\n"
    ),
    "java": (
        "import java.util.Scanner;\n\n"
        "public class Solution02 {\n"
        "    public static void main(String[] args) {\n"
        "        Scanner in = new Scanner(System.in);\n"
        "        if (in.hasNextLong()) {\n"
        "            long x = in.nextLong();\n"
        "            long y = in.nextLong();\n"
        "            long d = in.nextLong();\n"
        "            long ans = (y / d) - ((x - 1) / d);\n"
        "            System.out.println(ans);\n"
        "        }\n"
        "    }\n"
        "}\n"
    ),
    "tests": gen_tests_02()
})

# ==============================================================================
# PROBLEM 03: p03_qadimgi_hovuz
# ==============================================================================
def gen_tests_03():
    tests = []
    # 2 Samples
    tests.append(("15 10\n", "INCREASE\n"))
    tests.append(("7 7\n", "STABLE\n"))
    # Boundaries
    tests.append(("10 15\n", "DECREASE\n"))
    tests.append(("1 1\n", "STABLE\n"))
    tests.append(("1 1000000000\n", "DECREASE\n"))
    tests.append(("1000000000 1\n", "INCREASE\n"))
    tests.append(("1000000000 1000000000\n", "STABLE\n"))
    # Randoms
    rnd = random.Random(4003)
    for _ in range(21):
        mode = rnd.choice(["inc", "dec", "eq"])
        if mode == "eq":
            v = rnd.randint(1, 10**9)
            a, b = v, v
        elif mode == "inc":
            b = rnd.randint(1, 10**9 - 1)
            a = rnd.randint(b + 1, 10**9)
        else:
            a = rnd.randint(1, 10**9 - 1)
            b = rnd.randint(a + 1, 10**9)
        ans = "INCREASE" if a > b else ("DECREASE" if a < b else "STABLE")
        tests.append((f"{a} {b}\n", f"{ans}\n"))
    return tests

PROBLEMS_1_10.append({
    "code": "4003",
    "slug": "p03_qadimgi_hovuz",
    "letter": "C",
    "title": "Qadimgi hovuz darajasi",
    "statement": (
        "Xon saroyidagi go'zal bog'da qadimiy marmar hovuz joylashgan. Tog' bulog'idan ochilgan "
        "ariq orqali har daqiqada hovuzga $A$ litr zilol suv oqib kiradi. Shu bilan birga, bog'dagi "
        "gulzorlarni sug'orish uchun hovuz tubidagi maxsus jo'mrakdan har daqiqada $B$ litr suv sarflanadi.\n\n"
        "Bog'bon uzoq vaqt davomida hovuzdagi suv sathi qanday o'zgarishini aniqlashi lozim. "
        "Agar suv sathi ko'tarilib borsa `INCREASE`, pasayib borsa `DECREASE`, o'zgarishsiz qolsa `STABLE` so'zini chiqaring."
    ),
    "input_format": "Bitta qatorda ikkita butun son $A$ va $B$ ($1 \\le A, B \\le 10^9$) kiritiladi.",
    "output_format": "Suv sathining o'zgarishiga qarab `INCREASE`, `DECREASE` yoki `STABLE` so'zini chiqaring.",
    "note": "1-namunada: Har daqiqada 15 litr kirib, 10 litr chiqadi ($15 > 10$). Suv sathi ko'tariladi (`INCREASE`).",
    "time_limit": 1000,
    "memory_limit": 256,
    "explanation": (
        "### Masala tahlili:\n"
        "Har daqiqada hovuzga kiruvchi suv miqdori $A$, chiquvchi miqdor esa $B$.\n"
        "- Agar $A > B$ bo'lsa, har daqiqada $A - B > 0$ litr suv qo'shiladi va sath ko'tariladi (`INCREASE`).\n"
        "- Agar $A < B$ bo'lsa, har daqiqada suv kamayib boradi (`DECREASE`).\n"
        "- Agar $A = B$ bo'lsa, kiruvchi va chiquvchi suv teng bo'lib, sath o'zgarmaydi (`STABLE`).\n\n"
        "Oddiy `if-else` shart tekshiruvi yetarlidir.\n\n"
        "**Vaqt murakkabligi:** $O(1)$.\n"
        "**Xotira murakkabligi:** $O(1)$."
    ),
    "cpp": (
        "#include <iostream>\n"
        "using namespace std;\n\n"
        "int main() {\n"
        "    ios_base::sync_with_stdio(false);\n"
        "    cin.tie(NULL);\n"
        "    long long a, b;\n"
        "    if (cin >> a >> b) {\n"
        "        if (a > b) cout << \"INCREASE\\n\";\n"
        "        else if (a < b) cout << \"DECREASE\\n\";\n"
        "        else cout << \"STABLE\\n\";\n"
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
        "    a = int(tokens[0])\n"
        "    b = int(tokens[1])\n"
        "    if a > b:\n"
        "        print(\"INCREASE\")\n"
        "    elif a < b:\n"
        "        print(\"DECREASE\")\n"
        "    else:\n"
        "        print(\"STABLE\")\n\n"
        "if __name__ == '__main__':\n"
        "    main()\n"
    ),
    "java": (
        "import java.util.Scanner;\n\n"
        "public class Solution03 {\n"
        "    public static void main(String[] args) {\n"
        "        Scanner in = new Scanner(System.in);\n"
        "        if (in.hasNextLong()) {\n"
        "            long a = in.nextLong();\n"
        "            long b = in.nextLong();\n"
        "            if (a > b) System.out.println(\"INCREASE\");\n"
        "            else if (a < b) System.out.println(\"DECREASE\");\n"
        "            else System.out.println(\"STABLE\");\n"
        "        }\n"
        "    }\n"
        "}\n"
    ),
    "tests": gen_tests_03()
})

# ==============================================================================
# PROBLEM 04: p04_ormonchi_golalari
# ==============================================================================
def gen_tests_04():
    tests = []
    # 2 Samples
    tests.append(("3 10 3\n", "9 ODD\n"))
    tests.append(("4 15 5\n", "12 EVEN\n"))
    # Boundaries
    tests.append(("1 1 1\n", "1 EVEN\n"))
    tests.append(("1000000 1000000000 1000000000\n", "1000000 EVEN\n"))
    tests.append(("1000000 1000000000 3\n", f"{1000000 * (10**9 // 3)} {'EVEN' if (1000000 * (10**9 % 3)) % 2 == 0 else 'ODD'}\n"))
    tests.append(("1 10 7\n", "1 ODD\n"))
    tests.append(("2 10 7\n", "2 EVEN\n"))
    # Randoms
    rnd = random.Random(4004)
    for _ in range(21):
        n = rnd.randint(1, 10**6)
        k = rnd.randint(1, 10**6)
        l = rnd.randint(k, 10**9)
        pieces = n * (l // k)
        waste = n * (l % k)
        parity = "EVEN" if waste % 2 == 0 else "ODD"
        tests.append((f"{n} {l} {k}\n", f"{pieces} {parity}\n"))
    return tests

PROBLEMS_1_10.append({
    "code": "4004",
    "slug": "p04_ormonchi_golalari",
    "letter": "D",
    "title": "O'rmonchi g'olalari",
    "statement": (
        "O'rmonchi Bobur ustaxonasiga har birining uzunligi $L$ metr bo'lgan $N$ ta bir xil qarag'ay "
        "g'olasi olib kelindi. Har bir g'oladan uzunligi aniq $K$ metr bo'lgan qurilish xodalari arralab olinadi. "
        "Har bir g'oladan qolgan qoldiq qism esa yoqilg'i uchun ajratiladi (birlashtirib xoda qilib bo'lmaydi).\n\n"
        "O'rmonchi jami nechta to'liq $K$ metrlik xoda tayyorlay olishini va barcha $N$ ta g'oladan "
        "ortib qolgan umumiy isrof yog'och uzunligi juft yoki toq ekanligini bilmoqchi."
    ),
    "input_format": "Bitta qatorda uchta butun son $N, L, K$ ($1 \\le N \\le 10^6$, $1 \\le K \\le L \\le 10^9$) kiritiladi.",
    "output_format": (
        "Bitta qatorda probel bilan ajratilgan holda: jami tayyorlangan xodalar soni hamda "
        "isrof yog'och uzunligining juft/toqligiga qarab `EVEN` yoki `ODD` so'zini chiqaring."
    ),
    "note": "1-namunada: Har bir g'oladan $\\lfloor 10/3 \\rfloor = 3$ ta xoda olinadi. $3 \\times 3 = 9$ ta. Qoldiq $3 \\times 1 = 3$ metr (toq -> ODD).",
    "time_limit": 1000,
    "memory_limit": 256,
    "explanation": (
        "### Masala tahlili:\n"
        "Har bir g'oladan $\\lfloor L / K \\rfloor$ ta xoda olinadi, demak $N$ ta g'oladan jami $N \\times \\lfloor L / K \\rfloor$ dona xoda tayyorlanadi.\n\n"
        "Har bir g'oladan $L \\pmod K$ metr yog'och isrof bo'ladi. Jami isrof uzunligi: $W = N \\times (L \\pmod K)$.\n"
        "Agar $W \\pmod 2 == 0$ bo'lsa `EVEN`, aks holda `ODD` chiqariladi.\n\n"
        "**Eslatma:** $N \\times \\lfloor L / K \\rfloor$ qiymati $10^{15}$ ga yetishi mumkin, shu sababli 64-bit butun son (`long long`) ishlatiladi.\n\n"
        "**Vaqt murakkabligi:** $O(1)$.\n"
        "**Xotira murakkabligi:** $O(1)$."
    ),
    "cpp": (
        "#include <iostream>\n"
        "using namespace std;\n\n"
        "int main() {\n"
        "    ios_base::sync_with_stdio(false);\n"
        "    cin.tie(NULL);\n"
        "    long long n, l, k;\n"
        "    if (cin >> n >> l >> k) {\n"
        "        long long pieces = n * (l / k);\n"
        "        long long waste = n * (l % k);\n"
        "        cout << pieces << \" \" << (waste % 2 == 0 ? \"EVEN\" : \"ODD\") << \"\\n\";\n"
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
        "    n, l, k = map(int, tokens[:3])\n"
        "    pieces = n * (l // k)\n"
        "    waste = n * (l % k)\n"
        "    parity = \"EVEN\" if waste % 2 == 0 else \"ODD\"\n"
        "    print(f\"{pieces} {parity}\")\n\n"
        "if __name__ == '__main__':\n"
        "    main()\n"
    ),
    "java": (
        "import java.util.Scanner;\n\n"
        "public class Solution04 {\n"
        "    public static void main(String[] args) {\n"
        "        Scanner in = new Scanner(System.in);\n"
        "        if (in.hasNextLong()) {\n"
        "            long n = in.nextLong();\n"
        "            long l = in.nextLong();\n"
        "            long k = in.nextLong();\n"
        "            long pieces = n * (l / k);\n"
        "            long waste = n * (l % k);\n"
        "            System.out.println(pieces + \" \" + (waste % 2 == 0 ? \"EVEN\" : \"ODD\"));\n"
        "        }\n"
        "    }\n"
        "}\n"
    ),
    "tests": gen_tests_04()
})

# ==============================================================================
# PROBLEM 05: p05_sayyoh_chiptasi
# ==============================================================================
def gen_tests_05():
    tests = []
    # 2 Samples
    tests.append(("4 2000 7000\n", "7000\n"))
    tests.append(("3 1500 6000\n", "4500\n"))
    # Boundaries
    tests.append(("1 1 1\n", "1\n"))
    tests.append(("1000000 1000000000 1000000000\n", "1000000000\n"))
    tests.append(("1000000 1 1000000000\n", "1000000\n"))
    tests.append(("5 100 500\n", "500\n"))
    # Randoms
    rnd = random.Random(4005)
    for _ in range(22):
        k = rnd.randint(1, 10**6)
        a = rnd.randint(1, 10**9)
        b = rnd.randint(1, 10**15)
        ans = min(k * a, b)
        tests.append((f"{k} {a} {b}\n", f"{ans}\n"))
    return tests

PROBLEMS_1_10.append({
    "code": "4005",
    "slug": "p05_sayyoh_chiptasi",
    "letter": "E",
    "title": "Sayyoh chiptasi",
    "statement": (
        "Qadimiy Samarqand shahriga tashrif buyurgan sayyoh $K$ ta tarixiy obidani ziyorat qilmoqchi. "
        "Sayyohlik markazida obidalarga kirish uchun ikki xil to'lov usuli mavjud:\n"
        "1. Har bir obidaga alohida $A$ so'm to'lab, bittalik chipta xarid qilish;\n"
        "2. Shaharning barcha obidalariga cheksiz kirish imkonini beruvchi yagona oltin kartani $B$ so'mga sotib olish.\n\n"
        "Sayyoh barcha $K$ ta obidani tomosha qilishi uchun sarflaydigan eng kam mablag' miqdorini aniqlang."
    ),
    "input_format": "Bitta qatorda uchta butun son $K, A, B$ ($1 \\le K \\le 10^6$, $1 \\le A, B \\le 10^9$ yoki $B \\le 10^{15}$) kiritiladi.",
    "output_format": "Barcha $K$ ta obidaga kirish uchun minimal xarajat miqdorini bitta butun son sifatida chiqaring.",
    "note": "1-namunada: Alohida chiptalar narxi $4 \\times 2000 = 8000$ so'm. Oltin karta narxi 7000 so'm. Kamrog'i 7000 so'm.",
    "time_limit": 1000,
    "memory_limit": 256,
    "explanation": (
        "### Masala tahlili:\n"
        "Sayyoh oldida ikki tanlov bor:\n"
        "- Har bir obidaga alohida chipta sotib olganda jami xarajat: $K \\times A$.\n"
        "- Yagona oltin karta sotib olganda xarajat: $B$.\n\n"
        "Minimal xarajat: $\\min(K \\times A, B)$.\n"
        "$K \\times A$ qiymati $10^{15}$ gacha borishi mumkinligi sababli 64-bitli arifmetikadan foydalanish zarur.\n\n"
        "**Vaqt murakkabligi:** $O(1)$.\n"
        "**Xotira murakkabligi:** $O(1)$."
    ),
    "cpp": (
        "#include <iostream>\n"
        "#include <algorithm>\n"
        "using namespace std;\n\n"
        "int main() {\n"
        "    ios_base::sync_with_stdio(false);\n"
        "    cin.tie(NULL);\n"
        "    long long k, a, b;\n"
        "    if (cin >> k >> a >> b) {\n"
        "        long long cost1 = k * a;\n"
        "        cout << min(cost1, b) << \"\\n\";\n"
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
        "    k, a, b = map(int, tokens[:3])\n"
        "    print(min(k * a, b))\n\n"
        "if __name__ == '__main__':\n"
        "    main()\n"
    ),
    "java": (
        "import java.util.Scanner;\n\n"
        "public class Solution05 {\n"
        "    public static void main(String[] args) {\n"
        "        Scanner in = new Scanner(System.in);\n"
        "        if (in.hasNextLong()) {\n"
        "            long k = in.nextLong();\n"
        "            long a = in.nextLong();\n"
        "            long b = in.nextLong();\n"
        "            long cost1 = k * a;\n"
        "            System.out.println(Math.min(cost1, b));\n"
        "        }\n"
        "    }\n"
        "}\n"
    ),
    "tests": gen_tests_05()
})

# ==============================================================================
# PROBLEM 06: p06_parollar_balansi
# ==============================================================================
def gen_tests_06():
    tests = []
    # 2 Samples
    tests.append(("Aeropora\n", "OPEN\n"))
    tests.append(("Codeforces\n", "LOCKED\n"))
    # Boundaries
    tests.append(("a\n", "OPEN\n"))
    tests.append(("b\n", "LOCKED\n"))
    tests.append(("aeiou\n", "OPEN\n"))
    tests.append(("bcdfgh\n", "LOCKED\n"))
    tests.append(("aeiouBCDFG\n", "LOCKED\n"))
    # Randoms
    rnd = random.Random(4006)
    vowels = "aeiouAEIOU"
    consonants = "bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ"
    for length in [10, 50, 500, 2000, 50000, 100000]:
        for _ in range(3):
            s_chars = []
            for _c in range(length):
                if rnd.random() < 0.5:
                    s_chars.append(rnd.choice(vowels))
                else:
                    s_chars.append(rnd.choice(consonants))
            s = "".join(s_chars)
            v_cnt = sum(1 for ch in s if ch.lower() in "aeiou")
            c_cnt = len(s) - v_cnt
            ans = "OPEN" if v_cnt > c_cnt else "LOCKED"
            tests.append((f"{s}\n", f"{ans}\n"))
    return tests[:28]

PROBLEMS_1_10.append({
    "code": "4006",
    "slug": "p06_parollar_balansi",
    "letter": "F",
    "title": "Parollar balansi",
    "statement": (
        "Sehrli xazina darvozasi qulfida qadimiy lotin yozuvidan iborat $S$ kalit so'zi o'yib yozilgan. "
        "Afsonaga ko'ra, darvoza faqatgina yozuvdagi unli tovushlar soni undosh tovushlar sonidan qat'iy ko'p "
        "bo'lgandagina o'z-o'zidan ochiladi. Aks holda u mustahkam qulflanadi.\n\n"
        "Lotin alifbosidagi unli harflar: `a`, `e`, `i`, `o`, `u` (katta-kichik harflar bir xil hisoblanadi). "
        "Boshqa barcha lotin harflari undosh hisoblanadi.\n\n"
        "Darvoza ochilsa `OPEN`, ochilmasa `LOCKED` so'zini chiqaring."
    ),
    "input_format": "Bitta qatorda bo'sh bo'lmagan, faqat lotin harflaridan iborat $S$ ($1 \\le |S| \\le 10^5$) satri kiritiladi.",
    "output_format": "Darvoza holatiga qarab `OPEN` yoki `LOCKED` so'zini chiqaring.",
    "note": "1-namunada: `Aeropora` so'zida 5 ta unli (A, e, o, o, a) va 3 ta undosh (r, p, r) bor. $5 > 3$, demak darvoza ochiladi (`OPEN`).",
    "time_limit": 1000,
    "memory_limit": 256,
    "explanation": (
        "### Masala tahlili:\n"
        "Satrdagi harflarni birma-bir ko'rib chiqib, unli (`a, e, i, o, u`, registrga bog'liq bo'lmagan) harflar sonini $V$ "
        "va undosh harflar sonini $C$ deb hisoblaymiz.\n\n"
        "Agar $V > C$ bo'lsa `OPEN`, aks holda `LOCKED` chiqaramiz.\n\n"
        "**Vaqt murakkabligi:** $O(|S|)$.\n"
        "**Xotira murakkabligi:** $O(1)$ qo'shimcha xotira."
    ),
    "cpp": (
        "#include <iostream>\n"
        "#include <string>\n"
        "#include <cctype>\n"
        "using namespace std;\n\n"
        "int main() {\n"
        "    ios_base::sync_with_stdio(false);\n"
        "    cin.tie(NULL);\n"
        "    string s;\n"
        "    if (cin >> s) {\n"
        "        int v = 0, c = 0;\n"
        "        for (char ch : s) {\n"
        "            char lower = tolower((unsigned char)ch);\n"
        "            if (lower == 'a' || lower == 'e' || lower == 'i' || lower == 'o' || lower == 'u') {\n"
        "                v++;\n"
        "            } else if (isalpha((unsigned char)ch)) {\n"
        "                c++;\n"
        "            }\n"
        "        }\n"
        "        if (v > c) cout << \"OPEN\\n\";\n"
        "        else cout << \"LOCKED\\n\";\n"
        "    }\n"
        "    return 0;\n"
        "}\n"
    ),
    "py": (
        "import sys\n\n"
        "def main():\n"
        "    s = sys.stdin.read().strip()\n"
        "    if not s:\n"
        "        return\n"
        "    vowels = set(\"aeiouAEIOU\")\n"
        "    v = sum(1 for ch in s if ch in vowels)\n"
        "    c = sum(1 for ch in s if ch.isalpha() and ch not in vowels)\n"
        "    print(\"OPEN\" if v > c else \"LOCKED\")\n\n"
        "if __name__ == '__main__':\n"
        "    main()\n"
    ),
    "java": (
        "import java.util.Scanner;\n\n"
        "public class Solution06 {\n"
        "    public static void main(String[] args) {\n"
        "        Scanner in = new Scanner(System.in);\n"
        "        if (in.hasNext()) {\n"
        "            String s = in.next();\n"
        "            int v = 0, c = 0;\n"
        "            for (int i = 0; i < s.length(); i++) {\n"
        "                char ch = Character.toLowerCase(s.charAt(i));\n"
        "                if (ch == 'a' || ch == 'e' || ch == 'i' || ch == 'o' || ch == 'u') {\n"
        "                    v++;\n"
        "                } else if (Character.isLetter(ch)) {\n"
        "                    c++;\n"
        "                }\n"
        "            }\n"
        "            System.out.println(v > c ? \"OPEN\" : \"LOCKED\");\n"
        "        }\n"
        "    }\n"
        "}\n"
    ),
    "tests": gen_tests_06()
})

# ==============================================================================
# PROBLEM 07: p07_oltin_qum_roboti
# ==============================================================================
def gen_tests_07():
    tests = []
    # 2 Samples
    tests.append(("6\n3 1 5 4 8 2\n", "3 16\n"))
    tests.append(("4\n10 20 30 40\n", "4 100\n"))
    # Boundaries
    tests.append(("1\n5\n", "1 5\n"))
    tests.append(("5\n10 9 8 7 6\n", "1 10\n"))
    tests.append(("5\n5 5 5 5 5\n", "1 5\n"))
    # Randoms
    rnd = random.Random(4007)
    for n in [10, 50, 1000, 10000, 100000]:
        for _ in range(4):
            arr = [rnd.randint(1, 10**9) for _i in range(n)]
            last = arr[0]
            cnt = 1
            s = arr[0]
            for x in arr[1:]:
                if x > last:
                    last = x
                    cnt += 1
                    s += x
            inp = f"{n}\n" + " ".join(map(str, arr)) + "\n"
            tests.append((inp, f"{cnt} {s}\n"))
    return tests[:27]

PROBLEMS_1_10.append({
    "code": "4007",
    "slug": "p07_oltin_qum_roboti",
    "letter": "G",
    "title": "Oltin qum roboti",
    "statement": (
        "Cho'ldagi arxeologik ekspeditsiyada avtomatlashtirilgan robot yo'l bo'ylab $N$ ta chuqurchaga "
        "duch keladi. $i$-chuqurchada og'irligi $A_i$ bo'lgan oltin qum xaltachasi yotibdi.\n\n"
        "Robot quvvatni tejash uchun quyidagi qat'iy qoida bilan harakatlanadi:\n"
        "- Dastlab birinchi chuqurchadagi xaltachani ($A_1$) oladi;\n"
        "- So'ngra o'ng tomonga qarab yuradi va o'zi oxirgi olgan xaltachasidan **qat'iy og'irroq** "
        "xaltachaga duch kelgandagina uni oladi va o'sha yangi og'irlikni o'zi uchun yangi mezon qilib belgilaydi.\n\n"
        "Robot yo'l oxiriga yetganda jami nechta xaltacha yig'ishini va ularning umumiy vazni qancha bo'lishini toping."
    ),
    "input_format": (
        "Birinchi qatorda butun son $N$ ($1 \\le N \\le 10^5$) kiritiladi.\n"
        "Ikkinchi qatorda $N$ ta butun son $A_1, A_2, \\dots, A_N$ ($1 \\le A_i \\le 10^9$) probel bilan kiritiladi."
    ),
    "output_format": "Bitta qatorda robot to'plagan xaltachalar soni va ularning umumiy og'irligini probel bilan ajratib chiqaring.",
    "note": "1-namunada: Robot 3 ni oladi. Keyin 1 (kichik), 5 (oladi), 4 (kichik), 8 (oladi), 2 (kichik). Olinganlar: 3, 5, 8. Jami 3 ta, vazni: $3+5+8=16$.",
    "time_limit": 1000,
    "memory_limit": 256,
    "explanation": (
        "### Masala tahlili:\n"
        "Massiv boshidan oxirigacha bitta sikl bilan ko'rib chiqiladi:\n"
        "- Dastlab `last = A[0]`, `cnt = 1`, `sum = A[0]`.\n"
        "- Har bir $i = 1 \\dots N-1$ element uchun: agar $A_i > last$ bo'lsa, `last = A[i]`, `cnt++`, `sum += A[i]`.\n\n"
        "Umumiy yig'indi $10^5 \\times 10^9 = 10^{14}$ gacha yetishi mumkin, shu bois 64-bit butun son ishlatiladi.\n\n"
        "**Vaqt murakkabligi:** $O(N)$.\n"
        "**Xotira murakkabligi:** $O(1)$ yoki $O(N)$."
    ),
    "cpp": (
        "#include <iostream>\n"
        "#include <vector>\n"
        "using namespace std;\n\n"
        "int main() {\n"
        "    ios_base::sync_with_stdio(false);\n"
        "    cin.tie(NULL);\n"
        "    int n;\n"
        "    if (cin >> n && n > 0) {\n"
        "        long long first_val;\n"
        "        cin >> first_val;\n"
        "        long long last = first_val;\n"
        "        long long sum = first_val;\n"
        "        long long cnt = 1;\n"
        "        for (int i = 1; i < n; i++) {\n"
        "            long long val;\n"
        "            cin >> val;\n"
        "            if (val > last) {\n"
        "                last = val;\n"
        "                sum += val;\n"
        "                cnt++;\n"
        "            }\n"
        "        }\n"
        "        cout << cnt << \" \" << sum << \"\\n\";\n"
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
        "    if n == 0:\n"
        "        return\n"
        "    a = [int(x) for x in tokens[1:n+1]]\n"
        "    last = a[0]\n"
        "    cnt = 1\n"
        "    s = a[0]\n"
        "    for x in a[1:]:\n"
        "        if x > last:\n"
        "            last = x\n"
        "            cnt += 1\n"
        "            s += x\n"
        "    print(f\"{cnt} {s}\")\n\n"
        "if __name__ == '__main__':\n"
        "    main()\n"
    ),
    "java": (
        "import java.io.*;\n"
        "import java.util.*;\n\n"
        "public class Solution07 {\n"
        "    public static void main(String[] args) throws IOException {\n"
        "        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n"
        "        StringTokenizer st = null;\n"
        "        String line = br.readLine();\n"
        "        if (line == null) return;\n"
        "        st = new StringTokenizer(line);\n"
        "        while (!st.hasMoreTokens()) {\n"
        "            line = br.readLine();\n"
        "            if (line == null) return;\n"
        "            st = new StringTokenizer(line);\n"
        "        }\n"
        "        int n = Integer.parseInt(st.nextToken());\n"
        "        long last = 0, sum = 0, cnt = 0;\n"
        "        for (int i = 0; i < n; i++) {\n"
        "            while (!st.hasMoreTokens()) {\n"
        "                line = br.readLine();\n"
        "                if (line == null) break;\n"
        "                st = new StringTokenizer(line);\n"
        "            }\n"
        "            long val = Long.parseLong(st.nextToken());\n"
        "            if (i == 0) {\n"
        "                last = val;\n"
        "                sum = val;\n"
        "                cnt = 1;\n"
        "            } else if (val > last) {\n"
        "                last = val;\n"
        "                sum += val;\n"
        "                cnt++;\n"
        "            }\n"
        "        }\n"
        "        System.out.println(cnt + \" \" + sum);\n"
        "    }\n"
        "}\n"
    ),
    "tests": gen_tests_07()
})

# ==============================================================================
# PROBLEM 08: p08_qadimgi_tangalar
# ==============================================================================
def gen_tests_08():
    tests = []
    # 2 Samples
    tests.append(("abbaca\n", "2\n"))
    tests.append(("abccba\n", "0\n"))
    # Boundaries
    tests.append(("a\n", "1\n"))
    tests.append(("aa\n", "0\n"))
    tests.append(("aaa\n", "1\n"))
    tests.append(("aaaa\n", "0\n"))
    tests.append(("abcdef\n", "6\n"))
    # Randoms
    rnd = random.Random(4008)
    for length in [10, 50, 500, 5000, 50000, 150000]:
        for _ in range(3):
            # Create string with duplicate cluster chance
            chars = []
            while len(chars) < length:
                ch = chr(ord('a') + rnd.randint(0, 5))
                repeat = rnd.choice([1, 2, 2, 3])
                chars.extend([ch] * repeat)
            s = "".join(chars[:length])
            st = []
            for ch in s:
                if st and st[-1] == ch:
                    st.pop()
                else:
                    st.append(ch)
            tests.append((f"{s}\n", f"{len(st)}\n"))
    return tests[:27]

PROBLEMS_1_10.append({
    "code": "4008",
    "slug": "p08_qadimgi_tangalar",
    "letter": "H",
    "title": "Qadimgi tangalar zanjiri",
    "statement": (
        "Xazinadan bir qatorda tizilgan sehrli tangalar zanjiri topildi. Har bir tanga kichik lotin "
        "harfi bilan belgilangan (satr ko'rinishida beriladi).\n\n"
        "Tangalarning g'aroyib magnit xususiyati bor: agar qatorda yonma-yon turgan ikkita tanga bir xil "
        "harfga ega bo'lib qolsa, ular bir zumda to'qnashib, juft bo'lib yo'qolib ketadi. Qolgan tangalar esa "
        "darhol bir-biriga jipslashadi va yangi qo'shnilar hosil bo'ladi. Bu jarayon yonma-yon bir xil "
        "tangalar qolmaguncha zanjir bo'ylab davom etadi.\n\n"
        "Barcha to'qnashuvlar tugagach, qatorda nechta tanga qolishini aniqlang."
    ),
    "input_format": "Bitta qatorda faqat kichik lotin harflaridan iborat bo'sh bo'lmagan $S$ ($1 \\le |S| \\le 2 \\times 10^5$) satri kiritiladi.",
    "output_format": "Yo'qolishlar tugagandan so'ng qatorda qolgan tangalar sonini bitta butun son sifatida chiqaring.",
    "note": "1-namunada: `abbaca` -> `bb` to'qnashib yo'qoladi, `aaca` qoladi. Keyin `aa` to'qnashadi va `ca` qoladi. Qolgan tangalar soni 2.",
    "time_limit": 1000,
    "memory_limit": 256,
    "explanation": (
        "### Masala tahlili:\n"
        "Yonma-yon kelgan bir xil belgilarni o'chirish klassik Stack (stek) ma'lumotlar tuzilmasi orqali yechiladi:\n"
        "- Satr bo'yicha chapdan o'ngga yuramiz.\n"
        "- Agar stek bo'sh bo'lmasa va uning yuqorisidagi belgi hozirgi belgiga teng bo'lsa, stekdan oxirgi belgini olib tashlaymiz (`pop`).\n"
        "- Aks holda, hozirgi belgini stekka qo'shamiz (`push`).\n\n"
        "Jarayon oxirida stekdagi elementlar soni qolgan tangalar sonini beradi.\n\n"
        "**Vaqt murakkabligi:** $O(|S|)$.\n"
        "**Xotira murakkabligi:** $O(|S|)$."
    ),
    "cpp": (
        "#include <iostream>\n"
        "#include <string>\n"
        "#include <vector>\n"
        "using namespace std;\n\n"
        "int main() {\n"
        "    ios_base::sync_with_stdio(false);\n"
        "    cin.tie(NULL);\n"
        "    string s;\n"
        "    if (cin >> s) {\n"
        "        string st;\n"
        "        for (char ch : s) {\n"
        "            if (!st.empty() && st.back() == ch) {\n"
        "                st.pop_back();\n"
        "            } else {\n"
        "                st.push_back(ch);\n"
        "            }\n"
        "        }\n"
        "        cout << st.length() << \"\\n\";\n"
        "    }\n"
        "    return 0;\n"
        "}\n"
    ),
    "py": (
        "import sys\n\n"
        "def main():\n"
        "    s = sys.stdin.read().strip()\n"
        "    if not s:\n"
        "        return\n"
        "    st = []\n"
        "    for ch in s:\n"
        "        if st and st[-1] == ch:\n"
        "            st.pop()\n"
        "        else:\n"
        "            st.append(ch)\n"
        "    print(len(st))\n\n"
        "if __name__ == '__main__':\n"
        "    main()\n"
    ),
    "java": (
        "import java.io.*;\n\n"
        "public class Solution08 {\n"
        "    public static void main(String[] args) throws IOException {\n"
        "        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n"
        "        String s = br.readLine();\n"
        "        if (s == null) return;\n"
        "        s = s.trim();\n"
        "        StringBuilder sb = new StringBuilder();\n"
        "        for (int i = 0; i < s.length(); i++) {\n"
        "            char ch = s.charAt(i);\n"
        "            int len = sb.length();\n"
        "            if (len > 0 && sb.charAt(len - 1) == ch) {\n"
        "                sb.deleteCharAt(len - 1);\n"
        "            } else {\n"
        "                sb.append(ch);\n"
        "            }\n"
        "        }\n"
        "        System.out.println(sb.length());\n"
        "    }\n"
        "}\n"
    ),
    "tests": gen_tests_08()
})

# ==============================================================================
# PROBLEM 09: p09_karvon_suvi
# ==============================================================================
def gen_tests_09():
    tests = []
    # 2 Samples
    tests.append(("4 10\n-3 5 -8 -2\n", "YES\n"))
    tests.append(("3 5\n-3 -4 10\n", "NO\n"))
    # Boundaries
    tests.append(("1 0\n0\n", "YES\n"))
    tests.append(("1 0\n-1\n", "NO\n"))
    tests.append(("1 100\n-100\n", "YES\n"))
    tests.append(("1 100\n-101\n", "NO\n"))
    # Randoms
    rnd = random.Random(4009)
    for n in [2, 5, 20, 50, 200, 1000, 5000, 20000, 50000, 100000]:
        for mode in ["safe", "fail"]:
            w = rnd.randint(10, 10**12)
            cur = w
            arr = []
            for _ in range(n):
                delta = rnd.randint(-10**9, 10**9)
                arr.append(delta)
            if mode == "fail":
                # ensure fail at some point
                fail_idx = rnd.randint(0, n - 1)
                arr[fail_idx] = - (w + 10**9 + 500)
            
            # check answer
            ok = True
            c = w
            for d in arr:
                c += d
                if c < 0:
                    ok = False
            tests.append((f"{n} {w}\n" + " ".join(map(str, arr)) + "\n", "YES\n" if ok else "NO\n"))
    return tests[:27]

PROBLEMS_1_10.append({
    "code": "4009",
    "slug": "p09_karvon_suvi",
    "letter": "I",
    "title": "Sahro karvoni suvi",
    "statement": (
        "Qizilqum sahrosi bo'ylab yo'lga chiqqan savdo karvoni boshida o'zi bilan $W$ litr ichimlik suvi "
        "olgan edi. Sayohat $N$ kun davom etadi.\n\n"
        "$i$-kuni karvonda suv o'zgarishi $A_i$ litrni tashkil qiladi:\n"
        "- Agar $A_i < 0$ bo'lsa, karvon ahli o'sha kuni $|A_i|$ litr suv ichib sarflaydi;\n"
        "- Agar $A_i > 0$ bo'lsa, karvon yo'ldagi chuchuk suvli vohaga yetib kelib, zaxirasiga $A_i$ litr suv to'ldirib oladi;\n"
        "- Agar $A_i = 0$ bo'lsa, zaxirada o'zgarish bo'lmaydi.\n\n"
        "Agar istalgan kun davomida yoki kun oxirida karvonda suv miqdori manfiy bo'lib qolsa ($< 0$), "
        "karvon suvsizlikdan xavf ostida qoladi. Agar karvon $N$ kunlik safarni biror marta ham suvsiz qolmasdan "
        "muvaffaqiyatli yakunlay olsa `YES`, aks holda `NO` chiqaring."
    ),
    "input_format": (
        "Birinchi qatorda ikkita butun son $N$ va $W$ ($1 \\le N \\le 10^5$, $0 \\le W \\le 10^{14}$) kiritiladi.\n"
        "Ikkinchi qatorda $N$ ta butun son $A_1, A_2, \\dots, A_N$ ($-10^9 \\le A_i \\le 10^9$) probel bilan kiritiladi."
    ),
    "output_format": "Karvon safarni xavfsiz yakunlay olsa `YES`, aks holda `NO` chiqaring.",
    "note": "1-namunada: Boshida 10 litr. 1-kun: 10 - 3 = 7. 2-kun: 7 + 5 = 12. 3-kun: 12 - 8 = 4. 4-kun: 4 - 2 = 2. Suv 0 dan kam bo'lmadi (`YES`).",
    "time_limit": 1000,
    "memory_limit": 256,
    "explanation": (
        "### Masala tahlili:\n"
        "Suv miqdorini boshlang'ich $W$ dan boshlab har bir kunlik $A_i$ o'zgarishiga mos ravishda $W \\leftarrow W + A_i$ qilib yangilab boramiz.\n\n"
        "Agar har qanday qadamda $W < 0$ bo'lib qolsa, darhol `NO` deb xulosa qilamiz.\n"
        "Agar barcha $N$ ta kundan keyin ham $W \\ge 0$ saqlansa, javob `YES` bo'ladi.\n\n"
        "**Muhim:** $W$ va oraliq summalar $10^{14}$ gacha yetishi mumkin, shuning uchun 64-bit butun son (`long long`) ishlatiladi.\n\n"
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
        "    long long w;\n"
        "    if (cin >> n >> w) {\n"
        "        bool ok = true;\n"
        "        for (int i = 0; i < n; i++) {\n"
        "            long long delta;\n"
        "            cin >> delta;\n"
        "            w += delta;\n"
        "            if (w < 0) ok = false;\n"
        "        }\n"
        "        cout << (ok ? \"YES\" : \"NO\") << \"\\n\";\n"
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
        "    w = int(tokens[1])\n"
        "    ok = True\n"
        "    for i in range(n):\n"
        "        delta = int(tokens[2 + i])\n"
        "        w += delta\n"
        "        if w < 0:\n"
        "            ok = False\n"
        "    print(\"YES\" if ok else \"NO\")\n\n"
        "if __name__ == '__main__':\n"
        "    main()\n"
    ),
    "java": (
        "import java.io.*;\n"
        "import java.util.*;\n\n"
        "public class Solution09 {\n"
        "    public static void main(String[] args) throws IOException {\n"
        "        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n"
        "        String line = br.readLine();\n"
        "        if (line == null) return;\n"
        "        StringTokenizer st = new StringTokenizer(line);\n"
        "        int n = Integer.parseInt(st.nextToken());\n"
        "        long w = Long.parseLong(st.nextToken());\n"
        "        boolean ok = true;\n"
        "        for (int i = 0; i < n; i++) {\n"
        "            while (!st.hasMoreTokens()) {\n"
        "                line = br.readLine();\n"
        "                if (line == null) break;\n"
        "                st = new StringTokenizer(line);\n"
        "            }\n"
        "            long delta = Long.parseLong(st.nextToken());\n"
        "            w += delta;\n"
        "            if (w < 0) ok = false;\n"
        "        }\n"
        "        System.out.println(ok ? \"YES\" : \"NO\");\n"
        "    }\n"
        "}\n"
    ),
    "tests": gen_tests_09()
})

# ==============================================================================
# PROBLEM 10: p10_qogoz_buklash (HAS ASCII-ART DIAGRAM)
# ==============================================================================
def gen_tests_10():
    tests = []
    # 2 Samples
    tests.append(("8 4 1\n", "16\n"))
    tests.append(("16 12 2\n", "28\n"))
    # Boundaries
    tests.append(("2 2 0\n", "8\n"))
    tests.append(("2 2 1\n", "6\n"))
    tests.append(("1000000000 1000000000 0\n", "4000000000\n"))
    tests.append(("1073741824 1073741824 30\n", "131072\n"))
    tests.append(("1073741824 1073741824 60\n", "4\n"))
    # Powers of 2
    rnd = random.Random(4010)
    for _ in range(21):
        pw = rnd.randint(10, 30)
        ph = rnd.randint(10, 30)
        w = 1 << pw
        h = 1 << ph
        max_k = min(pw + ph - 2, 40)
        k = rnd.randint(1, max_k)
        cw, ch = w, h
        for _step in range(k):
            if cw >= ch:
                cw //= 2
            else:
                ch //= 2
        tests.append((f"{w} {h} {k}\n", f"{2 * (cw + ch)}\n"))
    return tests

PROBLEMS_1_10.append({
    "code": "4010",
    "slug": "p10_qogoz_buklash",
    "letter": "J",
    "title": "Qog'oz buklash san'ati",
    "statement": (
        "Origami ustasi to'g'ri to'rtburchak shaklidagi qog'oz varag'i ustida ishlamoqda. "
        "Dastlab qog'ozning eni $W$ sm, bo'yi $H$ sm o'lchamga ega.\n\n"
        "Usta har bir harakatda qog'ozning **uzunroq tomonini** teng ikkiga buklaydi (agar ikkala tomon "
        "teng bo'lsa, xohlagan tomonini buklashi mumkin). Masalan, agar $W \\ge H$ bo'lsa, eni ikki barobar qisqarib "
        "$W/2$ ga aylanadi, bo'yi esa o'zgarmaydi.\n\n"
        "Quyidagi sxemada qog'ozni buklash jarayoni tasvirlangan:\n\n"
        "```\n"
        "   Dastlabki varaq (W >= H):        1-marta buklangandan so'ng:\n"
        "   +-----------------------+        +-----------+\n"
        "   |                       |        |           |\n"
        " H |                       |   -->  |           | H\n"
        "   |                       |        |           |\n"
        "   +-----------------------+        +-----------+\n"
        "              W                          W / 2\n"
        "```\n\n"
        "Usta ushbu buklash amalini ketma-ket $K$ marta takrorlagandan so'ng hosil bo'lgan yangi shaklning "
        "perimetri ($2 \\times (W' + H')$) qancha bo'lishini toping. Har bir buklashda buklanadigan tomon "
        "juft butun son bo'lishi kafolatlanadi."
    ),
    "input_format": "Bitta qatorda uchta butun son $W, H, K$ ($1 \\le W, H \\le 10^9$, $0 \\le K \\le 60$) kiritiladi.",
    "output_format": "$K$ marta buklashdan so'ng hosil bo'lgan to'g'ri to'rtburchakning perimetrini chiqaring.",
    "note": "1-namunada: $W=8, H=4, K=1$. $8 \\ge 4$ bo'lgani uchun $W$ teng ikkiga buklanadi: $W'=4, H'=4$. Perimetr $2 \\times (4 + 4) = 16$.",
    "time_limit": 1000,
    "memory_limit": 256,
    "explanation": (
        "### Masala tahlili:\n"
        "Har bir qadamda tomonlar taqqoslanadi:\n"
        "- Agar $W \\ge H$ bo'lsa, $W \\leftarrow W / 2$;\n"
        "- Aks holda, $H \\leftarrow H / 2$.\n\n"
        "Bu jarayon $K$ marta takrorlanadi. So'ngra perimetr $2 \\times (W + H)$ formulasi orqali hisoblanadi.\n"
        "$K \\le 60$ bo'lgani sababli oddiy sikl $K$ qadamda tez ishlaydi. Perimetr $4 \\times 10^9$ gacha yetishi mumkin, "
        "shuning uchun 64-bit butun son (`long long`) ishlatiladi.\n\n"
        "**Vaqt murakkabligi:** $O(K)$.\n"
        "**Xotira murakkabligi:** $O(1)$."
    ),
    "cpp": (
        "#include <iostream>\n"
        "#include <algorithm>\n"
        "using namespace std;\n\n"
        "int main() {\n"
        "    ios_base::sync_with_stdio(false);\n"
        "    cin.tie(NULL);\n"
        "    long long w, h;\n"
        "    int k;\n"
        "    if (cin >> w >> h >> k) {\n"
        "        for (int i = 0; i < k; i++) {\n"
        "            if (w >= h) w /= 2;\n"
        "            else h /= 2;\n"
        "        }\n"
        "        long long p = 2 * (w + h);\n"
        "        cout << p << \"\\n\";\n"
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
        "    w, h, k = map(int, tokens[:3])\n"
        "    for _ in range(k):\n"
        "        if w >= h:\n"
        "            w //= 2\n"
        "        else:\n"
        "            h //= 2\n"
        "    print(2 * (w + h))\n\n"
        "if __name__ == '__main__':\n"
        "    main()\n"
    ),
    "java": (
        "import java.util.Scanner;\n\n"
        "public class Solution10 {\n"
        "    public static void main(String[] args) {\n"
        "        Scanner in = new Scanner(System.in);\n"
        "        if (in.hasNextLong()) {\n"
        "            long w = in.nextLong();\n"
        "            long h = in.nextLong();\n"
        "            int k = in.nextInt();\n"
        "            for (int i = 0; i < k; i++) {\n"
        "                if (w >= h) w /= 2;\n"
        "                else h /= 2;\n"
        "            }\n"
        "            System.out.println(2 * (w + h));\n"
        "        }\n"
        "    }\n"
        "}\n"
    ),
    "tests": gen_tests_10()
})
