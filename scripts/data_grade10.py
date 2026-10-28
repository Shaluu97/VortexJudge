"""Data for Grade 10 contest problems (A, B, C, D, E)."""

PROBLEMS_10 = [
    {
        "name": "grade10_a_farhod_ariqlari",
        "title": "Farhodning Tog' Ariqlari",
        "points": 7,
        "difficulty": 900,
        "tags": "ad-hoc, greedy, arrays",
        "stress_args": "-n 20 -max-val 50",
        "statement": r"""\textbf{\Large Farhodning Tog' Ariqlari}

Farhod xalqqa tog'dan suv keltirish uchun $n$ ta ketma-ket nuqtadan iborat ariq qazimoqda. Dastlab $i$-nuqtadagi chuqurlik $h_i$ metrga teng.

Suv tog'dan qiyalik bo'ylab to'xtovsiz va ravon oqishi uchun ariq chuqurligi kamaymaydigan bo'lishi kerak, ya'ni har bir $i > 1$ uchun $h_i \geq h_{i-1}$ sharti bajarilishi lozim.

Farhod faqat ketmon bilan yer qazib, nuqtalarning chuqurligini oshira oladi (mavjud chuqurlikni kamaytirishning iloji yo'q). 

Suv to'siqsiz oqishi uchun Farhod jami kamida necha metr qo'shimcha chuqurlik qazishi kerak?

\textbf{Input}

Birinchi qatorda bitta butun son $n$ ($1 \leq n \leq 100'000$)~--- ariq bo'ylab nuqtalar soni.

Ikkinchi qatorda $n$ ta butun son $h_1, h_2, \ldots, h_n$ ($1 \leq h_i \leq 10^9$)~--- dastlabki chuqurliklar.

\textbf{Output}

Bitta butun son~--- qazilishi lozim bo'lgan minimal umumiy qo'shimcha chuqurlikni chiqaring.

\textbf{Notes}

Namunada dastlabki chuqurliklar $[3, 2, 5, 1, 7]$:
\begin{itemize}
    \item $h_2 = 2$ ni $3$ ga oshirish uchun $1$ metr qaziladi ($h_2 = 3$).
    \item $h_4 = 1$ ni $5$ ga oshirish uchun $4$ metr qaziladi ($h_4 = 5$).
\end{itemize}
Qolgan nuqtalarni o'zgartirish shart emas. Jami $1 + 4 = 5$ metr qaziladi.
""",
        "tutorial": r"""\textbf{\Large Farhodning Tog' Ariqlari --- Tutorial}

\textbf{Mavzu:} Ad-hoc, massiv bo'ylab $O(N)$ yugurish, ochko'z (greedy) yondashuv.

\textbf{Tahlil:}
Kamaymaydigan ketma-ketlik hosil qilish uchun, har bir qadamda $h_i$ kamida $h_{i-1}$ ga teng bo'lishi kerak.
Biz qo'shimcha chuqurlikni minimallashtirmoqchimiz, shuning uchun $h_i$ ni imkon qadar kichik, ya'ni $\max(h_i, h_{i-1})$ ga tenglashtiramiz.
Joriy maksimal chuqurlikni \texttt{cur\_max} o'zgaruvchisida saqlab boramiz:
Agar $h_i < \text{cur\_max}$ bo'lsa, javobga $\text{cur\_max} - h_i$ qo'shamiz.
Aks holda $\text{cur\_max} = h_i$ qilamiz.
Yig'indi $10^{14}$ gacha yetishi mumkin, shuning uchun 64-bitli \texttt{long long} kerak.

Vaqt murakkabligi: $O(N)$.
Xotira murakkabligi: $O(1)$ qo'shimcha xotira.
""",
        "validator": r"""#include "testlib.h"

int main(int argc, char* argv[]) {
    registerValidation(argc, argv);
    int n = inf.readInt(1, 100'000, "n");
    inf.readEoln();
    for (int i = 0; i < n; i++) {
        if (i > 0) inf.readSpace();
        inf.readInt(1, 1'000'000'000, "h_i");
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
    long long ans = 0;
    long long cur_max = 0;
    for (int i = 0; i < n; i++) {
        long long h;
        cin >> h;
        if (h < cur_max) {
            ans += cur_max - h;
        } else {
            cur_max = h;
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
        "acc_java": r"""import java.util.Scanner;

public class acc_java {
    static Scanner in = new Scanner(System.in);

    static void solve() {
        if (!in.hasNextInt()) return;
        int n = in.nextInt();
        long ans = 0;
        long curMax = 0;
        for (int i = 0; i < n; i++) {
            long h = in.nextLong();
            if (h < curMax) {
                ans += curMax - h;
            } else {
                curMax = h;
            }
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
    int n;
    if (!(cin >> n)) return;
    vector<long long> h(n);
    for (int i = 0; i < n; i++) cin >> h[i];
    long long cost = 0;
    for (int i = 1; i < n; i++) {
        if (h[i] < h[i - 1]) {
            cost += h[i - 1] - h[i];
            h[i] = h[i - 1];
        }
    }
    cout << cost << "\n";
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
    int n;
    if (!(cin >> n)) return;
    vector<long long> h(n);
    for (int i = 0; i < n; i++) cin >> h[i];
    long long ans = 0;
    for (int i = 1; i < n; i++) {
        while (h[i] < h[i - 1]) {
            h[i]++;
            ans++;
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
    int n;
    if (!(cin >> n)) return;
    vector<long long> h(n);
    for (int i = 0; i < n; i++) cin >> h[i];
    // Bug: int overflow
    int ans = 0;
    for (int i = 1; i < n; i++) {
        if (h[i] < h[i - 1]) {
            ans += (int)(h[i - 1] - h[i]);
            h[i] = h[i - 1];
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
    int max_val = opt<int>("max-val", 100);
    string type = opt<string>("type", "random");

    println(n);
    vector<int> h(n);
    if (type == "sorted") {
        for (int i = 0; i < n; i++) h[i] = i + 1;
    } else if (type == "rev") {
        for (int i = 0; i < n; i++) h[i] = n - i;
    } else {
        for (int i = 0; i < n; i++) h[i] = rnd.next(1, max_val);
    }
    println(h);
    return 0;
}

/*
FreeMarker script example:
Executable name must match this file's base name: generator

generator -n 1 -max-val 1 > $
generator -n 5 -max-val 10 -type sorted > $
generator -n 5 -max-val 10 -type rev > $
generator -n 10 -max-val 100 -type random 1 > $
generator -n 100 -max-val 1000 -type random 2 > $
generator -n 100000 -max-val 1000000000 -type rev > $
generator -n 100000 -max-val 1000000000 -type random 3 > $
*/
""",
        "samples": [
            ("5\n3 2 5 1 7\n", "5\n")
        ],
        "validator_tests": [
            ("valid_min.in", "1\n1\n", True),
            ("valid_max.in", "2\n1000000000 1000000000\n", True),
            ("invalid_zero.in", "2\n0 1\n", False),
            ("invalid_n_zero.in", "0\n\n", False),
            ("invalid_too_big.in", "1\n1000000001\n", False),
        ]
    },
    {
        "name": "grade10_b_semurh_tilsimi",
        "title": "Semurg' Qushining Tilsimi",
        "points": 7,
        "difficulty": 1100,
        "tags": "number-theory, modular-arithmetic, math",
        "stress_args": "-max-m 50",
        "statement": r"""\textbf{\Large Semurg' Qushining Tilsimi}

Semurg' qushi botirga dushman darvozasini ochish uchun tilsimli formula berdi. 

Tilsim uchta butun son $a, b, m$ ga asoslangan bo'lib, bu yerda $m$ har doim \textbf{tub son} hisoblanadi.

Botir darvozani ochish uchun quyidagi ikki qiymatni hisoblashi kerak:
\begin{enumerate}
    \item $a^b \pmod m$~--- darajaning modul bo'yicha qoldig'i.
    \item $a^{-1} \pmod m$~--- $a$ sonining $m$ moduli bo'yicha ko'paytirishga teskarisi, ya'ni $a \cdot x \equiv 1 \pmod m$ shartni qanoatlantiruvchi $1 \leq x < m$ butun soni.
\end{enumerate}

\textbf{Input}

Bitta qatorda uchta butun son $a, b, m$ ($1 \leq a, b < m \leq 10^9+7$, $m$ tub son) beriladi.

\textbf{Output}

Bitta qatorda ikkita butun son~--- $a^b \pmod m$ va $a^{-1} \pmod m$ qiymatlarini bitta probel bilan ajratib chiqaring.

\textbf{Notes}

Namunada $a = 3, b = 5, m = 7$.
\begin{itemize}
    \item $3^5 = 243$. $243 = 34 \times 7 + 5$, demak $3^5 \equiv 5 \pmod 7$.
    \item $3 \times 5 = 15 = 2 \times 7 + 1 \equiv 1 \pmod 7$. Demak $3$ ning $7$ bo'yicha teskarisi $5$.
\end{itemize}
""",
        "tutorial": r"""\textbf{\Large Semurg' Qushining Tilsimi --- Tutorial}

\textbf{Mavzu:} Raqamlar nazariyasi, ikkilik darajaga ko'tarish (Binary Exponentiation), Ferma kichik teoremasi.

\textbf{Tahlil:}
1. $a^b \pmod m$ qiymatini tezkor darajaga ko'tarish algoritmi (Binary Exponentiation) orqali $O(\log b)$ vaqtda hisoblaymiz.
2. Ferma kichik teoremasiga ko'ra, agar $m$ tub son va $\gcd(a, m) = 1$ bo'lsa:
   \[ a^{m-1} \equiv 1 \pmod m \implies a \cdot a^{m-2} \equiv 1 \pmod m \]
   Demak, $a$ ning modulli teskarisi aynan $a^{m-2} \pmod m$ ga teng!
   Buni ham ikkilik darajaga ko'tarish orqali $O(\log m)$ vaqtda topamiz.

Vaqt murakkabligi: $O(\log b + \log m)$.
Xotira murakkabligi: $O(1)$.
""",
        "validator": r"""#include "testlib.h"

bool is_prime(int n) {
    if (n < 2) return false;
    for (int d = 2; 1LL * d * d <= n; d++) {
        if (n % d == 0) return false;
    }
    return true;
}

int main(int argc, char* argv[]) {
    registerValidation(argc, argv);
    int a = inf.readInt(1, 1'000'000'007, "a");
    inf.readSpace();
    int b = inf.readInt(1, 1'000'000'007, "b");
    inf.readSpace();
    int m = inf.readInt(2, 1'000'000'007, "m");
    inf.readEoln();
    inf.readEof();
    ensuref(a < m, "a must be less than m");
    ensuref(b < m, "b must be less than m");
    ensuref(is_prime(m), "m must be prime");
    return 0;
}
""",
        "acc": r"""#include <bits/stdc++.h>
using namespace std;

long long binpow(long long base, long long exp, long long mod) {
    long long res = 1;
    base %= mod;
    while (exp > 0) {
        if (exp % 2 == 1) res = (__int128)res * base % mod;
        base = (__int128)base * base % mod;
        exp /= 2;
    }
    return res;
}

void solve() {
    long long a, b, m;
    if (!(cin >> a >> b >> m)) return;
    long long p = binpow(a, b, m);
    long long inv = binpow(a, m - 2, m);
    cout << p << " " << inv << "\n";
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

    static long binpow(long base, long exp, long mod) {
        long res = 1;
        base %= mod;
        while (exp > 0) {
            if (exp % 2 == 1) res = (res * base) % mod;
            base = (base * base) % mod;
            exp /= 2;
        }
        return res;
    }

    static void solve() {
        if (!in.hasNextLong()) return;
        long a = in.nextLong();
        long b = in.nextLong();
        long m = in.nextLong();
        long p = binpow(a, b, m);
        long inv = binpow(a, m - 2, m);
        System.out.println(p + " " + inv);
    }

    public static void main(String[] args) {
        solve();
    }
}
""",
        "acc_alt": r"""#include <bits/stdc++.h>
using namespace std;

long long extgcd(long long a, long long b, long long &x, long long &y) {
    if (b == 0) {
        x = 1;
        y = 0;
        return a;
    }
    long long x1, y1;
    long long d = extgcd(b, a % b, x1, y1);
    x = y1;
    y = x1 - y1 * (a / b);
    return d;
}

long long power(long long a, long long b, long long m) {
    long long res = 1;
    while (b > 0) {
        if (b & 1) res = (res * a) % m;
        a = (a * a) % m;
        b >>= 1;
    }
    return res;
}

void solve() {
    long long a, b, m;
    if (!(cin >> a >> b >> m)) return;
    long long p = power(a, b, m);
    long long x, y;
    extgcd(a, m, x, y);
    x = (x % m + m) % m;
    cout << p << " " << x << "\n";
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
    long long a, b, m;
    if (!(cin >> a >> b >> m)) return;
    long long p = 1;
    for (int i = 0; i < b; i++) {
        p = (p * a) % m;
    }
    long long inv = -1;
    for (long long x = 1; x < m; x++) {
        if ((a * x) % m == 1) {
            inv = x;
            break;
        }
    }
    cout << p << " " << inv << "\n";
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
    long long a, b, m;
    if (!(cin >> a >> b >> m)) return;
    // Bug: forgets to mod intermediate product, causes overflow / wrong answer
    long long p = 1;
    for (int i = 0; i < b; i++) p *= a;
    cout << (p % m) << " " << 1 << "\n";
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

bool is_prime(int n) {
    if (n < 2) return false;
    for (int d = 2; 1LL * d * d <= n; d++) {
        if (n % d == 0) return false;
    }
    return true;
}

int next_prime(int n) {
    while (!is_prime(n)) n++;
    return n;
}

int main(int argc, char* argv[]) {
    registerGen(argc, argv, 1);
    int m_max = opt<int>("max-m", 1'000'000'007);
    int m = opt<int>("m", 0);
    if (m == 0) {
        int cand = rnd.next(3, m_max);
        m = next_prime(cand);
    }
    int a = rnd.next(1, m - 1);
    int b = rnd.next(1, m - 1);
    println(a, b, m);
    return 0;
}

/*
FreeMarker script example:
Executable name must match this file's base name: generator

generator -m 3 > $
generator -m 5 > $
generator -m 7 > $
generator -m 11 > $
generator -m 1000000007 1 > $
generator -max-m 100 2 > $
generator -max-m 10000 3 > $
generator -max-m 1000000 4 > $
*/
""",
        "samples": [
            ("3 5 7\n", "5 5\n")
        ],
        "validator_tests": [
            ("valid_min.in", "1 1 3\n", True),
            ("valid_sample.in", "3 5 7\n", True),
            ("valid_max.in", "1000000000 1000000000 1000000007\n", True),
            ("invalid_not_prime.in", "2 3 4\n", False),
            ("invalid_a_ge_m.in", "5 2 5\n", False),
        ]
    },
    {
        "name": "grade10_c_uch_ogayni_kamoni",
        "title": "Uch Og'a-Ini Botir va Qo'riqchi Postlari",
        "points": 10,
        "difficulty": 1300,
        "tags": "binary-search, greedy, sorting",
        "stress_args": "-n 20 -k 4 -max-x 100",
        "statement": r"""\textbf{\Large Uch Og'a-Ini Botir va Qo'riqchi Postlari}

Saltanat chegarasidagi to'g'ri chiziqli yo'l bo'ylab $n$ ta qulay tepalik joylashgan. Ularning koordinatalari $x_1, x_2, \ldots, x_n$.

Uch og'a-ini botirlar chegarani ishonchli qo'riqlash uchun ushbu tepaliklarning aynan $k$ tasiga qo'riqchi minoralarini o'rnatmoqchi. Kamonchilar bir-biriga xalaqit bermasligi va hudud maksimal darajada nazoratda bo'lishi uchun, har qanday ikkita qo'shni qo'riqchi minorasi orasidagi masofalarning \textbf{eng kichigi iloji boricha katta (maksimal)} bo'lishi talab etiladi.

Tanlangan $k$ ta minora orasidagi minimal masofaning mumkin bo'lgan eng katta qiymatini toping.

\textbf{Input}

Birinchi qatorda ikkita butun son $n$ va $k$ ($2 \leq k \leq n \leq 100'000$)~--- tepaliklar soni va qurilishi kerak bo'lgan minoralar soni.

Ikkinchi qatorda $n$ ta butun son $x_1, x_2, \ldots, x_n$ ($1 \leq x_i \leq 10^9$)~--- tepaliklar koordinatalari. Barcha $x_i$ koordinatalar har xil.

\textbf{Output}

Bitta butun son~--- qo'shni minoralar orasidagi minimal masofaning mumkin bo'lgan eng katta qiymatini chiqaring.

\textbf{Notes}

Tepaliklar tartiblansa: $[1, 2, 4, 8, 9]$.
Biz $k = 3$ ta minora qurishimiz kerak. Agar $1, 4, 8$ nuqtalarga qursak, masofalar: $|4 - 1| = 3$ va $|8 - 4| = 4$. Minimal masofa: $\min(3, 4) = 3$.
Bundan katta minimal masofaga erishib bo'lmaydi.
""",
        "tutorial": r"""\textbf{\Large Uch Og'a-Ini Botir va Qo'riqchi Postlari --- Tutorial}

\textbf{Mavzu:} Ikkilik qidiruv (Binary Search on Answer) va Ochko'z saralash.

\textbf{Tahlil:}
Bu klassik "Aggressive cows" masalasidir.
1. Dastlab $x$ massivini o'sish tartibida saralaymiz.
2. Javob $D$ (minimal masofa) bo'yicha ikkilik qidiruv (binary search) qilamiz:
   Oraliq: $L = 1$, $R = x_n - x_1$.
3. Berilgan $D$ masofa uchun $k$ ta minorani joylashtirish mumkinligini tekshirish (\texttt{check(D)}):
   - 1-minorani $x_1$ ga qo'yamiz.
   - Har bir keyingi minorani oxirgi qo'yilgan minoradan kamida $D$ masofada joylashgan eng yaqin tepalikka qo'yamiz.
   - Agar jami joylashgan minoralar soni $\geq k$ bo'lsa, demak $D$ masofaga erishish mumkin.
   Ushbu tekshirish $O(N)$ vaqt oladi.
4. Agar mumkin bo'lsa, $L = D + 1$ qilib kattaroq masofani tekshiramiz, aks holda $R = D - 1$.

Vaqt murakkabligi: $O(N \log N + N \log(\max X))$.
Xotira murakkabligi: $O(N)$.
""",
        "validator": r"""#include "testlib.h"
#include <set>

int main(int argc, char* argv[]) {
    registerValidation(argc, argv);
    int n = inf.readInt(2, 100'000, "n");
    inf.readSpace();
    inf.readInt(2, n, "k");
    inf.readEoln();
    std::set<int> seen;
    for (int i = 0; i < n; i++) {
        if (i > 0) inf.readSpace();
        int x = inf.readInt(1, 1'000'000'000, "x_i");
        ensuref(seen.find(x) == seen.end(), "Coordinates must be unique");
        seen.insert(x);
    }
    inf.readEoln();
    inf.readEof();
    return 0;
}
""",
        "acc": r"""#include <bits/stdc++.h>
using namespace std;

bool can_place(const vector<int>& x, int k, int d) {
    int count = 1;
    int last = x[0];
    for (size_t i = 1; i < x.size(); i++) {
        if (x[i] - last >= d) {
            count++;
            last = x[i];
        }
    }
    return count >= k;
}

void solve() {
    int n, k;
    if (!(cin >> n >> k)) return;
    vector<int> x(n);
    for (int i = 0; i < n; i++) cin >> x[i];
    sort(x.begin(), x.end());
    int low = 1, high = x.back() - x.front();
    int ans = 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (can_place(x, k, mid)) {
            ans = mid;
            low = mid + 1;
        } else {
            high = mid - 1;
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
        "acc_java": r"""import java.util.Arrays;
import java.util.Scanner;

public class acc_java {
    static Scanner in = new Scanner(System.in);

    static boolean canPlace(int[] x, int k, int d) {
        int count = 1;
        int last = x[0];
        for (int i = 1; i < x.length; i++) {
            if (x[i] - last >= d) {
                count++;
                last = x[i];
            }
        }
        return count >= k;
    }

    static void solve() {
        if (!in.hasNextInt()) return;
        int n = in.nextInt();
        int k = in.nextInt();
        int[] x = new int[n];
        for (int i = 0; i < n; i++) x[i] = in.nextInt();
        Arrays.sort(x);
        int low = 1, high = x[n - 1] - x[0];
        int ans = 1;
        while (low <= high) {
            int mid = low + (high - low) / 2;
            if (canPlace(x, k, mid)) {
                ans = mid;
                low = mid + 1;
            } else {
                high = mid - 1;
            }
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
    int n, k;
    if (!(cin >> n >> k)) return;
    vector<int> x(n);
    for (int i = 0; i < n; i++) cin >> x[i];
    sort(x.begin(), x.end());
    auto check = [&](int dist) -> bool {
        int placed = 1;
        int prev = x[0];
        for (int i = 1; i < n; i++) {
            if (x[i] - prev >= dist) {
                placed++;
                prev = x[i];
                if (placed >= k) return true;
            }
        }
        return placed >= k;
    };
    int l = 1, r = 1e9 + 7;
    int res = 1;
    while (l <= r) {
        int m = l + (r - l) / 2;
        if (check(m)) {
            res = m;
            l = m + 1;
        } else {
            r = m - 1;
        }
    }
    cout << res << "\n";
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
    int n, k;
    if (!(cin >> n >> k)) return;
    vector<int> x(n);
    for (int i = 0; i < n; i++) cin >> x[i];
    sort(x.begin(), x.end());
    int max_d = x.back() - x.front();
    int best = 1;
    for (int d = 1; d <= max_d; d++) {
        int count = 1;
        int last = x[0];
        for (int i = 1; i < n; i++) {
            if (x[i] - last >= d) {
                count++;
                last = x[i];
            }
        }
        if (count >= k) best = d;
    }
    cout << best << "\n";
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
    int n, k;
    if (!(cin >> n >> k)) return;
    vector<int> x(n);
    for (int i = 0; i < n; i++) cin >> x[i];
    sort(x.begin(), x.end());
    // Bug: returns average distance instead of binary search result
    int d = (x.back() - x.front()) / (k - 1);
    cout << d << "\n";
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
    int k = opt<int>("k", 3);
    int max_x = opt<int>("max-x", 100);

    println(n, k);
    set<int> st;
    while ((int)st.size() < n) {
        st.insert(rnd.next(1, max_x));
    }
    vector<int> v(st.begin(), st.end());
    shuffle(v.begin(), v.end());
    println(v);
    return 0;
}

/*
FreeMarker script example:
Executable name must match this file's base name: generator

generator -n 2 -k 2 -max-x 5 > $
generator -n 5 -k 3 -max-x 20 > $
generator -n 10 -k 4 -max-x 100 1 > $
generator -n 50 -k 10 -max-x 1000 2 > $
generator -n 1000 -k 100 -max-x 1000000 3 > $
generator -n 100000 -k 50000 -max-x 1000000000 4 > $
*/
""",
        "samples": [
            ("5 3\n1 2 8 4 9\n", "3\n")
        ],
        "validator_tests": [
            ("valid_min.in", "2 2\n1 2\n", True),
            ("valid_max.in", "3 2\n1 500000000 1000000000\n", True),
            ("invalid_k_exceeds.in", "3 4\n1 2 3\n", False),
            ("invalid_duplicate.in", "3 2\n1 2 2\n", False),
            ("invalid_k_one.in", "2 1\n1 2\n", False),
        ]
    },
    {
        "name": "grade10_d_sehrli_gilam_sayohati",
        "title": "Sehrli Gilam va Labirint",
        "points": 10,
        "difficulty": 1200,
        "tags": "dp, grid",
        "stress_args": "-n 10 -m 10 -max-val 50",
        "statement": r"""\textbf{\Large Sehrli Gilam va Labirint}

Alpomish sehrli gilamda yer osti labirinti ustidan uchib o'tmoqda. Labirint $n \times m$ katakli to'g'ri to'rtburchakdan iborat. Har bir $(i, j)$ katakda sehrli toshlar bo'lib, gilam ushbu katakka qadam qo'yganda $a_{i, j}$ birlik energiya sarflaydi.

Gilam faqat \textbf{o'ngga} ($(i, j+1)$) yoki \textbf{pastga} ($(i+1, j)$) harakatlana oladi.

Gilam yuqori chap burchakdagi $(1, 1)$ katakdan boshlab, quyi o'ng burchakdagi $(n, m)$ katakka yetib borishi uchun sarflanadigan \textbf{minimal umumiy energiyani} hisoblang.

\textbf{Input}

Birinchi qatorda ikkita butun son $n$ va $m$ ($1 \leq n, m \leq 1'000$)~--- labirint o'lchamlari.

Keyingi $n$ ta qatorda $m$ tadan butun son $a_{i, j}$ ($1 \leq a_{i, j} \leq 10^6$)~--- har bir katakdagi energiya sarfi.

\textbf{Output}

Bitta butun son~--- $(1, 1)$ dan $(n, m)$ katakka borishdagi minimal umumiy energiya sarfini chiqaring.

\textbf{Notes}

$3 \times 3$ jadvalda optimal yo'l: $(1, 1) \to (1, 2) \to (1, 3) \to (2, 3) \to (3, 3)$.
Jami energiya: $1 + 3 + 1 + 1 + 1 = 7$.
""",
        "tutorial": r"""\textbf{\Large Sehrli Gilam va Labirint --- Tutorial}

\textbf{Mavzu:} 2D Jadval (Grid) bo'ylab Dinamik dasturlash.

\textbf{Tahlil:}
$dp[i][j]$~--- $(1, 1)$ katakdan $(i, j)$ katakka yetib borishdagi minimal energiya sarfi.
Gilam $(i, j)$ katakka faqat yuqoridan ($(i-1, j)$) yoki chapdan ($(i, j-1)$) kelishi mumkin.
O'tish formulasi:
\[ dp[i][j] = a_{i, j} + \min(dp[i-1][j], dp[i][j-1]) \]
Boshlang'ich holat: $dp[1][1] = a_{1, 1}$.
Birinchi qator uchun faqat chapdan, birinchi ustun uchun faqat yuqoridan kelish mumkin.

Vaqt murakkabligi: $O(N \cdot M)$. $1000 \times 1000$ jadval uchun $10^6$ operatsiya talab etiladi.
Xotira murakkabligi: $O(M)$ xotira (oldingi qator natijalarini saqlash orqali).
""",
        "validator": r"""#include "testlib.h"

int main(int argc, char* argv[]) {
    registerValidation(argc, argv);
    int n = inf.readInt(1, 1'000, "n");
    inf.readSpace();
    int m = inf.readInt(1, 1'000, "m");
    inf.readEoln();
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < m; j++) {
            if (j > 0) inf.readSpace();
            inf.readInt(1, 1'000'000, "a_ij");
        }
        inf.readEoln();
    }
    inf.readEof();
    return 0;
}
""",
        "acc": r"""#include <bits/stdc++.h>
using namespace std;

void solve() {
    int n, m;
    if (!(cin >> n >> m)) return;
    vector<vector<long long>> a(n, vector<long long>(m));
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < m; j++) {
            cin >> a[i][j];
        }
    }
    vector<long long> dp(m, 0);
    dp[0] = a[0][0];
    for (int j = 1; j < m; j++) {
        dp[j] = dp[j - 1] + a[0][j];
    }
    for (int i = 1; i < n; i++) {
        dp[0] += a[i][0];
        for (int j = 1; j < m; j++) {
            dp[j] = a[i][j] + min(dp[j], dp[j - 1]);
        }
    }
    cout << dp[m - 1] << "\n";
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
        int m = in.nextInt();
        long[] dp = new long[m];
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < m; j++) {
                long val = in.nextLong();
                if (i == 0 && j == 0) {
                    dp[j] = val;
                } else if (i == 0) {
                    dp[j] = dp[j - 1] + val;
                } else if (j == 0) {
                    dp[j] = dp[j] + val;
                } else {
                    dp[j] = val + Math.min(dp[j], dp[j - 1]);
                }
            }
        }
        System.out.println(dp[m - 1]);
    }

    public static void main(String[] args) {
        solve();
    }
}
""",
        "acc_alt": r"""#include <bits/stdc++.h>
using namespace std;

void solve() {
    int n, m;
    if (!(cin >> n >> m)) return;
    vector<vector<long long>> dp(n, vector<long long>(m, 0));
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < m; j++) {
            long long val;
            cin >> val;
            if (i == 0 && j == 0) dp[i][j] = val;
            else if (i == 0) dp[i][j] = dp[i][j - 1] + val;
            else if (j == 0) dp[i][j] = dp[i - 1][j] + val;
            else dp[i][j] = val + min(dp[i - 1][j], dp[i][j - 1]);
        }
    }
    cout << dp[n - 1][m - 1] << "\n";
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

int n_val, m_val;
vector<vector<long long>> grid;
long long best_res;

void dfs(int r, int c, long long current) {
    current += grid[r][c];
    if (r == n_val - 1 && c == m_val - 1) {
        best_res = min(best_res, current);
        return;
    }
    if (r + 1 < n_val) dfs(r + 1, c, current);
    if (c + 1 < m_val) dfs(r, c + 1, current);
}

void solve() {
    if (!(cin >> n_val >> m_val)) return;
    grid.assign(n_val, vector<long long>(m_val));
    for (int i = 0; i < n_val; i++) {
        for (int j = 0; j < m_val; j++) {
            cin >> grid[i][j];
        }
    }
    best_res = 1e18;
    dfs(0, 0, 0);
    cout << best_res << "\n";
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
    int n, m;
    if (!(cin >> n >> m)) return;
    vector<vector<long long>> a(n, vector<long long>(m));
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < m; j++) cin >> a[i][j];
    }
    // Bug: greedy local choice instead of global dynamic programming
    int r = 0, c = 0;
    long long ans = a[0][0];
    while (r < n - 1 || c < m - 1) {
        if (r == n - 1) {
            c++;
        } else if (c == m - 1) {
            r++;
        } else {
            if (a[r + 1][c] < a[r][c + 1]) r++;
            else c++;
        }
        ans += a[r][c];
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
    int n = opt<int>("n", 3);
    int m = opt<int>("m", 3);
    int max_val = opt<int>("max-val", 10);

    println(n, m);
    for (int i = 0; i < n; i++) {
        vector<int> row(m);
        for (int j = 0; j < m; j++) {
            row[j] = rnd.next(1, max_val);
        }
        println(row);
    }
    return 0;
}

/*
FreeMarker script example:
Executable name must match this file's base name: generator

generator -n 1 -m 1 -max-val 1 > $
generator -n 3 -m 3 -max-val 10 > $
generator -n 10 -m 10 -max-val 100 1 > $
generator -n 50 -m 50 -max-val 1000 2 > $
generator -n 500 -m 500 -max-val 100000 3 > $
generator -n 1000 -m 1000 -max-val 1000000 4 > $
*/
""",
        "samples": [
            ("3 3\n1 3 1\n1 5 1\n4 2 1\n", "7\n")
        ],
        "validator_tests": [
            ("valid_min.in", "1 1\n5\n", True),
            ("valid_max.in", "2 2\n1000000 1000000\n1000000 1000000\n", True),
            ("invalid_zero.in", "1 1\n0\n", False),
            ("invalid_n_zero.in", "0 1\n", False),
            ("invalid_too_big.in", "1 1\n1000001\n", False),
        ]
    },
    {
        "name": "grade10_e_ajdaho_shaharlari",
        "title": "Yetti Boshli Ajdaho Saltanati",
        "points": 16,
        "difficulty": 1500,
        "tags": "graphs, shortest-paths, dijkstra",
        "stress_args": "-n 15 -m 25 -max-w 100",
        "statement": r"""\textbf{\Large Yetti Boshli Ajdaho Saltanati}

Sehrli diyor $n$ ta shahar va ularni tutashtiruvchi $m$ ta ikki tomonlama yo'ldan iborat. Shaharlar $1$ dan $n$ gacha raqamlangan. 

Har bir $i$-yo'l $u_i$ va $v_i$ shaharlarni bog'laydi. Yo'ldan o'tish ajdaho xavfi sababli botirdan $w_i$ birlik charchoq talab qiladi.

Botir poytaxt hisoblangan $1$-shahardan chiqib, $n$-shaharda joylashgan ajdaho qasrini zabt etish uchun yo'lga chiqadi. Shaharlararo graf bog'langan bo'lib, har doim $1$-shahardan $n$-shaharga borish mumkin.

1-shahardan $n$-shaharga yetib borish uchun sarflanadigan \textbf{minimal umumiy charchoq miqdorini} hisoblang.

\textbf{Input}

Birinchi qatorda ikkita butun son $n$ va $m$ ($1 \leq n \leq 100'000, 1 \leq m \leq 200'000$)~--- shaharlar soni va yo'llar soni.

Keyingi $m$ ta qatorda uchtadan butun son $u_i, v_i, w_i$ ($1 \leq u_i, v_i \leq n, u_i \neq v_i, 1 \leq w_i \leq 10^9$)~--- yo'l tutashtirgan shaharlar va yo'l og'irligi.

\textbf{Output}

Bitta butun son~--- 1-shahardan $n$-shaharga eng qisqa (minimal og'irlikdagi) yo'l qiymatini chiqaring.

\textbf{Notes}

$1 \to 3 \to 4$ yo'li: charchoq $1 + 3 = 4$.
$1 \to 2 \to 4$ yo'li: charchoq $2 + 5 = 7$.
Minimal umumiy charchoq 4 ga teng.
""",
        "tutorial": r"""\textbf{\Large Yetti Boshli Ajdaho Saltanati --- Tutorial}

\textbf{Mavzu:} Graflar nazariyasi, musbat og'irlikdagi eng qisqa yo'l (Deykstra algoritmi).

\textbf{Tahlil:}
Bu musbat vaznli yo'llarga ega grafda eng qisqa yo'lni topish masalasidir.
Bunda Deykstra (Dijkstra) algoritmidan \texttt{std::priority\_queue} (min-heap) yordamida foydalanamiz:
1. $dist[1] = 0$, qolgan barcha shaharlar uchun $dist[v] = \infty$.
2. Navbatga $(0, 1)$ juftligini qo'shamiz.
3. Navbatdan minimal masofali $(d, u)$ cho'qqini olamiz. Agar $d > dist[u]$ bo'lsa, davom etamiz.
4. $u$ ning barcha qo'shnilari $v$ uchun relaksatsiya bajaramiz:
   agar $dist[u] + w < dist[v]$ bo'lsa, $dist[v] = dist[u] + w$ qilib navbatga solamiz.
Masofalar yig'indisi $2 \cdot 10^{14}$ gacha yetishi mumkin, shuning uchun \texttt{long long} kerak.

Vaqt murakkabligi: $O(M \log N)$.
Xotira murakkabligi: $O(N + M)$.
""",
        "validator": r"""#include "testlib.h"

int main(int argc, char* argv[]) {
    registerValidation(argc, argv);
    int n = inf.readInt(1, 100'000, "n");
    inf.readSpace();
    int m = inf.readInt(1, 200'000, "m");
    inf.readEoln();
    for (int i = 0; i < m; i++) {
        int u = inf.readInt(1, n, "u_i");
        inf.readSpace();
        int v = inf.readInt(1, n, "v_i");
        inf.readSpace();
        ensuref(u != v, "Self loops not allowed");
        inf.readInt(1, 1'000'000'000, "w_i");
        inf.readEoln();
    }
    inf.readEof();
    return 0;
}
""",
        "acc": r"""#include <bits/stdc++.h>
using namespace std;

void solve() {
    int n, m;
    if (!(cin >> n >> m)) return;
    vector<vector<pair<int, long long>>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int u, v;
        long long w;
        cin >> u >> v >> w;
        adj[u].push_back({v, w});
        adj[v].push_back({u, w});
    }
    const long long INF = 1e18;
    vector<long long> dist(n + 1, INF);
    priority_queue<pair<long long, int>, vector<pair<long long, int>>, greater<pair<long long, int>>> pq;
    dist[1] = 0;
    pq.push({0, 1});
    while (!pq.empty()) {
        auto [d, u] = pq.top();
        pq.pop();
        if (d > dist[u]) continue;
        for (auto& edge : adj[u]) {
            int v = edge.first;
            long long w = edge.second;
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                pq.push({dist[v], v});
            }
        }
    }
    cout << dist[n] << "\n";
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
        "acc_java": r"""import java.util.*;

public class acc_java {
    static Scanner in = new Scanner(System.in);

    static class Edge {
        int to;
        long weight;
        Edge(int to, long weight) {
            this.to = to;
            this.weight = weight;
        }
    }

    static class Node implements Comparable<Node> {
        int u;
        long dist;
        Node(int u, long dist) {
            this.u = u;
            this.dist = dist;
        }
        public int compareTo(Node o) {
            return Long.compare(this.dist, o.dist);
        }
    }

    static void solve() {
        if (!in.hasNextInt()) return;
        int n = in.nextInt();
        int m = in.nextInt();
        List<List<Edge>> adj = new ArrayList<>();
        for (int i = 0; i <= n; i++) adj.add(new ArrayList<>());
        for (int i = 0; i < m; i++) {
            int u = in.nextInt();
            int v = in.nextInt();
            long w = in.nextLong();
            adj.get(u).add(new Edge(v, w));
            adj.get(v).add(new Edge(u, w));
        }
        long[] dist = new long[n + 1];
        Arrays.fill(dist, Long.MAX_VALUE / 2);
        PriorityQueue<Node> pq = new PriorityQueue<>();
        dist[1] = 0;
        pq.add(new Node(1, 0));
        while (!pq.isEmpty()) {
            Node cur = pq.poll();
            if (cur.dist > dist[cur.u]) continue;
            for (Edge e : adj.get(cur.u)) {
                if (dist[cur.u] + e.weight < dist[e.to]) {
                    dist[e.to] = dist[cur.u] + e.weight;
                    pq.add(new Node(e.to, dist[e.to]));
                }
            }
        }
        System.out.println(dist[n]);
    }

    public static void main(String[] args) {
        solve();
    }
}
""",
        "acc_alt": r"""#include <bits/stdc++.h>
using namespace std;

void solve() {
    int n, m;
    if (!(cin >> n >> m)) return;
    vector<vector<pair<int, int>>> adj(n + 1);
    for (int i = 0; i < m; i++) {
        int u, v, w;
        cin >> u >> v >> w;
        adj[u].push_back({v, w});
        adj[v].push_back({u, w});
    }
    vector<long long> d(n + 1, 1e18);
    set<pair<long long, int>> s;
    d[1] = 0;
    s.insert({0, 1});
    while (!s.empty()) {
        int u = s.begin()->second;
        s.erase(s.begin());
        for (auto& edge : adj[u]) {
            int to = edge.first;
            int len = edge.second;
            if (d[u] + len < d[to]) {
                s.erase({d[to], to});
                d[to] = d[u] + len;
                s.insert({d[to], to});
            }
        }
    }
    cout << d[n] << "\n";
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

int n_val, m_val;
vector<vector<pair<int, long long>>> adj_g;
long long min_cost = 1e18;
vector<bool> vis;

void dfs(int u, long long cur) {
    if (u == n_val) {
        min_cost = min(min_cost, cur);
        return;
    }
    vis[u] = true;
    for (auto& edge : adj_g[u]) {
        if (!vis[edge.first] && cur + edge.second < min_cost) {
            dfs(edge.first, cur + edge.second);
        }
    }
    vis[u] = false;
}

void solve() {
    if (!(cin >> n_val >> m_val)) return;
    adj_g.assign(n_val + 1, {});
    vis.assign(n_val + 1, false);
    for (int i = 0; i < m_val; i++) {
        int u, v;
        long long w;
        cin >> u >> v >> w;
        adj_g[u].push_back({v, w});
        adj_g[v].push_back({u, w});
    }
    min_cost = 1e18;
    dfs(1, 0);
    cout << min_cost << "\n";
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
    int n, m;
    if (!(cin >> n >> m)) return;
    // Bug: unweighted BFS ignoring weights
    vector<vector<int>> g(n + 1);
    for (int i = 0; i < m; i++) {
        int u, v, w;
        cin >> u >> v >> w;
        g[u].push_back(v);
        g[v].push_back(u);
    }
    vector<int> dist(n + 1, -1);
    queue<int> q;
    dist[1] = 0;
    q.push(1);
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        for (int v : g[u]) {
            if (dist[v] == -1) {
                dist[v] = dist[u] + 1;
                q.push(v);
            }
        }
    }
    cout << dist[n] << "\n";
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
    int n = opt<int>("n", 5);
    int m = opt<int>("m", 6);
    int max_w = opt<int>("max-w", 10);

    // Generate connected graph: first a spanning tree, then additional edges
    vector<pair<int, int>> edges;
    for (int i = 2; i <= n; i++) {
        int p = rnd.next(1, i - 1);
        edges.push_back({p, i});
    }
    set<pair<int, int>> seen;
    for (auto& e : edges) {
        seen.insert({min(e.first, e.second), max(e.first, e.second)});
    }
    while ((int)edges.size() < m) {
        int u = rnd.next(1, n);
        int v = rnd.next(1, n);
        if (u == v) continue;
        if (u > v) swap(u, v);
        if (seen.find({u, v}) == seen.end()) {
            seen.insert({u, v});
            edges.push_back({u, v});
        }
    }
    println(n, (int)edges.size());
    for (auto& e : edges) {
        int w = rnd.next(1, max_w);
        println(e.first, e.second, w);
    }
    return 0;
}

/*
FreeMarker script example:
Executable name must match this file's base name: generator

generator -n 2 -m 1 -max-w 1 > $
generator -n 4 -m 4 -max-w 10 > $
generator -n 10 -m 15 -max-w 100 1 > $
generator -n 50 -m 100 -max-w 1000 2 > $
generator -n 1000 -m 2000 -max-w 100000 3 > $
generator -n 100000 -m 200000 -max-w 1000000000 4 > $
*/
""",
        "samples": [
            ("4 4\n1 2 2\n2 4 5\n1 3 1\n3 4 3\n", "4\n")
        ],
        "validator_tests": [
            ("valid_min.in", "2 1\n1 2 5\n", True),
            ("valid_max.in", "3 2\n1 2 1000000000\n2 3 1000000000\n", True),
            ("invalid_self_loop.in", "2 1\n1 1 5\n", False),
            ("invalid_zero_w.in", "2 1\n1 2 0\n", False),
            ("invalid_n_zero.in", "0 0\n", False),
        ]
    }
]
