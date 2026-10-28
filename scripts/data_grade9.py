"""Data for Grade 9 contest problems (A, B, C, D, E)."""

PROBLEMS_9 = [
    {
        "name": "grade9_a_zumrad_toshlari",
        "title": "Zumradning Sehrli Toshlari",
        "points": 7,
        "difficulty": 800,
        "tags": "ad-hoc, greedy, prefix-maximum",
        "stress_args": "-n 20 -max-val 50",
        "statement": r"""\textbf{\Large Zumradning Sehrli Toshlari}

Zumrad o'gay onasining topshirig'i bilan daryo sohilidan sehrli toshlar termoqda. Qirg'oq bo'ylab oqim yo'nalishida $n$ ta tosh qator tizilgan. Har bir $i$-toshning go'zallik darajasi $a_i$ ga teng.

Zumrad toshlarni birinchi toshdan boshlab tartib bilan ko'zdan kechiradi. U shunday toshlarnigina xaltachasiga soladiki, agar toshning go'zallik darajasi hozirgacha terilgan barcha toshlarning go'zalligidan qat'iy katta bo'lsa, uni xaltachasiga oladi. Birinchi tosh ($a_1$) har doim xaltachaga solinadi.

Zumrad jami nechta tosh to'plaganini aniqlang.

\textbf{Input}

Birinchi qatorda bitta butun son $n$ ($1 \leq n \leq 100'000$)~--- sohil bo'yidagi toshlar soni.

Ikkinchi qatorda $n$ ta butun son $a_1, a_2, \ldots, a_n$ ($1 \leq a_i \leq 10^9$)~--- toshlarning go'zallik darajalari.

\textbf{Output}

Bitta butun son~--- Zumrad to'plagan toshlarning umumiy sonini chiqaring.

\textbf{Notes}

Birinchi namunada toshlarning go'zalligi $[3, 1, 4, 2, 5]$. 
\begin{itemize}
    \item $a_1 = 3$ olinadi (maksimum: 3).
    \item $a_2 = 1$ olinmaydi ($1 \leq 3$).
    \item $a_3 = 4$ olinadi ($4 > 3$, yangi maksimum: 4).
    \item $a_4 = 2$ olinmaydi ($2 \leq 4$).
    \item $a_5 = 5$ olinadi ($5 > 4$, yangi maksimum: 5).
\end{itemize}
Jami 3 ta tosh teriladi.
""",
        "tutorial": r"""\textbf{\Large Zumradning Sehrli Toshlari --- Tutorial}

\textbf{Mavzu:} Ad-hoc, massiv elementlari bo'yicha bir marta yugurib chiqish ($O(N)$).

\textbf{Tahlil:}
Bizdan massivdagi qat'iy prefiks maksimumlar sonini topish talab qilinadi. Dastlab maksimum qiymatni $0$ deb olamiz va hisoblagichni $0$ ga tenglaymiz. Massiv bo'ylab $i = 1$ dan $n$ gacha bir marta yurib chiqamiz: agar $a_i > \text{maksimum}$ bo'lsa, hisoblagichni 1 taga oshiramiz va maksimum qiymatni $a_i$ ga yangilaymiz.

Vaqt murakkabligi: $O(N)$ bir marta o'tish.
Xotira murakkabligi: $O(1)$ qo'shimcha xotira.
""",
        "validator": r"""#include "testlib.h"

int main(int argc, char* argv[]) {
    registerValidation(argc, argv);
    int n = inf.readInt(1, 100'000, "n");
    inf.readEoln();
    for (int i = 0; i < n; i++) {
        if (i > 0) inf.readSpace();
        inf.readInt(1, 1'000'000'000, "a_i");
    }
    inf.readEoln();
    inf.readEof();
    return 0;
}
""",
        "acc": r"""#include <bits/stdc++.h>
using namespace std;

void solve() {
    int n;
    if (!(cin >> n)) return;
    int count = 0;
    int mx = 0;
    for (int i = 0; i < n; i++) {
        int x;
        cin >> x;
        if (x > mx) {
            count++;
            mx = x;
        }
    }
    cout << count << "\n";
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int test_cases = 1;
    while (test_cases--) {
        solve();
    }
    return 0;
}
""",
        "acc_java": r"""import java.util.Scanner;

public class acc_java {
    static Scanner in = new Scanner(System.in);

    static void solve() {
        if (!in.hasNextInt()) return;
        int n = in.nextInt();
        int count = 0;
        int mx = 0;
        for (int i = 0; i < n; i++) {
            int x = in.nextInt();
            if (x > mx) {
                count++;
                mx = x;
            }
        }
        System.out.println(count);
    }

    public static void main(String[] args) {
        int testCases = 1;
        while (testCases-- > 0) {
            solve();
        }
    }
}
""",
        "acc_alt": r"""#include <bits/stdc++.h>
using namespace std;

void solve() {
    int n;
    if (!(cin >> n)) return;
    vector<int> a(n);
    for (int i = 0; i < n; i++) {
        cin >> a[i];
    }
    int ans = 0;
    int cur_max = 0;
    for (int x : a) {
        if (x > cur_max) {
            ans++;
            cur_max = x;
        }
    }
    cout << ans << "\n";
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int test_cases = 1;
    while (test_cases--) {
        solve();
    }
    return 0;
}
""",
        "brute": r"""#include <bits/stdc++.h>
using namespace std;

void solve() {
    int n;
    if (!(cin >> n)) return;
    vector<int> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    int count = 0;
    for (int i = 0; i < n; i++) {
        bool ok = true;
        for (int j = 0; j < i; j++) {
            if (a[j] >= a[i]) {
                ok = false;
                break;
            }
        }
        if (ok) count++;
    }
    cout << count << "\n";
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int test_cases = 1;
    while (test_cases--) {
        solve();
    }
    return 0;
}
""",
        "wa": r"""#include <bits/stdc++.h>
using namespace std;

void solve() {
    int n;
    if (!(cin >> n)) return;
    vector<int> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    // Bug: returns n unconditionally
    cout << n << "\n";
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int test_cases = 1;
    while (test_cases--) {
        solve();
    }
    return 0;
}
""",
        "generator": r"""#include "testlib.h"
#include <bits/stdc++.h>
using namespace std;

int main(int argc, char* argv[]) {
    registerGen(argc, argv, 1);
    int n = opt<int>("n", 10);
    int max_val = opt<int>("max-val", 100);
    string type = opt<string>("type", "random");

    println(n);
    vector<int> a(n);
    if (type == "inc") {
        for (int i = 0; i < n; i++) a[i] = i + 1;
    } else if (type == "dec") {
        for (int i = 0; i < n; i++) a[i] = n - i;
    } else if (type == "same") {
        for (int i = 0; i < n; i++) a[i] = max_val;
    } else {
        for (int i = 0; i < n; i++) a[i] = rnd.next(1, max_val);
    }
    println(a);
    return 0;
}

/*
FreeMarker script example:
Executable name must match this file's base name: generator

generator -n 1 -max-val 1 > $
generator -n 5 -max-val 10 -type inc > $
generator -n 5 -max-val 10 -type dec > $
generator -n 5 -max-val 10 -type same > $
generator -n 10 -max-val 100 -type random 1 > $
generator -n 100 -max-val 1000 -type random 2 > $
generator -n 100000 -max-val 1000000000 -type random 3 > $
generator -n 100000 -max-val 1000000000 -type inc > $
generator -n 100000 -max-val 1000000000 -type dec > $
*/
""",
        "samples": [
            ("5\n3 1 4 2 5\n", "3\n")
        ],
        "validator_tests": [
            ("valid_min.in", "1\n1\n", True),
            ("valid_max.in", "3\n1000000000 1000000000 1000000000\n", True),
            ("invalid_n_zero.in", "0\n\n", False),
            ("invalid_elem_zero.in", "2\n1 0\n", False),
            ("invalid_too_large.in", "1\n1000000001\n", False),
        ]
    },
    {
        "name": "grade9_b_bohirsoq_qoldiqlari",
        "title": "Bo'g'irsoq va Bo'rining Jumbog'i",
        "points": 7,
        "difficulty": 900,
        "tags": "number-theory, gcd, primes",
        "stress_args": "-max-val 1000",
        "statement": r"""\textbf{\Large Bo'g'irsoq va Bo'rining Jumbog'i}

Bo'g'irsoq o'rmon so'qmog'ida xursand bo'lib kuylab dumalab ketayotganida Bo'riga duch keldi. Bo'ri Bo'g'irsoqni yeb qo'ymaslik uchun unga bitta shart qo'ydi:

Bo'ri unga ikkita butun son $a$ va $b$ beradi. Bo'g'irsoq ularning eng katta umumiy bo'luvchisi $g = \gcd(a, b)$ ni topishi kerak. Agar topilgan $g$ soni \textbf{tub son} bo'lsa, Bo'ri Bo'g'irsoqni qo'yib yuboradi va uning omadi chopadi. Aks holda Bo'ri uni tutib oladi.

Bo'g'irsoq omon qoladimi yoki yo'qmi, aniqlang.

\textbf{Input}

Bitta qatorda ikkita butun son $a$ va $b$ ($1 \leq a, b \leq 10^{12}$) beriladi.

\textbf{Output}

Agar $\gcd(a, b)$ tub son bo'lsa, \texttt{YES} so'zini, aks holda \texttt{NO} so'zini chiqaring.

\textbf{Notes}

Birinchi namunada $a = 12, b = 18$. Ularning EKUBi $\gcd(12, 18) = 6$. $6$ soni tub emas, chunki uning bo'luvchilari 1, 2, 3, 6. Shuning uchun javob \texttt{NO}.
Ikkinchi namunada $a = 10, b = 15$. $\gcd(10, 15) = 5$. $5$ soni tub son bo'lgani uchun javob \texttt{YES}.
""",
        "tutorial": r"""\textbf{\Large Bo'g'irsoq va Bo'rining Jumbog'i --- Tutorial}

\textbf{Mavzu:} Raqamlar nazariyasi, EKUB (Evklid algoritmi), tublikka tekshirish.

\textbf{Tahlil:}
1. Dastlab $g = \gcd(a, b)$ qiymatini Evklid algoritmi yordamida hisoblaymiz. $C++$ da \texttt{std::gcd(a, b)} funksiyasi mavjud.
2. So'ngra $g$ sonining tubligini tekshiramiz:
   - Agar $g < 2$ bo'lsa, u tub emas (\texttt{NO}).
   - $d = 2, 3, \ldots$ qadamda $d \times d \leq g$ shart bajarilguncha tekshiramiz. Agar birorta $d$ ga bo'linsa, tub emas (\texttt{NO}).
   - Agar hech qaysi $d$ ga bo'linmasa, demak $g$ tub son (\texttt{YES}).

Vaqt murakkabligi: $O(\log(\min(a, b)) + \sqrt{g})$ amallar soni, bu $10^{12}$ chegarasida ko'pi bilan $10^6$ ta operatsiya talab qiladi va 0.01 soniyada ishlaydi.
""",
        "validator": r"""#include "testlib.h"

int main(int argc, char* argv[]) {
    registerValidation(argc, argv);
    inf.readLong(1LL, 1'000'000'000'000LL, "a");
    inf.readSpace();
    inf.readLong(1LL, 1'000'000'000'000LL, "b");
    inf.readEoln();
    inf.readEof();
    return 0;
}
""",
        "acc": r"""#include <bits/stdc++.h>
using namespace std;

bool is_prime(long long n) {
    if (n < 2) return false;
    for (long long d = 2; d * d <= n; d++) {
        if (n % d == 0) return false;
    }
    return true;
}

void solve() {
    long long a, b;
    if (!(cin >> a >> b)) return;
    long long g = std::gcd(a, b);
    if (is_prime(g)) {
        cout << "YES\n";
    } else {
        cout << "NO\n";
    }
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int test_cases = 1;
    while (test_cases--) {
        solve();
    }
    return 0;
}
""",
        "acc_java": r"""import java.util.Scanner;

public class acc_java {
    static Scanner in = new Scanner(System.in);

    static long gcd(long a, long b) {
        while (b != 0) {
            long t = b;
            b = a % b;
            a = t;
        }
        return a;
    }

    static boolean isPrime(long n) {
        if (n < 2) return false;
        for (long d = 2; d * d <= n; d++) {
            if (n % d == 0) return false;
        }
        return true;
    }

    static void solve() {
        if (!in.hasNextLong()) return;
        long a = in.nextLong();
        long b = in.nextLong();
        long g = gcd(a, b);
        if (isPrime(g)) {
            System.out.println("YES");
        } else {
            System.out.println("NO");
        }
    }

    public static void main(String[] args) {
        solve();
    }
}
""",
        "acc_alt": r"""#include <bits/stdc++.h>
using namespace std;

long long get_gcd(long long x, long long y) {
    return std::gcd(x, y);
}

void solve() {
    long long a, b;
    if (!(cin >> a >> b)) return;
    long long g = get_gcd(a, b);
    if (g <= 1) {
        cout << "NO\n";
        return;
    }
    bool prime = true;
    for (long long i = 2; i * i <= g; i++) {
        if (g % i == 0) {
            prime = false;
            break;
        }
    }
    cout << (prime ? "YES" : "NO") << "\n";
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    solve();
    return 0;
}
""",
        "brute": r"""#include <bits/stdc++.h>
using namespace std;

void solve() {
    long long a, b;
    if (!(cin >> a >> b)) return;
    long long g = 1;
    long long lim = min(a, b);
    for (long long i = 1; i <= lim; i++) {
        if (a % i == 0 && b % i == 0) {
            g = i;
        }
    }
    bool prime = (g >= 2);
    for (long long i = 2; i < g; i++) {
        if (g % i == 0) prime = false;
    }
    cout << (prime ? "YES" : "NO") << "\n";
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    solve();
    return 0;
}
""",
        "wa": r"""#include <bits/stdc++.h>
using namespace std;

void solve() {
    long long a, b;
    if (!(cin >> a >> b)) return;
    // Bug: forgets to check if gcd is prime, only checks if gcd > 1
    long long g = std::gcd(a, b);
    if (g > 1) {
        cout << "YES\n";
    } else {
        cout << "NO\n";
    }
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    solve();
    return 0;
}
""",
        "generator": r"""#include "testlib.h"
#include <bits/stdc++.h>
using namespace std;

int main(int argc, char* argv[]) {
    registerGen(argc, argv, 1);
    long long max_val = opt<long long>("max-val", 1'000'000'000'000LL);
    string mode = opt<string>("mode", "random");

    long long a = 1, b = 1;
    if (mode == "prime_gcd") {
        long long p = opt<long long>("p", 7);
        long long m1 = opt<long long>("m1", 3);
        long long m2 = opt<long long>("m2", 5);
        a = p * m1;
        b = p * m2;
    } else if (mode == "comp_gcd") {
        long long g = opt<long long>("g", 6);
        long long m1 = opt<long long>("m1", 5);
        long long m2 = opt<long long>("m2", 7);
        a = g * m1;
        b = g * m2;
    } else if (mode == "coprime") {
        a = opt<long long>("a", 8);
        b = opt<long long>("b", 9);
    } else {
        a = rnd.next(1LL, max_val);
        b = rnd.next(1LL, max_val);
    }
    println(a, b);
    return 0;
}

/*
FreeMarker script example:
Executable name must match this file's base name: generator

generator -mode coprime -a 1 -b 1 > $
generator -mode coprime -a 1 -b 2 > $
generator -mode prime_gcd -p 2 -m1 1 -m2 1 > $
generator -mode prime_gcd -p 3 -m1 2 -m2 4 > $
generator -mode comp_gcd -g 4 -m1 1 -m2 1 > $
generator -mode comp_gcd -g 6 -m1 2 -m2 3 > $
generator -max-val 100 1 > $
generator -max-val 10000 2 > $
generator -max-val 1000000000000 3 > $
generator -max-val 1000000000000 4 > $
*/
""",
        "samples": [
            ("12 18\n", "NO\n")
        ],
        "validator_tests": [
            ("valid_min.in", "1 1\n", True),
            ("valid_max.in", "1000000000000 1000000000000\n", True),
            ("invalid_zero.in", "0 5\n", False),
            ("invalid_negative.in", "-1 5\n", False),
            ("invalid_large.in", "1000000000001 5\n", False),
        ]
    },
    {
        "name": "grade9_c_qirq_kokil_inju",
        "title": "Qirq Kokil va Marjon Injulari",
        "points": 10,
        "difficulty": 1100,
        "tags": "sorting, prefix-sums, binary-search",
        "stress_args": "-n 20 -q 10 -max-val 100",
        "statement": r"""\textbf{\Large Qirq Kokil va Marjon Injulari}

Qirq kokilli go'zal qizning qutichasida $n$ dona qimmatbaho inju bor. Har bir $i$-injuning narxi $a_i$ tanga. Qiz to'y marosimiga taqish uchun eng chiroyli va qulay marjon yasashni xohlaydi.

Unga $q$ ta so'rov beriladi: har bir so'rovda bitta butun son $k$ ($1 \leq k \leq n$) beriladi. Har bir so'rov uchun eng arzon $k$ ta injuning jami narxini hisoblang.

\textbf{Input}

Birinchi qatorda ikkita butun son $n$ va $q$ ($1 \leq n, q \leq 100'000$)~--- injular soni va so'rovlar soni.

Ikkinchi qatorda $n$ ta butun son $a_1, a_2, \ldots, a_n$ ($1 \leq a_i \leq 10^9$)~--- injular narxlari.

Keyingi $q$ ta qatorda bittadan butun son $k$ ($1 \leq k \leq n$)~--- har bir so'rovdagi injular soni.

\textbf{Output}

Har bir so'rov uchun alohida qatorda eng arzon $k$ ta injuning jami narxini chiqaring.

\textbf{Notes}

Injular narxlari saralansa: $[1, 2, 4, 5, 8]$.
\begin{itemize}
    \item $k = 1$: eng arzon 1 ta inju narxi $1$.
    \item $k = 3$: eng arzon 3 ta inju narxi $1 + 2 + 4 = 7$.
    \item $k = 5$: barcha injular narxi $1 + 2 + 4 + 5 + 8 = 20$.
\end{itemize}
""",
        "tutorial": r"""\textbf{\Large Qirq Kokil va Marjon Injulari --- Tutorial}

\textbf{Mavzu:} Saralash (Sorting) va Prefiks yig'indilar (Prefix Sums).

\textbf{Tahlil:}
1. Berilgan massivni o'sish tartibida saralaymiz: $a_1 \leq a_2 \leq \ldots \leq a_n$. Saralash $O(N \log N)$ vaqt oladi.
2. Saralangan massiv ustida prefiks yig'indilar massivini quramiz:
   $pref[0] = 0$, $pref[i] = pref[i-1] + a_i$.
   Natijada $pref[k]$ birinchi eng arzon $k$ ta injuning narxlari yig'indisini ifodalaydi.
3. Har bir so'rov uchun $pref[k]$ qiymatini $O(1)$ vaqtda chiqaramiz. E'tibor bering, yig'indi $10^{14}$ gacha yetishi mumkin, shuning uchun 64-bitlik butun son (\texttt{long long}) turidan foydalanish lozim.

Umumiy murakkablik: $O(N \log N + Q)$ vaqt, $O(N)$ xotira.
""",
        "validator": r"""#include "testlib.h"

int main(int argc, char* argv[]) {
    registerValidation(argc, argv);
    int n = inf.readInt(1, 100'000, "n");
    inf.readSpace();
    int q = inf.readInt(1, 100'000, "q");
    inf.readEoln();
    for (int i = 0; i < n; i++) {
        if (i > 0) inf.readSpace();
        inf.readInt(1, 1'000'000'000, "a_i");
    }
    inf.readEoln();
    for (int i = 0; i < q; i++) {
        inf.readInt(1, n, "k_i");
        inf.readEoln();
    }
    inf.readEof();
    return 0;
}
""",
        "acc": r"""#include <bits/stdc++.h>
using namespace std;

void solve() {
    int n, q;
    if (!(cin >> n >> q)) return;
    vector<long long> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    sort(a.begin(), a.end());
    vector<long long> pref(n + 1, 0);
    for (int i = 0; i < n; i++) {
        pref[i + 1] = pref[i] + a[i];
    }
    for (int i = 0; i < q; i++) {
        int k;
        cin >> k;
        cout << pref[k] << "\n";
    }
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int test_cases = 1;
    while (test_cases--) {
        solve();
    }
    return 0;
}
""",
        "acc_java": r"""import java.util.Arrays;
import java.util.Scanner;

public class acc_java {
    static Scanner in = new Scanner(System.in);

    static void solve() {
        if (!in.hasNextInt()) return;
        int n = in.nextInt();
        int q = in.nextInt();
        long[] a = new long[n];
        for (int i = 0; i < n; i++) {
            a[i] = in.nextLong();
        }
        Arrays.sort(a);
        long[] pref = new long[n + 1];
        for (int i = 0; i < n; i++) {
            pref[i + 1] = pref[i] + a[i];
        }
        for (int i = 0; i < q; i++) {
            int k = in.nextInt();
            System.out.println(pref[k]);
        }
    }

    public static void main(String[] args) {
        solve();
    }
}
""",
        "acc_alt": r"""#include <bits/stdc++.h>
using namespace std;

void solve() {
    int n, q;
    if (!(cin >> n >> q)) return;
    vector<long long> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    sort(a.begin(), a.end());
    for (int i = 1; i < n; i++) {
        a[i] += a[i - 1];
    }
    while (q--) {
        int k;
        cin >> k;
        cout << a[k - 1] << "\n";
    }
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    solve();
    return 0;
}
""",
        "brute": r"""#include <bits/stdc++.h>
using namespace std;

void solve() {
    int n, q;
    if (!(cin >> n >> q)) return;
    vector<long long> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    while (q--) {
        int k;
        cin >> k;
        vector<long long> cur = a;
        sort(cur.begin(), cur.end());
        long long sum = 0;
        for (int i = 0; i < k; i++) sum += cur[i];
        cout << sum << "\n";
    }
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    solve();
    return 0;
}
""",
        "wa": r"""#include <bits/stdc++.h>
using namespace std;

void solve() {
    int n, q;
    if (!(cin >> n >> q)) return;
    vector<long long> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    // Bug: forgets to sort the array before calculating prefix sum
    vector<long long> pref(n + 1, 0);
    for (int i = 0; i < n; i++) {
        pref[i + 1] = pref[i] + a[i];
    }
    while (q--) {
        int k;
        cin >> k;
        cout << pref[k] << "\n";
    }
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    solve();
    return 0;
}
""",
        "generator": r"""#include "testlib.h"
#include <bits/stdc++.h>
using namespace std;

int main(int argc, char* argv[]) {
    registerGen(argc, argv, 1);
    int n = opt<int>("n", 10);
    int q = opt<int>("q", 5);
    int max_val = opt<int>("max-val", 100);

    println(n, q);
    vector<int> a(n);
    for (int i = 0; i < n; i++) a[i] = rnd.next(1, max_val);
    println(a);

    for (int i = 0; i < q; i++) {
        println(rnd.next(1, n));
    }
    return 0;
}

/*
FreeMarker script example:
Executable name must match this file's base name: generator

generator -n 1 -q 1 -max-val 1 > $
generator -n 5 -q 3 -max-val 10 > $
generator -n 10 -q 5 -max-val 100 1 > $
generator -n 50 -q 20 -max-val 1000 2 > $
generator -n 1000 -q 500 -max-val 1000000 3 > $
generator -n 100000 -q 100000 -max-val 1000000000 4 > $
*/
""",
        "samples": [
            ("5 3\n5 2 8 1 4\n1\n3\n5\n", "1\n7\n20\n")
        ],
        "validator_tests": [
            ("valid_min.in", "1 1\n1\n1\n", True),
            ("valid_max.in", "2 1\n1000000000 1000000000\n2\n", True),
            ("invalid_k_zero.in", "2 1\n1 2\n0\n", False),
            ("invalid_k_too_big.in", "2 1\n1 2\n3\n", False),
            ("invalid_n_zero.in", "0 1\n\n1\n", False),
        ]
    },
    {
        "name": "grade9_d_kenja_botir_xazina",
        "title": "Kenja Botir va Devlar Xazinasi",
        "points": 10,
        "difficulty": 1200,
        "tags": "dp, knapsack",
        "stress_args": "-n 10 -W 50 -max-val 100",
        "statement": r"""\textbf{\Large Kenja Botir va Devlar Xazinasi}

Kenja botir qorong'u g'orga tushib, devlar yashirgan sehrli xazinaga yetib keldi. G'orda $n$ ta qimmatbaho buyum bor. Har bir $i$-buyumning og'irligi $w_i$ botmon va qimmati $v_i$ tilla tangaga teng.

Botirning xurjuni ko'pi bilan $W$ botmon og'irlik ko'tara oladi. Kenja botir xurjunga sig'adigan buyumlardan eng ko'p umumiy qimmatga ega bo'lgan to'plamni tanlab olishi kerak.

Xurjunga joylashtirish mumkin bo'lgan buyumlarning maksimal jami qimmatini toping.

\textbf{Input}

Birinchi qatorda ikkita butun son $n$ va $W$ ($1 \leq n \leq 1'000, 1 \leq W \leq 1'000$)~--- buyumlar soni va xurjun sig'imi.

Keyingi $n$ ta qatorda ikkitadan butun son $w_i$ va $v_i$ ($1 \leq w_i \leq W, 1 \leq v_i \leq 1'000'000$)~--- $i$-buyumning og'irligi va qimmati.

\textbf{Output}

Bitta butun son~--- xurjunga sig'adigan buyumlarning maksimal umumiy qimmatini chiqaring.

\textbf{Notes}

Birinchi namunada 4 ta buyum bor, $W = 5$.
Birinchi ($w_1 = 2, v_1 = 3$) va ikkinchi ($w_2 = 3, v_2 = 4$) buyumlar tanlansa, og'irlik $2 + 3 = 5 \leq 5$, jami qimmat $3 + 4 = 7$ bo'ladi.
""",
        "tutorial": r"""\textbf{\Large Kenja Botir va Devlar Xazinasi --- Tutorial}

\textbf{Mavzu:} Klassik 0/1 Dinamik dasturlash (0/1 Knapsack).

\textbf{Tahlil:}
Bu klassik 0/1 Knapsack masalasidir.
$dp[j]$~--- xurjunda jami $j$ og'irlik band bo'lganda erishish mumkin bo'lgan maksimal qimmat.
Dastlab barcha $j$ uchun $dp[j] = 0$.
Har bir $(w_i, v_i)$ buyum uchun massivni o'ngdan chapga qarab yangilaymiz (bir buyum bir marta ishlatilishi uchun):
\[ dp[j] = \max(dp[j], dp[j - w_i] + v_i) \quad \text{bu yerda } j = W, W-1, \ldots, w_i \]

Vaqt murakkabligi: $O(N \cdot W)$. $N, W \leq 1000$ bo'lgani sababli amallar soni $10^6$ bo'ladi.
Xotira murakkabligi: $O(W)$ bitta o'lchamli massiv.
""",
        "validator": r"""#include "testlib.h"

int main(int argc, char* argv[]) {
    registerValidation(argc, argv);
    int n = inf.readInt(1, 1'000, "n");
    inf.readSpace();
    int w = inf.readInt(1, 1'000, "W");
    inf.readEoln();
    for (int i = 0; i < n; i++) {
        inf.readInt(1, w, "w_i");
        inf.readSpace();
        inf.readInt(1, 1'000'000, "v_i");
        inf.readEoln();
    }
    inf.readEof();
    return 0;
}
""",
        "acc": r"""#include <bits/stdc++.h>
using namespace std;

void solve() {
    int n, W;
    if (!(cin >> n >> W)) return;
    vector<long long> dp(W + 1, 0);
    for (int i = 0; i < n; i++) {
        int w;
        long long v;
        cin >> w >> v;
        for (int j = W; j >= w; j--) {
            dp[j] = max(dp[j], dp[j - w] + v);
        }
    }
    long long ans = 0;
    for (int j = 0; j <= W; j++) {
        ans = max(ans, dp[j]);
    }
    cout << ans << "\n";
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int test_cases = 1;
    while (test_cases--) {
        solve();
    }
    return 0;
}
""",
        "acc_java": r"""import java.util.Scanner;

public class acc_java {
    static Scanner in = new Scanner(System.in);

    static void solve() {
        if (!in.hasNextInt()) return;
        int n = in.nextInt();
        int W = in.nextInt();
        long[] dp = new long[W + 1];
        for (int i = 0; i < n; i++) {
            int w = in.nextInt();
            long v = in.nextLong();
            for (int j = W; j >= w; j--) {
                dp[j] = Math.max(dp[j], dp[j - w] + v);
            }
        }
        long ans = 0;
        for (int j = 0; j <= W; j++) {
            ans = Math.max(ans, dp[j]);
        }
        System.out.println(ans);
    }

    public static void main(String[] args) {
        solve();
    }
}
""",
        "acc_alt": r"""#include <bits/stdc++.h>
using namespace std;

void solve() {
    int n, W;
    if (!(cin >> n >> W)) return;
    vector<int> w(n);
    vector<long long> v(n);
    for (int i = 0; i < n; i++) {
        cin >> w[i] >> v[i];
    }
    vector<vector<long long>> dp(n + 1, vector<long long>(W + 1, 0));
    for (int i = 0; i < n; i++) {
        for (int j = 0; j <= W; j++) {
            dp[i + 1][j] = dp[i][j];
            if (j >= w[i]) {
                dp[i + 1][j] = max(dp[i + 1][j], dp[i][j - w[i]] + v[i]);
            }
        }
    }
    cout << dp[n][W] << "\n";
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    solve();
    return 0;
}
""",
        "brute": r"""#include <bits/stdc++.h>
using namespace std;

void solve() {
    int n, W;
    if (!(cin >> n >> W)) return;
    vector<int> w(n);
    vector<long long> v(n);
    for (int i = 0; i < n; i++) cin >> w[i] >> v[i];
    long long ans = 0;
    int limit = 1 << min(n, 20);
    for (int mask = 0; mask < limit; mask++) {
        int cur_w = 0;
        long long cur_v = 0;
        for (int i = 0; i < min(n, 20); i++) {
            if (mask & (1 << i)) {
                cur_w += w[i];
                cur_v += v[i];
            }
        }
        if (cur_w <= W) {
            ans = max(ans, cur_v);
        }
    }
    cout << ans << "\n";
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    solve();
    return 0;
}
""",
        "wa": r"""#include <bits/stdc++.h>
using namespace std;

void solve() {
    int n, W;
    if (!(cin >> n >> W)) return;
    // Bug: greedy by value density instead of DP (fails on 0/1 knapsack)
    vector<pair<double, pair<int, long long>>> items(n);
    for (int i = 0; i < n; i++) {
        int w;
        long long v;
        cin >> w >> v;
        items[i] = { (double)v / w, {w, v} };
    }
    sort(items.rbegin(), items.rend());
    long long ans = 0;
    int cur_w = 0;
    for (int i = 0; i < n; i++) {
        if (cur_w + items[i].second.first <= W) {
            cur_w += items[i].second.first;
            ans += items[i].second.second;
        }
    }
    cout << ans << "\n";
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    solve();
    return 0;
}
""",
        "generator": r"""#include "testlib.h"
#include <bits/stdc++.h>
using namespace std;

int main(int argc, char* argv[]) {
    registerGen(argc, argv, 1);
    int n = opt<int>("n", 10);
    int W = opt<int>("W", 50);
    int max_val = opt<int>("max-val", 100);

    println(n, W);
    for (int i = 0; i < n; i++) {
        int w = rnd.next(1, W);
        int v = rnd.next(1, max_val);
        println(w, v);
    }
    return 0;
}

/*
FreeMarker script example:
Executable name must match this file's base name: generator

generator -n 1 -W 1 -max-val 1 > $
generator -n 4 -W 5 -max-val 10 > $
generator -n 10 -W 20 -max-val 100 1 > $
generator -n 50 -W 100 -max-val 1000 2 > $
generator -n 500 -W 500 -max-val 100000 3 > $
generator -n 1000 -W 1000 -max-val 1000000 4 > $
*/
""",
        "samples": [
            ("4 5\n2 3\n3 4\n4 5\n5 6\n", "7\n")
        ],
        "validator_tests": [
            ("valid_min.in", "1 1\n1 1\n", True),
            ("valid_max.in", "2 1000\n1000 1000000\n1 1000000\n", True),
            ("invalid_w_zero.in", "1 1\n0 1\n", False),
            ("invalid_w_exceeds.in", "1 5\n6 1\n", False),
            ("invalid_n_zero.in", "0 1\n", False),
        ]
    },
    {
        "name": "grade9_e_sehrli_sandik",
        "title": "Sehrli Sandiq Qulfi",
        "points": 16,
        "difficulty": 1400,
        "tags": "combinatorics, dynamic-programming, math",
        "stress_args": "-n 15",
        "statement": r"""\textbf{\Large Sehrli Sandiq Qulfi}

Devlar xazinasidagi sehrli sandiq qulfi doira shaklida joylashgan $n$ ta katakdan iborat ($1, 2, \ldots, n$). Kataklar soat mili bo'yicha ketma-ket joylashgan bo'lib, 1-katak $n$-katak bilan ham tutashgan.

Har bir katakka $1, 2, 3$ raqamlaridan birini qo'yish mumkin. Sandiq ochilishi uchun qulfdagi kod shunday bo'lishi kerakki, hech qaysi ikkita yonma-yon katakda bir xil raqam bo'lmasligi kerak (jumladan, 1- va $n$-katakdagi raqamlar ham har xil bo'lishi shart).

Sandiqni ochishi mumkin bo'lgan jami turli to'g'ri kodlar sonini $10^9+7$ moduli bo'yicha toping.

\textbf{Input}

Bitta qatorda butun son $n$ ($2 \leq n \leq 100'000$)~--- doiradagi kataklar soni.

\textbf{Output}

Bitta butun son~--- to'g'ri kodlar sonining $10^9+7$ bo'yicha qoldig'ini chiqaring.

\textbf{Notes}

$n = 3$ bo'lganda, 3 ta katak o'zaro juft-juft tutashgan bo'ladi (uchburchak). Har xil rang berish usullari soni: $3 \times 2 \times 1 = 6$ ta.
""",
        "tutorial": r"""\textbf{\Large Sehrli Sandiq Qulfi --- Tutorial}

\textbf{Mavzu:} Kombinatorika, Rekursiya / Dinamik dasturlash.

\textbf{Tahlil:}
Bu masala $n$ o'lchamli tsikl grafini ($C_n$) 3 ta rang bilan to'g'ri bo'yashlar sonini topishga tengdir (graf xromatik ko'phadi).
1-katakni ixtiyoriy 3 ta raqam bilan to'ldirish mumkin.
Chiziqli qatorda qo'shnilar farqli bo'lishi uchun har bir keyingi katakka 2 ta variant bor: $3 \cdot 2^{n-1}$ ta usul.
Lekin bizda $n$-katak 1-katak bilan teng bo'lib qolmasligi kerak.
Rekursiv tahlil:
Agar 1- va $n$-kataklar teng bo'lsa, ularni bitta katakka birlashtirsak, $n-1$ uzunlikdagi to'g'ri tsikl hosil bo'ladi.
Demak:
\[ f(n) = 3 \cdot 2^{n-1} - f(n-1) \]
Boshlang'ich holat: $f(2) = 3 \times 2 = 6$.
Buning yopiq formulasi:
\[ f(n) = 2^n + 2 \cdot (-1)^n \pmod{10^9+7} \]

Vaqt murakkabligi: $O(N)$ rekursiya/DP bilan yoki $O(\log N)$ darajaga ko'tarish orqali.
Xotira murakkabligi: $O(1)$.
""",
        "validator": r"""#include "testlib.h"

int main(int argc, char* argv[]) {
    registerValidation(argc, argv);
    inf.readInt(2, 100'000, "n");
    inf.readEoln();
    inf.readEof();
    return 0;
}
""",
        "acc": r"""#include <bits/stdc++.h>
using namespace std;

const long long MOD = 1'000'000'007;

void solve() {
    int n;
    if (!(cin >> n)) return;
    long long p2 = 1;
    for (int i = 0; i < n; i++) {
        p2 = (p2 * 2) % MOD;
    }
    long long ans;
    if (n % 2 == 0) {
        ans = (p2 + 2) % MOD;
    } else {
        ans = (p2 - 2 + MOD) % MOD;
    }
    cout << ans << "\n";
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int test_cases = 1;
    while (test_cases--) {
        solve();
    }
    return 0;
}
""",
        "acc_java": r"""import java.util.Scanner;

public class acc_java {
    static Scanner in = new Scanner(System.in);
    static final long MOD = 1000000007L;

    static void solve() {
        if (!in.hasNextInt()) return;
        int n = in.nextInt();
        long p2 = 1;
        for (int i = 0; i < n; i++) {
            p2 = (p2 * 2) % MOD;
        }
        long ans;
        if (n % 2 == 0) {
            ans = (p2 + 2) % MOD;
        } else {
            ans = (p2 - 2 + MOD) % MOD;
        }
        System.out.println(ans);
    }

    public static void main(String[] args) {
        solve();
    }
}
""",
        "acc_alt": r"""#include <bits/stdc++.h>
using namespace std;

const long long MOD = 1'000'000'007;

void solve() {
    int n;
    if (!(cin >> n)) return;
    long long same = 3; // number of ways where 1 and i have the same color
    long long diff = 0; // number of ways where 1 and i have different colors
    for (int i = 2; i <= n; i++) {
        long long next_same = diff;
        long long next_diff = (same * 2 + diff) % MOD;
        same = next_same % MOD;
        diff = next_diff % MOD;
    }
    cout << diff << "\n";
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    solve();
    return 0;
}
""",
        "brute": r"""#include <bits/stdc++.h>
using namespace std;

int ans_brute = 0;
int n_val;
vector<int> col;

void dfs(int idx) {
    if (idx == n_val) {
        if (col[idx - 1] != col[0]) ans_brute++;
        return;
    }
    for (int c = 1; c <= 3; c++) {
        if (idx == 0 || c != col[idx - 1]) {
            col[idx] = c;
            dfs(idx + 1);
        }
    }
}

void solve() {
    if (!(cin >> n_val)) return;
    col.resize(n_val);
    ans_brute = 0;
    dfs(0);
    cout << ans_brute << "\n";
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    solve();
    return 0;
}
""",
        "wa": r"""#include <bits/stdc++.h>
using namespace std;

const long long MOD = 1'000'000'007;

void solve() {
    int n;
    if (!(cin >> n)) return;
    // Bug: calculates 3 * 2^(n-1) ignoring circular boundary
    long long ans = 3;
    for (int i = 1; i < n; i++) {
        ans = (ans * 2) % MOD;
    }
    cout << ans << "\n";
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    solve();
    return 0;
}
""",
        "generator": r"""#include "testlib.h"
#include <bits/stdc++.h>
using namespace std;

int main(int argc, char* argv[]) {
    registerGen(argc, argv, 1);
    int n = opt<int>("n", 10);
    println(n);
    return 0;
}

/*
FreeMarker script example:
Executable name must match this file's base name: generator

generator -n 2 > $
generator -n 3 > $
generator -n 4 > $
generator -n 5 > $
generator -n 10 1 > $
generator -n 100 2 > $
generator -n 1000 3 > $
generator -n 100000 4 > $
*/
""",
        "samples": [
            ("3\n", "6\n")
        ],
        "validator_tests": [
            ("valid_min.in", "2\n", True),
            ("valid_max.in", "100000\n", True),
            ("invalid_one.in", "1\n", False),
            ("invalid_zero.in", "0\n", False),
            ("invalid_too_big.in", "100001\n", False),
        ]
    }
]
