"""Data for Grade 11 contest problems (A, B, C, D, E)."""

PROBLEMS_11 = [
    {
        "name": "grade11_a_chupon_yulduzlari",
        "title": "Donishmand Cho'pon va Muvozanat Yulduzi",
        "points": 7,
        "difficulty": 900,
        "tags": "ad-hoc, prefix-sums, math",
        "stress_args": "-n 20 -max-val 50",
        "statement": r"""\textbf{\Large Donishmand Cho'pon va Muvozanat Yulduzi}

Donishmand cho'pon qorong'u dashtda osmonda qator tizilgan $n$ ta yulduzning yorqinligini kuzatmoqda: $a_1, a_2, \ldots, a_n$.

Cho'pon osmonda shunday \textbf{muvozanat yulduzini} (1-based indeks $i$) topmoqchiki, undan chapdagi barcha yulduzlar yorqinligi yig'indisi o'ngdagi barcha yulduzlar yorqinligi yig'indisiga teng bo'lsin:
\[ \sum_{j=1}^{i-1} a_j = \sum_{j=i+1}^n a_j \]
(Agar $i = 1$ bo'lsa, chap tomondagi yig'indi $0$ ga teng; agar $i = n$ bo'lsa, o'ng tomondagi yig'indi $0$ ga teng deb olinadi).

Agar bunday muvozanat yulduzlari bir nechta bo'lsa, ularning eng birinchisini (eng kichik $1$-based indeksini), agar bunday yulduz mavjud bo'lmasa, $-1$ chiqaring.

\textbf{Input}

Birinchi qatorda bitta butun son $n$ ($1 \leq n \leq 100'000$)~--- yulduzlar soni.

Ikkinchi qatorda $n$ ta butun son $a_1, a_2, \ldots, a_n$ ($-10^9 \leq a_i \leq 10^9$)~--- yulduzlarning yorqinlik darajalari.

\textbf{Output}

Bitta butun son~--- muvozanat yulduzining eng kichik $1$-based indeksini yoki $-1$ chiqaring.

\textbf{Notes}

Namunada massiv $[2, 3, 5, 1, 4]$.
$i = 3$ da:
\begin{itemize}
    \item Chap tomon: $a_1 + a_2 = 2 + 3 = 5$.
    \item O'ng tomon: $a_4 + a_5 = 1 + 4 = 5$.
\end{itemize}
Chap va o'ng yig'indilar teng ($5 = 5$). Shuning uchun javob $3$.
""",
        "tutorial": r"""\textbf{\Large Donishmand Cho'pon va Muvozanat Yulduzi --- Tutorial}

\textbf{Mavzu:} Ad-hoc, massiv tahlili, prefiks yig'indilar ($O(N)$).

\textbf{Tahlil:}
1. Dastlab massivning barcha elementlari yig'indisi \texttt{total\_sum} ni hisoblaymiz.
2. Chap tomondagi yig'indini \texttt{left\_sum = 0} deb belgilaymiz.
3. Massiv bo'ylab $i = 0$ dan $n-1$ gacha yuramiz:
   - O'ng tomondagi yig'indi: $\text{right\_sum} = \text{total\_sum} - \text{left\_sum} - a_i$.
   - Agar $\text{left\_sum} == \text{right\_sum}$ bo'lsa, biz qidirgan birinchi indeks $i+1$ (1-based) bo'ladi va uni darhol chiqaramiz.
   - Har bir qadamda $\text{left\_sum} += a_i$.
4. Agar tsikl tugaguncha bunday indeks topilmasa, $-1$ chiqaramiz.
Yig'indilar chegaradan oshmasligi uchun 64-bitlik \texttt{long long} turidan foydalanish zarur.

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
        inf.readLong(-1'000'000'000LL, 1'000'000'000LL, "a_i");
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
    vector<long long> a(n);
    long long total_sum = 0;
    for (int i = 0; i < n; i++) {
        cin >> a[i];
        total_sum += a[i];
    }
    long long left_sum = 0;
    for (int i = 0; i < n; i++) {
        long long right_sum = total_sum - left_sum - a[i];
        if (left_sum == right_sum) {
            cout << (i + 1) << "\n";
            return;
        }
        left_sum += a[i];
    }
    cout << -1 << "\n";
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
        long[] a = new long[n];
        long totalSum = 0;
        for (int i = 0; i < n; i++) {
            a[i] = in.nextLong();
            totalSum += a[i];
        }
        long leftSum = 0;
        for (int i = 0; i < n; i++) {
            long rightSum = totalSum - leftSum - a[i];
            if (leftSum == rightSum) {
                System.out.println(i + 1);
                return;
            }
            leftSum += a[i];
        }
        System.out.println(-1);
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
    vector<long long> a(n);
    vector<long long> pref(n + 1, 0);
    for (int i = 0; i < n; i++) {
        cin >> a[i];
        pref[i + 1] = pref[i] + a[i];
    }
    for (int i = 1; i <= n; i++) {
        long long left = pref[i - 1];
        long long right = pref[n] - pref[i];
        if (left == right) {
            cout << i << "\n";
            return;
        }
    }
    cout << -1 << "\n";
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
    vector<long long> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    for (int i = 0; i < n; i++) {
        long long left = 0;
        for (int j = 0; j < i; j++) left += a[j];
        long long right = 0;
        for (int j = i + 1; j < n; j++) right += a[j];
        if (left == right) {
            cout << (i + 1) << "\n";
            return;
        }
    }
    cout << -1 << "\n";
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
    vector<long long> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    // Bug: 0-based index returned instead of 1-based
    long long total = accumulate(a.begin(), a.end(), 0LL);
    long long left = 0;
    for (int i = 0; i < n; i++) {
        if (left == total - left - a[i]) {
            cout << i << "\n";
            return;
        }
        left += a[i];
    }
    cout << -1 << "\n";
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
    string mode = opt<string>("mode", "random");

    println(n);
    vector<long long> a(n);
    if (mode == "balanced") {
        int mid = n / 2;
        for (int i = 0; i < mid; i++) a[i] = rnd.next(1, max_val);
        for (int i = 0; i < mid; i++) a[n - 1 - i] = a[i];
        if (n % 2 != 0) a[mid] = rnd.next(1, max_val);
    } else {
        for (int i = 0; i < n; i++) a[i] = rnd.next(-max_val, max_val);
    }
    println(a);
    return 0;
}

/*
FreeMarker script example:
Executable name must match this file's base name: generator

generator -n 1 -max-val 1 > $
generator -n 3 -max-val 10 -mode balanced > $
generator -n 5 -max-val 10 -mode balanced > $
generator -n 10 -max-val 100 1 > $
generator -n 50 -max-val 1000 2 > $
generator -n 100000 -max-val 1000000000 3 > $
generator -n 100000 -max-val 1000000000 -mode balanced > $
*/
""",
        "samples": [
            ("5\n2 3 5 1 4\n", "3\n")
        ],
        "validator_tests": [
            ("valid_min.in", "1\n0\n", True),
            ("valid_negative.in", "2\n-5 5\n", True),
            ("valid_max.in", "2\n1000000000 -1000000000\n", True),
            ("invalid_n_zero.in", "0\n\n", False),
            ("invalid_elem_too_large.in", "1\n1000000001\n", False),
        ]
    },
    {
        "name": "grade11_b_karvon_intervallari",
        "title": "Buyuk Ipak Yo'li Karvonsaroyi",
        "points": 7,
        "difficulty": 1100,
        "tags": "greedy, sorting, interval-scheduling",
        "stress_args": "-n 20 -max-time 50",
        "statement": r"""\textbf{\Large Buyuk Ipak Yo'li Karvonsaroyi}

Samarqand shahridagi mashhur karvonsaroyga Ipak yo'lidan $n$ ta savdogarlar karvoni kelish istagini bildirdi. 

Har bir $i$-karvon $[l_i, r_i]$ vaqt oralig'ida karvonsaroyda to'xtashni rejalashtirgan. Karvonsaroy saroyi keng bo'lsa-da, qoidaga ko'ra bir vaqtning o'zida faqat bitta karvonga xizmat ko'rsatishi mumkin. Bir karvonga xizmat $r_i$ vaqtda tugagach, keyingi qabul qilinadigan karvonning boshlanish vaqti qat'iy kattaroq ($l_j > r_i$) bo'lishi shart (ya'ni oraliqlar hatto bitta nuqtada ham kesishmasligi kerak).

Karvonsaroy oqsoqoli eng ko'pi bilan nechta karvonni qabul qila olishini aniqlang.

\textbf{Input}

Birinchi qatorda bitta butun son $n$ ($1 \leq n \leq 100'000$)~--- karvonlar soni.

Keyingi $n$ ta qatorda ikkitadan butun son $l_i$ va $r_i$ ($1 \leq l_i \leq r_i \leq 10^9$)~--- har bir karvonning to'xtash oraliqlari.

\textbf{Output}

Bitta butun son~--- xizmat ko'rsatish mumkin bo'lgan maksimal karvonlar sonini chiqaring.

\textbf{Notes}

Berilgan oraliqlar: $[1, 3], [2, 5], [4, 7], [6, 9]$.
Agar $[1, 3]$ va $[4, 7]$ oraliqlarini tanlasak:
$1$-karvon $3$ da tugaydi, $2$-karvon $4$ da boshlanadi ($4 > 3$).
Jami 2 ta karvon qabul qilinadi.
$[4, 7]$ va $[6, 9]$ oraliqlari $6 \leq 7$ bo'lgani sababli birgalikda tanlanishi mumkin emas.
""",
        "tutorial": r"""\textbf{\Large Buyuk Ipak Yo'li Karvonsaroyi --- Tutorial}

\textbf{Mavzu:} Saralash (Sorting) va Ochko'z yondashuv (Greedy, Interval Scheduling).

\textbf{Tahlil:}
Bu klassik "Interval Scheduling" masalasidir.
Maksimal miqdordagi kesishmaydigan oraliqlarni tanlash uchun:
1. Barcha karvonlarni ularning tugash vaqti $r_i$ ning o'sishi bo'yicha saralaymiz.
2. Har doim tugash vaqti eng erta bo'lgan va avvalgi tanlangan karvon bilan kesishmaydigan karvonni tanlaymiz (ya'ni $l_i > \text{last\_end}$).
3. Har bir tanlangan karvon uchun $\text{last\_end} = r_i$ qilamiz va hisoblagichni 1 ga oshiramiz.

Vaqt murakkabligi: $O(N \log N)$ saralash uchun.
Xotira murakkabligi: $O(N)$ oraliqlarni saqlash uchun.
""",
        "validator": r"""#include "testlib.h"

int main(int argc, char* argv[]) {
    registerValidation(argc, argv);
    int n = inf.readInt(1, 100'000, "n");
    inf.readEoln();
    for (int i = 0; i < n; i++) {
        int l = inf.readInt(1, 1'000'000'000, "l_i");
        inf.readSpace();
        inf.readInt(l, 1'000'000'000, "r_i");
        inf.readEoln();
    }
    inf.readEof();
    return 0;
}
""",
        "acc": r"""#include <bits/stdc++.h>
using namespace std;

struct Interval {
    int l, r;
};

void solve() {
    int n;
    if (!(cin >> n)) return;
    vector<Interval> intervals(n);
    for (int i = 0; i < n; i++) {
        cin >> intervals[i].l >> intervals[i].r;
    }
    sort(intervals.begin(), intervals.end(), [](const Interval& a, const Interval& b) {
        if (a.r != b.r) return a.r < b.r;
        return a.l < b.l;
    });
    int count = 0;
    int last_r = 0;
    for (int i = 0; i < n; i++) {
        if (count == 0 || intervals[i].l > last_r) {
            count++;
            last_r = intervals[i].r;
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
        "acc_java": r"""import java.util.Arrays;
import java.util.Scanner;

public class acc_java {
    static Scanner in = new Scanner(System.in);

    static class Interval implements Comparable<Interval> {
        int l, r;
        Interval(int l, int r) {
            this.l = l;
            this.r = r;
        }
        public int compareTo(Interval o) {
            if (this.r != o.r) return Integer.compare(this.r, o.r);
            return Integer.compare(this.l, o.l);
        }
    }

    static void solve() {
        if (!in.hasNextInt()) return;
        int n = in.nextInt();
        Interval[] arr = new Interval[n];
        for (int i = 0; i < n; i++) {
            arr[i] = new Interval(in.nextInt(), in.nextInt());
        }
        Arrays.sort(arr);
        int count = 0;
        int lastR = 0;
        for (int i = 0; i < n; i++) {
            if (count == 0 || arr[i].l > lastR) {
                count++;
                lastR = arr[i].r;
            }
        }
        System.out.println(count);
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
    vector<pair<int, int>> v(n);
    for (int i = 0; i < n; i++) {
        cin >> v[i].second >> v[i].first; // store as (r, l)
    }
    sort(v.begin(), v.end());
    int ans = 0;
    int cur_end = 0;
    for (auto& p : v) {
        if (ans == 0 || p.second > cur_end) {
            ans++;
            cur_end = p.first;
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
        "brute": r"""#include <bits/stdc++.h>
using namespace std;

void solve() {
    int n;
    if (!(cin >> n)) return;
    vector<pair<int, int>> v(n);
    for (int i = 0; i < n; i++) cin >> v[i].second >> v[i].first; // (r, l)
    sort(v.begin(), v.end());
    vector<int> dp(n, 1);
    int ans = (n > 0 ? 1 : 0);
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < i; j++) {
            if (v[j].first < v[i].second) {
                dp[i] = max(dp[i], dp[j] + 1);
            }
        }
        ans = max(ans, dp[i]);
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
    vector<pair<int, int>> v(n);
    for (int i = 0; i < n; i++) cin >> v[i].first >> v[i].second;
    // Bug: sorts by start time instead of end time
    sort(v.begin(), v.end());
    int count = 0;
    int last = 0;
    for (auto& p : v) {
        if (count == 0 || p.first > last) {
            count++;
            last = p.second;
        }
    }
    cout << count << "\n";
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
    int max_time = opt<int>("max-time", 100);

    println(n);
    for (int i = 0; i < n; i++) {
        int l = rnd.next(1, max_time);
        int len = rnd.next(0, max_time / 2);
        int r = min(l + len, max_time);
        println(l, r);
    }
    return 0;
}

/*
FreeMarker script example:
Executable name must match this file's base name: generator

generator -n 1 -max-time 1 > $
generator -n 4 -max-time 10 > $
generator -n 10 -max-time 50 1 > $
generator -n 50 -max-time 1000 2 > $
generator -n 1000 -max-time 100000 3 > $
generator -n 100000 -max-time 1000000000 4 > $
*/
""",
        "samples": [
            ("4\n1 3\n2 5\n4 7\n6 9\n", "2\n")
        ],
        "validator_tests": [
            ("valid_min.in", "1\n1 1\n", True),
            ("valid_max.in", "2\n1 1000000000\n5 10\n", True),
            ("invalid_l_gt_r.in", "1\n5 4\n", False),
            ("invalid_zero.in", "1\n0 5\n", False),
            ("invalid_n_zero.in", "0\n\n", False),
        ]
    },
    {
        "name": "grade11_c_tohir_zuhra_daryosi",
        "title": "Tohir va Zuhra Gulzori",
        "points": 10,
        "difficulty": 1200,
        "tags": "two-pointers, sliding-window, arrays",
        "stress_args": "-n 20 -S 50 -max-val 20",
        "statement": r"""\textbf{\Large Tohir va Zuhra Gulzori}

Tohir va Zuhra daryo bo'yidagi bir to'g'ri chiziqda tizilgan $n$ ta chorbog' oralab sayr qilishmoqda. Har bir $i$-chorbog'da $a_i$ dona noyob atirgul o'smoqda.

Ular ketma-ket joylashgan oraliqdagi (uzluksiz qism-massivdagi) chorbog'lardan gul termoqchi. Biroq daryo noziri terilgan gullarning umumiy soni $S$ dan oshmasligini qat'iy talab qildi.

Tohir va Zuhra gul terishi mumkin bo'lgan uzluksiz chorbog'lar oralig'ining \textbf{maksimal uzunligini} (chorbog'lar sonini) toping. Agar birorta ham chorbog'dan gul ololmasa, $0$ chiqaring.

\textbf{Input}

Birinchi qatorda ikkita butun son $n$ va $S$ ($1 \leq n \leq 200'000, 1 \leq S \leq 10^{14}$)~--- chorbog'lar soni va ruxsat berilgan maksimal gullar miqdori.

Ikkinchi qatorda $n$ ta butun son $a_1, a_2, \ldots, a_n$ ($1 \leq a_i \leq 10^9$)~--- har bir chorbog'dagi gullar soni.

\textbf{Output}

Bitta butun son~--- yig'indisi ko'pi bilan $S$ bo'lgan eng uzun uzluksiz oraliq uzunligini chiqaring.

\textbf{Notes}

Namunada $n = 5, S = 10$, gullar $[3, 1, 4, 2, 5]$.
\begin{itemize}
    \item $[3, 1, 4]$ oraliqda yig'indi $3 + 1 + 4 = 8 \leq 10$ (uzunlik 3).
    \item $[1, 4, 2]$ oraliqda yig'indi $1 + 4 + 2 = 7 \leq 10$ (uzunlik 3).
    \item 4 ta ketma-ket element tanlansa, masalan $[3, 1, 4, 2] = 10 \leq 10$ (uzunlik 4).
\end{itemize}
Eng katta uzunlik 4.
""",
        "tutorial": r"""\textbf{\Large Tohir va Zuhra Gulzori --- Tutorial}

\textbf{Mavzu:} Ikki ko'rsatkich (Two Pointers / Sliding window).

\textbf{Tahlil:}
Barcha $a_i > 0$ bo'lgani uchun, oraliq kengaygani sari yig'indi monoton o'sib boradi. Bu esa ikki ko'rsatkich (Two Pointers) usulini qo'llash imkonini beradi:
1. Chap ko'rsatkich $L = 0$, joriy yig'indi \texttt{current\_sum = 0}, maksimal uzunlik \texttt{ans = 0}.
2. O'ng ko'rsatkich $R$ ni $0$ dan $n-1$ gacha oshiramiz:
   - $\text{current\_sum} += a_R$.
   - Toki $\text{current\_sum} > S$ bo'lguncha, chapdan elementlarni ayirib $L$ ni suramiz: $\text{current\_sum} -= a_L; L++$.
   - $\text{ans} = \max(\text{ans}, R - L + 1)$.
3. Natijada eng uzun oraliq uzunligini olamiz.
$S \leq 10^{14}$ bo'lgani sababli \texttt{long long} ishlatiladi.

Vaqt murakkabligi: $O(N)$ (har bir element ko'pi bilan 2 marta ko'riladi).
Xotira murakkabligi: $O(N)$.
""",
        "validator": r"""#include "testlib.h"

int main(int argc, char* argv[]) {
    registerValidation(argc, argv);
    int n = inf.readInt(1, 200'000, "n");
    inf.readSpace();
    inf.readLong(1LL, 100'000'000'000'000LL, "S");
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
    long long S;
    if (!(cin >> n >> S)) return;
    vector<long long> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    int l = 0;
    long long current = 0;
    int ans = 0;
    for (int r = 0; r < n; r++) {
        current += a[r];
        while (current > S && l <= r) {
            current -= a[l];
            l++;
        }
        if (current <= S) {
            ans = max(ans, r - l + 1);
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
        long S = in.nextLong();
        long[] a = new long[n];
        for (int i = 0; i < n; i++) a[i] = in.nextLong();
        int l = 0;
        long cur = 0;
        int ans = 0;
        for (int r = 0; r < n; r++) {
            cur += a[r];
            while (cur > S && l <= r) {
                cur -= a[l];
                l++;
            }
            if (cur <= S) {
                ans = Math.max(ans, r - l + 1);
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
    long long S;
    if (!(cin >> n >> S)) return;
    vector<long long> a(n);
    vector<long long> pref(n + 1, 0);
    for (int i = 0; i < n; i++) {
        cin >> a[i];
        pref[i + 1] = pref[i] + a[i];
    }
    int ans = 0;
    for (int i = 1; i <= n; i++) {
        long long target = pref[i - 1] + S;
        int idx = upper_bound(pref.begin(), pref.end(), target) - pref.begin() - 1;
        ans = max(ans, idx - i + 1);
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
        "brute": r"""#include <bits/stdc++.h>
using namespace std;

void solve() {
    int n;
    long long S;
    if (!(cin >> n >> S)) return;
    vector<long long> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    int ans = 0;
    for (int i = 0; i < n; i++) {
        long long sum = 0;
        for (int j = i; j < n; j++) {
            sum += a[j];
            if (sum <= S) ans = max(ans, j - i + 1);
            else break;
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
    long long S;
    if (!(cin >> n >> S)) return;
    vector<long long> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    // Bug: off-by-one in window length calculation
    int l = 0;
    long long cur = 0;
    int ans = 0;
    for (int r = 0; r < n; r++) {
        cur += a[r];
        while (cur > S && l <= r) {
            cur -= a[l++];
        }
        ans = max(ans, r - l);
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
    long long S = opt<long long>("S", 50);
    int max_val = opt<int>("max-val", 20);

    println(n, S);
    vector<int> a(n);
    for (int i = 0; i < n; i++) a[i] = rnd.next(1, max_val);
    println(a);
    return 0;
}

/*
FreeMarker script example:
Executable name must match this file's base name: generator

generator -n 1 -S 5 -max-val 10 > $
generator -n 5 -S 10 -max-val 10 > $
generator -n 10 -S 50 -max-val 20 1 > $
generator -n 50 -S 200 -max-val 50 2 > $
generator -n 1000 -S 50000 -max-val 1000 3 > $
generator -n 200000 -S 100000000000000 -max-val 1000000000 4 > $
*/
""",
        "samples": [
            ("5 10\n3 1 4 2 5\n", "4\n")
        ],
        "validator_tests": [
            ("valid_min.in", "1 1\n1\n", True),
            ("valid_max.in", "2 100000000000000\n1000000000 1000000000\n", True),
            ("invalid_s_zero.in", "1 0\n1\n", False),
            ("invalid_elem_zero.in", "2 5\n1 0\n", False),
            ("invalid_n_zero.in", "0 5\n", False),
        ]
    },
    {
        "name": "grade11_d_saroy_minorasi_lis",
        "title": "Shoh Saroyi Minoralari",
        "points": 10,
        "difficulty": 1300,
        "tags": "dp, binary-search, lis",
        "stress_args": "-n 20 -max-h 50",
        "statement": r"""\textbf{\Large Shoh Saroyi Minoralari}

Samarqand shohi Registon maydoniga qator tizilgan $n$ ta me'moriy minora qurdirdi. Minoralarning balandliklari chapdan o'ngga qarab $h_1, h_2, \ldots, h_n$.

Shoh maydondagi minoralar orasidan shundaylarini tanlab olmoqchiki, tanlangan minoralar chapdan o'ngga qarab \textbf{qat'iy o'suvchi} bo'lsin ($h_{i_1} < h_{i_2} < \ldots < h_{i_k}$, bu yerda $i_1 < i_2 < \ldots < i_k$) va bunday tanlangan minoralar soni $k$ maksimal bo'lsin.

Shoh eng ko'pi bilan nechta minora tanlab olishi mumkinligini aniqlang.

\textbf{Input}

Birinchi qatorda bitta butun son $n$ ($1 \leq n \leq 100'000$)~--- minoralar soni.

Ikkinchi qatorda $n$ ta butun son $h_1, h_2, \ldots, h_n$ ($1 \leq h_i \leq 10^9$)~--- minoralarning balandliklari.

\textbf{Output}

Bitta butun son~--- tanlash mumkin bo'lgan qat'iy o'suvchi minoralarning maksimal sonini chiqaring.

\textbf{Notes}

Namunada minoralar: $[10, 22, 9, 33, 21, 50]$.
Optimal tanlov: $10, 22, 33, 50$.
Ular qat'iy o'suvchi ($10 < 22 < 33 < 50$) va uzunligi 4 ga teng.
""",
        "tutorial": r"""\textbf{\Large Shoh Saroyi Minoralari --- Tutorial}

\textbf{Mavzu:} Klassik Dinamik dasturlash: Eng uzun o'suvchi qism-ketma-ketlik (Longest Increasing Subsequence --- LIS).

\textbf{Tahlil:}
$N \leq 100'000$ bo'lganligi sababli, $O(N^2)$ kvadratik DP yechimi Time Limit Exceeded beradi. Bizga $O(N \log N)$ yechim kerak:
\texttt{tails[len]} massivini yuritamiz: bu yerda \texttt{tails[len]}~--- uzunligi \texttt{len} bo'lgan o'suvchi qism-ketma-ketlikning minimal mumkin bo'lgan oxirgi elementi.
Har bir $h_i$ elementi uchun:
- \texttt{tails} massividan $h_i$ dan kichik bo'lmagan birinchi elementni \texttt{std::lower\_bound} yordamida $O(\log N)$ da qidiramiz.
- Agar bunday element topilsa, uni $h_i$ ga almashtiramiz (oxirgi qiymatni kamaytirish orqali kelgusida o'sish imkoniyatini oshiramiz).
- Agar barcha elementlardan katta bo'lsa, \texttt{tails} massivining oxiriga $h_i$ ni qo'shamiz (yangi uzunlik hosil bo'ldi).
Javob \texttt{tails} massivining o'lchamiga teng bo'ladi.

Vaqt murakkabligi: $O(N \log N)$.
Xotira murakkabligi: $O(N)$.
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
    vector<int> h(n);
    for (int i = 0; i < n; i++) cin >> h[i];
    vector<int> tails;
    for (int x : h) {
        auto it = lower_bound(tails.begin(), tails.end(), x);
        if (it == tails.end()) {
            tails.push_back(x);
        } else {
            *it = x;
        }
    }
    cout << tails.size() << "\n";
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
        "acc_java": r"""import java.util.ArrayList;
import java.util.Collections;
import java.util.Scanner;

public class acc_java {
    static Scanner in = new Scanner(System.in);

    static void solve() {
        if (!in.hasNextInt()) return;
        int n = in.nextInt();
        int[] h = new int[n];
        for (int i = 0; i < n; i++) h[i] = in.nextInt();
        ArrayList<Integer> tails = new ArrayList<>();
        for (int x : h) {
            int idx = Collections.binarySearch(tails, x);
            if (idx < 0) {
                idx = -(idx + 1);
            }
            if (idx == tails.size()) {
                tails.add(x);
            } else {
                tails.set(idx, x);
            }
        }
        System.out.println(tails.size());
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
    vector<int> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    vector<int> d;
    for (int i = 0; i < n; i++) {
        int l = 0, r = d.size();
        while (l < r) {
            int m = (l + r) / 2;
            if (d[m] >= a[i]) r = m;
            else l = m + 1;
        }
        if (l == (int)d.size()) d.push_back(a[i]);
        else d[l] = a[i];
    }
    cout << d.size() << "\n";
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
    vector<int> h(n);
    for (int i = 0; i < n; i++) cin >> h[i];
    vector<int> dp(n, 1);
    int ans = 1;
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < i; j++) {
            if (h[j] < h[i]) {
                dp[i] = max(dp[i], dp[j] + 1);
            }
        }
        ans = max(ans, dp[i]);
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
    vector<int> h(n);
    for (int i = 0; i < n; i++) cin >> h[i];
    // Bug: allows non-decreasing (upper_bound) instead of strictly increasing
    vector<int> tails;
    for (int x : h) {
        auto it = upper_bound(tails.begin(), tails.end(), x);
        if (it == tails.end()) tails.push_back(x);
        else *it = x;
    }
    cout << tails.size() << "\n";
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
    int max_h = opt<int>("max-h", 100);
    string type = opt<string>("type", "random");

    println(n);
    vector<int> a(n);
    if (type == "inc") {
        for (int i = 0; i < n; i++) a[i] = i + 1;
    } else if (type == "dec") {
        for (int i = 0; i < n; i++) a[i] = n - i;
    } else if (type == "equal") {
        for (int i = 0; i < n; i++) a[i] = max_h;
    } else {
        for (int i = 0; i < n; i++) a[i] = rnd.next(1, max_h);
    }
    println(a);
    return 0;
}

/*
FreeMarker script example:
Executable name must match this file's base name: generator

generator -n 1 -max-h 1 > $
generator -n 6 -max-h 50 > $
generator -n 10 -max-h 100 -type inc > $
generator -n 10 -max-h 100 -type dec > $
generator -n 10 -max-h 100 -type equal > $
generator -n 50 -max-h 1000 1 > $
generator -n 1000 -max-h 100000 2 > $
generator -n 100000 -max-h 1000000000 3 > $
*/
""",
        "samples": [
            ("6\n10 22 9 33 21 50\n", "4\n")
        ],
        "validator_tests": [
            ("valid_min.in", "1\n1\n", True),
            ("valid_max.in", "2\n1000000000 1000000000\n", True),
            ("invalid_zero.in", "1\n0\n", False),
            ("invalid_too_large.in", "1\n1000000001\n", False),
            ("invalid_n_zero.in", "0\n\n", False),
        ]
    },
    {
        "name": "grade11_e_daraxt_saltanati",
        "title": "Ming Yillik Chinor va Saltanat Daraxti",
        "points": 16,
        "difficulty": 1500,
        "tags": "trees, dfs-and-similar, tree-diameter",
        "stress_args": "-n 20",
        "statement": r"""\textbf{\Large Ming Yillik Chinor va Saltanat Daraxti}

Ming yillik muqaddas chinor ostidagi saltanat $n$ ta shahardan iborat bo'lib, shaharlar $n-1$ ta ikki tomonlama yo'l bilan o'zaro bog'langan. Har qanday ikki shahar o'rtasida yagona oddiy yo'l mavjud (graf daraxt tuzilishiga ega). Har bir yo'lning uzunligi 1 fersaxga teng.

Saltanat donishmandi saltanatdagi eng chekka ikki shahar orasidagi \textbf{maksimal masofani} (daraxt diametrini) hisoblashni xohlaydi.

Daraxtdagi ixtiyoriy ikki shahar orasidagi eng katta masofani toping.

\textbf{Input}

Birinchi qatorda bitta butun son $n$ ($1 \leq n \leq 200'000$)~--- shaharlar soni.

Keyingi $n-1$ ta qatorda ikkitadan butun son $u_i$ va $v_i$ ($1 \leq u_i, v_i \leq n, u_i \neq v_i$)~--- yo'l tutashtirgan shaharlar raqamlari.

\textbf{Output}

Bitta butun son~--- daraxt diametrini (eng uzoq ikki shahar orasidagi masofani) chiqaring.

\textbf{Notes}

Namunada daraxt yo'llari:
$(1-2), (1-3), (3-4), (3-5)$.
Eng uzoq yo'l $2 \to 1 \to 3 \to 4$ yoki $2 \to 1 \to 3 \to 5$ bo'lib, uzunligi 3 ga teng.
""",
        "tutorial": r"""\textbf{\Large Ming Yillik Chinor va Saltanat Daraxti --- Tutorial}

\textbf{Mavzu:} Graflar va daraxtlar ustida amallar, daraxt diametri (Tree Diameter, 2 marta BFS/DFS).

\textbf{Tahlil:}
Daraxt diametrini topishning eng mashhur va samarali usuli 2 marta BFS (yoki DFS) qilishdir:
1. Ixtiyoriy cho'qqidan (masalan, $1$-cho'qqidan) BFS yuritib, undan eng uzoqda joylashgan $u$ cho'qqini topamiz.
2. Endi $u$ cho'qqidan ikkinchi BFS yuritib, undan eng uzoqda joylashgan $v$ cho'qqini va unga bo'lgan masofani topamiz.
Topilgan ushbu masofa aynan daraxtning diametri bo'ladi!
$N = 1$ bo'lganda yo'l yo'q, diametr $0$ bo'ladi.

Vaqt murakkabligi: $O(N)$ (har bir BFS $O(N)$ vaqt oladi).
Xotira murakkabligi: $O(N)$.
""",
        "validator": r"""#include "testlib.h"
#include <vector>

std::vector<int> parent;
int find_set(int v) {
    if (v == parent[v]) return v;
    return parent[v] = find_set(parent[v]);
}

int main(int argc, char* argv[]) {
    registerValidation(argc, argv);
    int n = inf.readInt(1, 200'000, "n");
    inf.readEoln();
    parent.resize(n + 1);
    for (int i = 1; i <= n; i++) parent[i] = i;
    for (int i = 0; i < n - 1; i++) {
        int u = inf.readInt(1, n, "u_i");
        inf.readSpace();
        int v = inf.readInt(1, n, "v_i");
        inf.readEoln();
        ensuref(u != v, "Self loops not allowed");
        int ru = find_set(u);
        int rv = find_set(v);
        ensuref(ru != rv, "Graph must be a tree (no cycles)");
        parent[ru] = rv;
    }
    inf.readEof();
    return 0;
}
""",
        "acc": r"""#include <bits/stdc++.h>
using namespace std;

pair<int, int> bfs(int start, int n, const vector<vector<int>>& adj) {
    vector<int> dist(n + 1, -1);
    queue<int> q;
    q.push(start);
    dist[start] = 0;
    int farthest_node = start;
    int max_d = 0;
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        if (dist[u] > max_d) {
            max_d = dist[u];
            farthest_node = u;
        }
        for (int v : adj[u]) {
            if (dist[v] == -1) {
                dist[v] = dist[u] + 1;
                q.push(v);
            }
        }
    }
    return {farthest_node, max_d};
}

void solve() {
    int n;
    if (!(cin >> n)) return;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < n - 1; i++) {
        int u, v;
        cin >> u >> v;
        adj[u].push_back(v);
        adj[v].push_back(u);
    }
    if (n == 1) {
        cout << 0 << "\n";
        return;
    }
    auto [u, d1] = bfs(1, n, adj);
    auto [v, diameter] = bfs(u, n, adj);
    cout << diameter << "\n";
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

    static int[] bfs(int start, int n, List<List<Integer>> adj) {
        int[] dist = new int[n + 1];
        Arrays.fill(dist, -1);
        Queue<Integer> q = new ArrayDeque<>();
        q.add(start);
        dist[start] = 0;
        int farthest = start;
        int maxDist = 0;
        while (!q.isEmpty()) {
            int u = q.poll();
            if (dist[u] > maxDist) {
                maxDist = dist[u];
                farthest = u;
            }
            for (int v : adj.get(u)) {
                if (dist[v] == -1) {
                    dist[v] = dist[u] + 1;
                    q.add(v);
                }
            }
        }
        return new int[]{farthest, maxDist};
    }

    static void solve() {
        if (!in.hasNextInt()) return;
        int n = in.nextInt();
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i <= n; i++) adj.add(new ArrayList<>());
        for (int i = 0; i < n - 1; i++) {
            int u = in.nextInt();
            int v = in.nextInt();
            adj.get(u).add(v);
            adj.get(v).add(u);
        }
        if (n == 1) {
            System.out.println(0);
            return;
        }
        int[] r1 = bfs(1, n, adj);
        int[] r2 = bfs(r1[0], n, adj);
        System.out.println(r2[1]);
    }

    public static void main(String[] args) {
        solve();
    }
}
""",
        "acc_alt": r"""#include <bits/stdc++.h>
using namespace std;

int max_diam = 0;

int dfs(int u, int p, const vector<vector<int>>& adj) {
    int max1 = 0, max2 = 0;
    for (int v : adj[u]) {
        if (v == p) continue;
        int h = dfs(v, u, adj) + 1;
        if (h > max1) {
            max2 = max1;
            max1 = h;
        } else if (h > max2) {
            max2 = h;
        }
    }
    max_diam = max(max_diam, max1 + max2);
    return max1;
}

void solve() {
    int n;
    if (!(cin >> n)) return;
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < n - 1; i++) {
        int u, v;
        cin >> u >> v;
        adj[u].push_back(v);
        adj[v].push_back(u);
    }
    max_diam = 0;
    dfs(1, 0, adj);
    cout << max_diam << "\n";
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
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < n - 1; i++) {
        int u, v;
        cin >> u >> v;
        adj[u].push_back(v);
        adj[v].push_back(u);
    }
    int diam = 0;
    for (int i = 1; i <= n; i++) {
        vector<int> dist(n + 1, -1);
        queue<int> q;
        q.push(i);
        dist[i] = 0;
        while (!q.empty()) {
            int u = q.front();
            q.pop();
            diam = max(diam, dist[u]);
            for (int v : adj[u]) {
                if (dist[v] == -1) {
                    dist[v] = dist[u] + 1;
                    q.push(v);
                }
            }
        }
    }
    cout << diam << "\n";
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
    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < n - 1; i++) {
        int u, v;
        cin >> u >> v;
        adj[u].push_back(v);
        adj[v].push_back(u);
    }
    // Bug: only 1 BFS from root 1 (gives tree height from 1, not diameter)
    vector<int> dist(n + 1, -1);
    queue<int> q;
    q.push(1);
    dist[1] = 0;
    int max_d = 0;
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        max_d = max(max_d, dist[u]);
        for (int v : adj[u]) {
            if (dist[v] == -1) {
                dist[v] = dist[u] + 1;
                q.push(v);
            }
        }
    }
    cout << max_d << "\n";
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
    string type = opt<string>("type", "random");

    println(n);
    vector<pair<int, int>> edges;
    if (type == "line") {
        for (int i = 1; i < n; i++) edges.push_back({i, i + 1});
    } else if (type == "star") {
        for (int i = 2; i <= n; i++) edges.push_back({1, i});
    } else {
        for (int i = 2; i <= n; i++) {
            int p = rnd.next(1, i - 1);
            edges.push_back({p, i});
        }
    }
    for (auto& e : edges) {
        println(e.first, e.second);
    }
    return 0;
}

/*
FreeMarker script example:
Executable name must match this file's base name: generator

generator -n 1 > $
generator -n 2 > $
generator -n 5 -type line > $
generator -n 5 -type star > $
generator -n 10 1 > $
generator -n 50 2 > $
generator -n 1000 3 > $
generator -n 200000 4 > $
*/
""",
        "samples": [
            ("5\n1 2\n1 3\n3 4\n3 5\n", "3\n")
        ],
        "validator_tests": [
            ("valid_min.in", "1\n", True),
            ("valid_sample.in", "5\n1 2\n1 3\n3 4\n3 5\n", True),
            ("invalid_cycle.in", "3\n1 2\n2 3\n3 1\n", False),
            ("invalid_self_loop.in", "2\n1 1\n", False),
            ("invalid_n_zero.in", "0\n\n", False),
        ]
    }
]
