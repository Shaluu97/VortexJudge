import os
import sys
import subprocess
from pathlib import Path

BASE_DIR = Path("problems")

PROBLEMS = [
    # ── MAVZU 1: Tub sonlar va Eratosfen g'alviri ──────────────────────────────
    {
        "id": "p01_prime_check",
        "title": "Tublikka Tekshirish (Prime Checking)",
        "topic": "Tub sonlar va Eratosfen g'alviri",
        "difficulty": 1,
        "time_limit": "1.0s",
        "memory_limit": "256MB",
        "statement": """# Tublikka Tekshirish (Prime Checking)

Berilgan butun $N$ sonining tub yoki tub emasligini aniqlash talab etiladi.

Eslatma: $1$ dan katta bo'lgan va faqat $1$ ga hamda o'ziga bo'linadigan natural son **tub son** (prime number) deyiladi. $1$ soni tub ham, murakkab ham emas.

### Kiruvchi ma'lumotlar
Birinchi qatorda so'rovlar soni $T$ ($1 \\le T \\le 100$) kiritiladi.
Keyingi $T$ ta qatorda bittadan natural son $N$ ($1 \\le N \\le 10^{12}$) beriladi.

### Chiquvchi ma'lumotlar
Har bir so'rov uchun alohida qatorda:
- Agar son tub bo'lsa `YES`;
- Aks holda `NO` so'zini chiqaring.

### Namuna
#### Kiruvchi ma'lumotlar
```text
4
1
2
7
1000000000000
```
#### Chiquvchi ma'lumotlar
```text
NO
YES
YES
NO
```

### Tushuntirish
- $1$ tub son emas.
- $2$ va $7$ faqat $1$ ga va o'ziga bo'linadi, shuning uchun `YES`.
- $10^{12}$ soni juft murakkab son, shuning uchun `NO`.
""",
        "solution": """#include <iostream>

using namespace std;

bool is_prime(long long n) {
    if (n <= 1) return false;
    if (n <= 3) return true;
    if (n % 2 == 0 || n % 3 == 0) return false;
    for (long long i = 5; i * i <= n; i += 6) {
        if (n % i == 0 || n % (i + 2) == 0) return false;
    }
    return true;
}

void solve() {
    long long n;
    cin >> n;
    if (is_prime(n)) {
        cout << "YES\\n";
    } else {
        cout << "NO\\n";
    }
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int t;
    if (cin >> t) {
        while (t--) solve();
    }
    return 0;
}
""",
        "brute": """#include <iostream>

using namespace std;

bool is_prime_brute(long long n) {
    if (n <= 1) return false;
    for (long long i = 2; i < n; ++i) {
        if (n % i == 0) return false;
    }
    return true;
}

void solve() {
    long long n;
    cin >> n;
    if (is_prime_brute(n)) cout << "YES\\n";
    else cout << "NO\\n";
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int t;
    if (cin >> t) {
        while (t--) solve();
    }
    return 0;
}
""",
        "generator": """#include <iostream>
#include <random>
#include <chrono>

using namespace std;

int main(int argc, char* argv[]) {
    mt19937_64 rng(chrono::steady_clock::now().time_since_epoch().count());
    int t = 10;
    cout << t << "\\n";
    cout << 1 << "\\n";
    cout << 2 << "\\n";
    cout << 3 << "\\n";
    cout << 999999999989LL << "\\n"; // large prime
    for (int i = 5; i <= t; ++i) {
        long long n = 1 + (rng() % 1000000000000LL);
        cout << n << "\\n";
    }
    return 0;
}
""",
        "validator": """#include <iostream>

using namespace std;

int main() {
    int t;
    if (!(cin >> t)) return 1;
    if (t < 1 || t > 100) return 1;
    while (t--) {
        long long n;
        if (!(cin >> n)) return 1;
        if (n < 1 || n > 1000000000000LL) return 1;
    }
    return 0;
}
""",
        "sample_in": "4\n1\n2\n7\n1000000000000\n",
        "corner_in": "5\n1\n2\n3\n999999999989\n1000000000000\n"
    },

    {
        "id": "p02_sieve_range_primes",
        "title": "Oraliqdagi Tub Sonlar Soni (Prime Counting in Range)",
        "topic": "Tub sonlar va Eratosfen g'alviri",
        "difficulty": 2,
        "time_limit": "1.5s",
        "memory_limit": "256MB",
        "statement": """# Oraliqdagi Tub Sonlar Soni (Prime Counting in Range)

Sizga $Q$ ta so'rov beriladi. Har bir so'rovda ikkita butun son $L$ va $R$ beriladi. Siz $[L, R]$ oralig'ida nechta tub son borligini aniqlashingiz kerak.

Oraliq chegaralari $10^7$ dan oshmaydi, so'rovlar soni esa $2 \\cdot 10^5$ tagacha bo'lishi mumkin.

### Kiruvchi ma'lumotlar
Birinchi qatorda so'rovlar soni $Q$ ($1 \\le Q \\le 2 \\cdot 10^5$) beriladi.
Keyingi $Q$ ta qatorda ikkitadan butun son $L$ va $R$ ($1 \\le L \\le R \\le 10^7$) kiritiladi.

### Chiquvchi ma'lumotlar
Har bir so'rov uchun alohida qatorda $[L, R]$ oralig'idagi tub sonlar sonini chop eting.

### Namuna
#### Kiruvchi ma'lumotlar
```text
3
1 10
5 5
10 20
```
#### Chiquvchi ma'lumotlar
```text
4
1
4
```

### Tushuntirish
- $[1, 10]$ oralig'idagi tub sonlar: $2, 3, 5, 7$ (jami 4 ta).
- $[5, 5]$ oralig'ida bitta $5$ tub soni bor.
- $[10, 20]$ oralig'ida: $11, 13, 17, 19$ (jami 4 ta).
""",
        "solution": """#include <iostream>
#include <vector>

using namespace std;

const int MAXN = 10000000;
vector<bool> is_prime(MAXN + 1, true);
vector<int> pref(MAXN + 1, 0);

void sieve() {
    is_prime[0] = is_prime[1] = false;
    for (int p = 2; p * p <= MAXN; ++p) {
        if (is_prime[p]) {
            for (int i = p * p; i <= MAXN; i += p) {
                is_prime[i] = false;
            }
        }
    }
    for (int i = 1; i <= MAXN; ++i) {
        pref[i] = pref[i - 1] + (is_prime[i] ? 1 : 0);
    }
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    sieve();
    int q;
    if (cin >> q) {
        while (q--) {
            int l, r;
            cin >> l >> r;
            cout << pref[r] - pref[l - 1] << "\\n";
        }
    }
    return 0;
}
""",
        "brute": """#include <iostream>

using namespace std;

bool check(int n) {
    if (n <= 1) return false;
    for (int i = 2; i * i <= n; ++i) {
        if (n % i == 0) return false;
    }
    return true;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int q;
    if (cin >> q) {
        while (q--) {
            int l, r;
            cin >> l >> r;
            int ans = 0;
            for (int i = l; i <= r; ++i) {
                if (check(i)) ans++;
            }
            cout << ans << "\\n";
        }
    }
    return 0;
}
""",
        "generator": """#include <iostream>
#include <random>
#include <chrono>

using namespace std;

int main() {
    mt19937 rng(chrono::steady_clock::now().time_since_epoch().count());
    int q = 5;
    cout << q << "\\n";
    cout << "1 10\\n";
    cout << "1 10000000\\n";
    for (int i = 3; i <= q; ++i) {
        int a = 1 + (rng() % 1000000);
        int b = a + (rng() % 1000000);
        cout << a << " " << b << "\\n";
    }
    return 0;
}
""",
        "validator": """#include <iostream>

using namespace std;

int main() {
    int q;
    if (!(cin >> q)) return 1;
    if (q < 1 || q > 200000) return 1;
    while (q--) {
        int l, r;
        if (!(cin >> l >> r)) return 1;
        if (l < 1 || l > r || r > 10000000) return 1;
    }
    return 0;
}
""",
        "sample_in": "3\n1 10\n5 5\n10 20\n",
        "corner_in": "3\n1 1\n1 2\n9999900 10000000\n"
    },

    {
        "id": "p03_segmented_sieve",
        "title": "Segmentlangan G'alvir (Segmented Sieve)",
        "topic": "Tub sonlar va Eratosfen g'alviri",
        "difficulty": 3,
        "time_limit": "1.0s",
        "memory_limit": "256MB",
        "statement": """# Segmentlangan G'alvir (Segmented Sieve)

Sizga ikkita katta butun son $L$ va $R$ beriladi ($1 \\le L \\le R \\le 10^{12}$).
Biroq oraliq uzunligi $R - L \\le 10^6$ dan oshmasligi kafolatlangan.

Vazifangiz: $[L, R]$ oralig'idagi barcha tub sonlar sonini va ularning XOR yig'indisini (bitwise XOR) hisoblang.

### Kiruvchi ma'lumotlar
Yagona qatorda ikkita butun son $L$ va $R$ ($1 \\le L \\le R \\le 10^{12}, R - L \\le 10^6$) kiritiladi.

### Chiquvchi ma'lumotlar
Ikkita butun sonni bo'sh joy bilan ajratib chop eting:
1. $[L, R]$ oralig'idagi tub sonlar soni;
2. Ushbu tub sonlarning bitwise XOR yig'indisi (agar oraliqda tub son bo'lmasa, $0$).

### Namuna
#### Kiruvchi ma'lumotlar
```text
1 10
```
#### Chiquvchi ma'lumotlar
```text
4 3
```

### Tushuntirish
$[1, 10]$ oralig'idagi tub sonlar: $2, 3, 5, 7$.
- Tub sonlar soni: 4 ta.
- XOR yig'indisi: $2 \\oplus 3 \\oplus 5 \\oplus 7 = 3$.
""",
        "solution": """#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    long long L, R;
    if (!(cin >> L >> R)) return 0;

    long long limit = 1000000; // sqrt(10^12)
    vector<bool> is_prime(limit + 1, true);
    is_prime[0] = is_prime[1] = false;
    vector<long long> primes;
    for (long long p = 2; p <= limit; ++p) {
        if (is_prime[p]) {
            primes.push_back(p);
            for (long long j = p * p; j <= limit; j += p) {
                is_prime[j] = false;
            }
        }
    }

    int len = (int)(R - L + 1);
    vector<bool> is_seg_prime(len, true);

    for (long long p : primes) {
        if (p * p > R) break;
        long long start = max(p * p, ((L + p - 1) / p) * p);
        for (long long j = start; j <= R; j += p) {
            is_seg_prime[j - L] = false;
        }
    }

    long long count = 0;
    long long xor_sum = 0;
    for (long long i = 0; i < len; ++i) {
        long long val = L + i;
        if (val > 1 && is_seg_prime[i]) {
            count++;
            xor_sum ^= val;
        }
    }

    cout << count << " " << xor_sum << "\\n";
    return 0;
}
""",
        "brute": """#include <iostream>

using namespace std;

bool check(long long n) {
    if (n <= 1) return false;
    for (long long i = 2; i * i <= n; ++i) {
        if (n % i == 0) return false;
    }
    return true;
}

int main() {
    long long L, R;
    cin >> L >> R;
    long long count = 0, xor_sum = 0;
    for (long long i = L; i <= R; ++i) {
        if (check(i)) {
            count++;
            xor_sum ^= i;
        }
    }
    cout << count << " " << xor_sum << "\\n";
    return 0;
}
""",
        "generator": """#include <iostream>
#include <random>
#include <chrono>

using namespace std;

int main() {
    mt19937_64 rng(chrono::steady_clock::now().time_since_epoch().count());
    long long L = 999999000000LL + (rng() % 500000LL);
    long long R = L + 50000LL;
    cout << L << " " << R << "\\n";
    return 0;
}
""",
        "validator": """#include <iostream>

using namespace std;

int main() {
    long long l, r;
    if (!(cin >> l >> r)) return 1;
    if (l < 1 || l > r || r > 1000000000000LL) return 1;
    if (r - l > 1000000LL) return 1;
    return 0;
}
""",
        "sample_in": "1 10\n",
        "corner_in": "1 2\n"
    },

    {
        "id": "p04_linear_sieve_spf",
        "title": "Chiziqli G'alvir va Tub Bo'luvchilar (Linear Sieve & Omega Function)",
        "topic": "Tub sonlar va Eratosfen g'alviri",
        "difficulty": 4,
        "time_limit": "2.0s",
        "memory_limit": "256MB",
        "statement": """# Chiziqli G'alvir va Tub Bo'luvchilar (Linear Sieve & Omega Function)

Har bir butun $X$ soni uchun:
- $\\omega(X)$ — sonning turlicha (unikal) tub bo'luvchilari soni;
- $\\Omega(X)$ — sonning barcha tub bo'luvchilarining karrali (darajalari bilan) umumiy soni.

Masalan: $X = 12 = 2^2 \\times 3^1$ bo'lsa:
- $\\omega(12) = 2$ ($2$ va $3$);
- $\\Omega(12) = 2 + 1 = 3$.

Sizga $Q$ ta so'rov beriladi. Har bir so'rovda berilgan $X$ uchun $\\omega(X)$ va $\\Omega(X)$ qiymatlarini aniqlang.

### Kiruvchi ma'lumotlar
Birinchi qatorda so'rovlar soni $Q$ ($1 \\le Q \\le 10^6$) beriladi.
Keyingi $Q$ ta qatorda bittadan butun son $X$ ($2 \\le X \\le 10^7$) kiritiladi.

### Chiquvchi ma'lumotlar
Har bir so'rov uchun alohida qatorda ikkita son: $\\omega(X)$ va $\\Omega(X)$ ni bo'sh joy bilan ajratib chop eting.

### Namuna
#### Kiruvchi ma'lumotlar
```text
3
12
7
360
```
#### Chiquvchi ma'lumotlar
```text
2 3
1 1
3 6
```

### Tushuntirish
- $12 = 2^2 \\times 3^1 \\implies \\omega=2, \\Omega=3$.
- $7 = 7^1 \\implies \\omega=1, \\Omega=1$.
- $360 = 2^3 \\times 3^2 \\times 5^1 \\implies \\omega=3, \\Omega=3+2+1=6$.
""",
        "solution": """#include <iostream>
#include <vector>

using namespace std;

const int MAXN = 10000000;
int spf[MAXN + 1];
int omega[MAXN + 1];
int big_omega[MAXN + 1];
vector<int> primes;

void linear_sieve() {
    for (int i = 2; i <= MAXN; ++i) {
        if (spf[i] == 0) {
            spf[i] = i;
            omega[i] = 1;
            big_omega[i] = 1;
            primes.push_back(i);
        }
        for (int p : primes) {
            if (p > spf[i] || 1LL * i * p > MAXN) break;
            int next_val = i * p;
            spf[next_val] = p;
            big_omega[next_val] = big_omega[i] + 1;
            if (p == spf[i]) {
                omega[next_val] = omega[i];
            } else {
                omega[next_val] = omega[i] + 1;
            }
        }
    }
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    linear_sieve();

    int q;
    if (cin >> q) {
        while (q--) {
            int x;
            cin >> x;
            cout << omega[x] << " " << big_omega[x] << "\\n";
        }
    }
    return 0;
}
""",
        "brute": """#include <iostream>

using namespace std;

void factor(int x, int &om, int &big_om) {
    om = 0;
    big_om = 0;
    for (int i = 2; i * i <= x; ++i) {
        if (x % i == 0) {
            om++;
            while (x % i == 0) {
                big_om++;
                x /= i;
            }
        }
    }
    if (x > 1) {
        om++;
        big_om++;
    }
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int q;
    if (cin >> q) {
        while (q--) {
            int x;
            cin >> x;
            int om, big_om;
            factor(x, om, big_om);
            cout << om << " " << big_om << "\\n";
        }
    }
    return 0;
}
""",
        "generator": """#include <iostream>
#include <random>
#include <chrono>

using namespace std;

int main() {
    mt19937 rng(chrono::steady_clock::now().time_since_epoch().count());
    int q = 5;
    cout << q << "\\n";
    cout << "2\\n";
    cout << "10000000\\n";
    for (int i = 3; i <= q; ++i) {
        cout << 2 + (rng() % 9999998) << "\\n";
    }
    return 0;
}
""",
        "validator": """#include <iostream>

using namespace std;

int main() {
    int q;
    if (!(cin >> q)) return 1;
    if (q < 1 || q > 1000000) return 1;
    while (q--) {
        int x;
        if (!(cin >> x)) return 1;
        if (x < 2 || x > 10000000) return 1;
    }
    return 0;
}
""",
        "sample_in": "3\n12\n7\n360\n",
        "corner_in": "2\n2\n9999991\n"
    },

    {
        "id": "p05_lehmer_prime_count",
        "title": "Katta Oraliqda Tub Sonlar Soni (Sublinear Prime Counting)",
        "topic": "Tub sonlar va Eratosfen g'alviri",
        "difficulty": 5,
        "time_limit": "1.5s",
        "memory_limit": "256MB",
        "statement": """# Katta Oraliqda Tub Sonlar Soni (Sublinear Prime Counting)

Sizga bitta butun son $N$ ($1 \\le N \\le 10^{11}$) beriladi.
$N$ dan oshmaydigan barcha tub sonlar soni $\\pi(N)$ ni topish talab qilinadi.

Cheklov juda katta bo'lgani sababli oddiy $O(N)$ g'alvir Time Limitga tushadi. Ushbu masalada $O(N^{3/4})$ yoki undan tezroq ishlovchi Meissel-Lehmer yoki Lucy's Algorithm talab etiladi.

### Kiruvchi ma'lumotlar
Yagona qatorda bitta butun son $N$ ($1 \\le N \\le 10^{11}$) kiritiladi.

### Chiquvchi ma'lumotlar
$\\pi(N)$ ning qiymatini alohida qatorda chop eting.

### Namuna
#### Kiruvchi ma'lumotlar
```text
100
```
#### Chiquvchi ma'lumotlar
```text
25
```

### Namuna 2
#### Kiruvchi ma'lumotlar
```text
10000000000
```
#### Chiquvchi ma'lumotlar
```text
455052511
```

### Tushuntirish
- $100$ gacha bo'lgan tub sonlar soni 25 ta.
- $10^{10}$ gacha bo'lgan tub sonlar soni 455052511 ta.
""",
        "solution": """#include <iostream>
#include <vector>
#include <cmath>

using namespace std;

// Lucy Hedgehog Algorithm in O(N^(3/4))
long long prime_count(long long n) {
    if (n <= 1) return 0;
    long long v = sqrt(n);
    vector<long long> small(v + 1);
    vector<long long> large(v + 1);

    for (long long i = 1; i <= v; ++i) {
        small[i] = i - 1;
        large[i] = n / i - 1;
    }

    for (long long p = 2; p <= v; ++p) {
        if (small[p] == small[p - 1]) continue;
        long long count = small[p - 1];
        long long p2 = p * p;
        long long end = min(v, n / p2);

        for (long long i = 1; i <= end; ++i) {
            long long d = i * p;
            if (d <= v) {
                large[i] -= large[d] - count;
            } else {
                large[i] -= small[n / d] - count;
            }
        }
        for (long long i = v; i >= p2; --i) {
            small[i] -= small[i / p] - count;
        }
    }
    return large[1];
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    long long n;
    if (cin >> n) {
        cout << prime_count(n) << "\\n";
    }
    return 0;
}
""",
        "brute": """#include <iostream>
#include <vector>

using namespace std;

int main() {
    long long n;
    cin >> n;
    if (n <= 1) { cout << 0 << "\\n"; return 0; }
    vector<bool> is_p(n + 1, true);
    long long ans = 0;
    for (long long p = 2; p <= n; ++p) {
        if (is_p[p]) {
            ans++;
            for (long long j = p * p; j <= n; j += p) is_p[j] = false;
        }
    }
    cout << ans << "\\n";
    return 0;
}
""",
        "generator": """#include <iostream>
#include <random>
#include <chrono>

using namespace std;

int main() {
    mt19937_64 rng(chrono::steady_clock::now().time_since_epoch().count());
    long long n = 10000000000LL + (rng() % 90000000000LL);
    cout << n << "\\n";
    return 0;
}
""",
        "validator": """#include <iostream>

using namespace std;

int main() {
    long long n;
    if (!(cin >> n)) return 1;
    if (n < 1 || n > 100000000000LL) return 1;
    return 0;
}
""",
        "sample_in": "100\n",
        "corner_in": "1\n"
    },

    # ── MAVZU 2: Sonning bo'luvchilari va tub bo'luvchilar ─────────────────────
    {
        "id": "p06_count_sum_divisors",
        "title": "Bo'luvchilar Soni va Yig'indisi (Divisor Count and Sum)",
        "topic": "Sonning bo'luvchilari va tub bo'luvchilar",
        "difficulty": 1,
        "time_limit": "1.0s",
        "memory_limit": "256MB",
        "statement": """# Bo'luvchilar Soni va Yig'indisi (Divisor Count and Sum)

Berilgan bitta musbat butun $N$ sonining barcha natural bo'luvchilari soni $d(N)$ hamda ularning yig'indisi $\\sigma(N)$ ni aniqlang.

### Kiruvchi ma'lumotlar
Yagona qatorda bitta butun son $N$ ($1 \\le N \\le 10^{12}$) beriladi.

### Chiquvchi ma'lumotlar
Ikkita butun sonni bo'sh joy bilan ajratib chop eting:
1. Bo'luvchilar soni $d(N)$;
2. Bo'luvchilar yig'indisi $\\sigma(N)$.

### Namuna
#### Kiruvchi ma'lumotlar
```text
12
```
#### Chiquvchi ma'lumotlar
```text
6 28
```

### Tushuntirish
$12$ ning bo'luvchilari: $1, 2, 3, 4, 6, 12$.
- Soni: 6 ta;
- Yig'indisi: $1 + 2 + 3 + 4 + 6 + 12 = 28$.
""",
        "solution": """#include <iostream>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    long long n;
    if (cin >> n) {
        long long count = 0;
        long long sum = 0;
        for (long long i = 1; i * i <= n; ++i) {
            if (n % i == 0) {
                count++;
                sum += i;
                if (i * i != n) {
                    count++;
                    sum += n / i;
                }
            }
        }
        cout << count << " " << sum << "\\n";
    }
    return 0;
}
""",
        "brute": """#include <iostream>

using namespace std;

int main() {
    long long n;
    cin >> n;
    long long c = 0, s = 0;
    for (long long i = 1; i <= n; ++i) {
        if (n % i == 0) {
            c++;
            s += i;
        }
    }
    cout << c << " " << s << "\\n";
    return 0;
}
""",
        "generator": """#include <iostream>
#include <random>
#include <chrono>

using namespace std;

int main() {
    mt19937_64 rng(chrono::steady_clock::now().time_since_epoch().count());
    long long n = 1 + (rng() % 1000000000000LL);
    cout << n << "\\n";
    return 0;
}
""",
        "validator": """#include <iostream>

using namespace std;

int main() {
    long long n;
    if (!(cin >> n)) return 1;
    if (n < 1 || n > 1000000000000LL) return 1;
    return 0;
}
""",
        "sample_in": "12\n",
        "corner_in": "1\n"
    },

    {
        "id": "p07_common_divisors",
        "title": "Umumiy Bo'luvchilar Soni (Common Divisors Count)",
        "topic": "Sonning bo'luvchilari va tub bo'luvchilar",
        "difficulty": 2,
        "time_limit": "1.0s",
        "memory_limit": "256MB",
        "statement": """# Umumiy Bo'luvchilar Soni (Common Divisors Count)

Sizga $Q$ ta so'rov beriladi. Har bir so'rovda ikkita musbat butun son $A$ va $B$ beriladi.
Ushbu ikki sonning barcha umumiy musbat bo'luvchilari sonini aniqlang.

### Kiruvchi ma'lumotlar
Birinchi qatorda so'rovlar soni $Q$ ($1 \\le Q \\le 10^5$) beriladi.
Keyingi $Q$ ta qatorda ikkitadan butun son $A$ va $B$ ($1 \\le A, B \\le 10^{12}$) kiritiladi.

### Chiquvchi ma'lumotlar
Har bir so'rov uchun alohida qatorda umumiy bo'luvchilar sonini chiqaring.

### Namuna
#### Kiruvchi ma'lumotlar
```text
3
12 18
10 15
7 13
```
#### Chiquvchi ma'lumotlar
```text
4
2
1
```

### Tushuntirish
- $12$ va $18$ ning umumiy bo'luvchilari: $1, 2, 3, 6$ (jami 4 ta).
- $10$ va $15$ uchun: $1, 5$ (jami 2 ta).
- $7$ va $13$ uchun faqat $1$ (jami 1 ta).
""",
        "solution": """#include <iostream>
#include <numeric>

using namespace std;

long long gcd(long long a, long long b) {
    while (b) {
        a %= b;
        swap(a, b);
    }
    return a;
}

long long count_divisors(long long n) {
    long long count = 0;
    for (long long i = 1; i * i <= n; ++i) {
        if (n % i == 0) {
            count++;
            if (i * i != n) count++;
        }
    }
    return count;
}

void solve() {
    long long a, b;
    cin >> a >> b;
    long long g = gcd(a, b);
    cout << count_divisors(g) << "\\n";
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int q;
    if (cin >> q) {
        while (q--) solve();
    }
    return 0;
}
""",
        "brute": """#include <iostream>
#include <algorithm>

using namespace std;

void solve() {
    long long a, b;
    cin >> a >> b;
    long long m = min(a, b);
    long long ans = 0;
    for (long long i = 1; i <= m; ++i) {
        if (a % i == 0 && b % i == 0) ans++;
    }
    cout << ans << "\\n";
}

int main() {
    int q;
    if (cin >> q) {
        while (q--) solve();
    }
    return 0;
}
""",
        "generator": """#include <iostream>
#include <random>
#include <chrono>

using namespace std;

int main() {
    mt19937_64 rng(chrono::steady_clock::now().time_since_epoch().count());
    int q = 5;
    cout << q << "\\n";
    cout << "12 18\\n";
    cout << "1000000000000 1000000000000\\n";
    for (int i = 3; i <= q; ++i) {
        long long a = 1 + (rng() % 1000000000000LL);
        long long b = 1 + (rng() % 1000000000000LL);
        cout << a << " " << b << "\\n";
    }
    return 0;
}
""",
        "validator": """#include <iostream>

using namespace std;

int main() {
    int q;
    if (!(cin >> q)) return 1;
    if (q < 1 || q > 100000) return 1;
    while (q--) {
        long long a, b;
        if (!(cin >> a >> b)) return 1;
        if (a < 1 || a > 1000000000000LL || b < 1 || b > 1000000000000LL) return 1;
    }
    return 0;
}
""",
        "sample_in": "3\n12 18\n10 15\n7 13\n",
        "corner_in": "2\n1 1\n1000000000000 1000000000000\n"
    },

    {
        "id": "p08_sum_divisors_range",
        "title": "Barcha Sonlar Bo'luvchilari Yig'indisi (Sum of Divisors Sum)",
        "topic": "Sonning bo'luvchilari va tub bo'luvchilar",
        "difficulty": 3,
        "time_limit": "1.0s",
        "memory_limit": "256MB",
        "statement": """# Barcha Sonlar Bo'luvchilari Yig'indisi (Sum of Divisors Sum)

$\\sigma(i)$ orqali $i$ sonining barcha natural bo'luvchilari yig'indisini belgilaymiz.
Masalan: $\\sigma(1) = 1, \\sigma(2) = 3, \\sigma(3) = 4, \\sigma(4) = 7$.

Sizga butun son $N$ ($1 \\le N \\le 10^{12}$) beriladi.
Quyidagi ifodaning $10^9+7$ bo'yicha qoldig'ini hisoblang:
$$\\sum_{i=1}^N \\sigma(i) \\pmod{10^9+7}$$

### Kiruvchi ma'lumotlar
Yagona qatorda bitta butun son $N$ ($1 \\le N \\le 10^{12}$) kiritiladi.

### Chiquvchi ma'lumotlar
Javobni $10^9+7$ moduli bo'yicha chop eting.

### Namuna
#### Kiruvchi ma'lumotlar
```text
4
```
#### Chiquvchi ma'lumotlar
```text
15
```

### Tushuntirish
$N=4$ bo'lsa:
$\\sigma(1) = 1$
$\\sigma(2) = 1 + 2 = 3$
$\\sigma(3) = 1 + 3 = 4$
$\\sigma(4) = 1 + 2 + 4 = 7$
Yig'indi: $1 + 3 + 4 + 7 = 15$.
""",
        "solution": """#include <iostream>

using namespace std;

const long long MOD = 1000000007;

// Sum from L to R: (L + R) * (R - L + 1) / 2 % MOD
long long sum_range(long long L, long long R) {
    long long count = (R - L + 1) % MOD;
    long long total = (L % MOD + R % MOD) % MOD;
    long long res = (count * total) % MOD;
    if (res % 2 != 0) res += MOD;
    return (res / 2) % MOD;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    long long n;
    if (cin >> n) {
        long long ans = 0;
        long long l = 1;
        while (l <= n) {
            long long k = n / l;
            long long r = n / k;
            long long term = (sum_range(l, r) * (k % MOD)) % MOD;
            ans = (ans + term) % MOD;
            l = r + 1;
        }
        cout << ans << "\\n";
    }
    return 0;
}
""",
        "brute": """#include <iostream>

using namespace std;

const int MOD = 1000000007;

int main() {
    long long n;
    cin >> n;
    long long ans = 0;
    for (long long i = 1; i <= n; ++i) {
        for (long long d = 1; d * d <= i; ++d) {
            if (i % d == 0) {
                ans = (ans + d) % MOD;
                if (d * d != i) ans = (ans + i / d) % MOD;
            }
        }
    }
    cout << ans << "\\n";
    return 0;
}
""",
        "generator": """#include <iostream>
#include <random>
#include <chrono>

using namespace std;

int main() {
    mt19937_64 rng(chrono::steady_clock::now().time_since_epoch().count());
    long long n = 1000000000LL + (rng() % 999000000000LL);
    cout << n << "\\n";
    return 0;
}
""",
        "validator": """#include <iostream>

using namespace std;

int main() {
    long long n;
    if (!(cin >> n)) return 1;
    if (n < 1 || n > 1000000000000LL) return 1;
    return 0;
}
""",
        "sample_in": "4\n",
        "corner_in": "1\n"
    },

    {
        "id": "p09_highly_composite_num",
        "title": "Anti-Tub Sonlar (Highly Composite Numbers)",
        "topic": "Sonning bo'luvchilari va tub bo'luvchilar",
        "difficulty": 4,
        "time_limit": "1.0s",
        "memory_limit": "256MB",
        "statement": """# Anti-Tub Sonlar (Highly Composite Numbers)

O'zidan kichik bo'lgan barcha musbat butun sonlardan ko'ra ko'proq natural bo'luvchiga ega bo'lgan son **Anti-tub son** (Highly Composite Number) deyiladi.

Sizga bitta butun son $N$ ($1 \\le N \\le 10^{18}$) beriladi.
$N$ dan oshmaydigan sonlar orasida eng ko'p bo'luvchilar soniga ega bo'lgan eng kichik sonni $X$ ni va uning bo'luvchilar soni $d(X)$ ni toping.

### Kiruvchi ma'lumotlar
Yagona qatorda bitta butun son $N$ ($1 \\le N \\le 10^{18}$) kiritiladi.

### Chiquvchi ma'lumotlar
Ikkita butun sonni bo'sh joy bilan ajratib chop eting:
1. $N$ dan oshmaydigan optimal son $X$;
2. Uning bo'luvchilar soni $d(X)$.

### Namuna
#### Kiruvchi ma'lumotlar
```text
10
```
#### Chiquvchi ma'lumotlar
```text
6 4
```

### Namuna 2
#### Kiruvchi ma'lumotlar
```text
100
```
#### Chiquvchi ma'lumotlar
```text
60 12
```

### Tushuntirish
- $10$ gacha bo'lgan sonlar orasida eng ko'p bo'luvchiga ega bo'lgan sonlar $6$ va $10$ (har ikkalasida 4 tadan bo'luvchi). Eng kichigi $6$.
- $100$ gacha bo'lgan sonlar orasida $60$ soni 12 ta bo'luvchiga ega.
""",
        "solution": """#include <iostream>
#include <vector>

using namespace std;

const vector<int> primes = {2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53};

unsigned long long N;
unsigned long long best_num = 1;
unsigned long long max_divs = 1;

void dfs(size_t prime_idx, int max_exp, unsigned long long current_num, unsigned long long current_divs) {
    if (current_divs > max_divs || (current_divs == max_divs && current_num < best_num)) {
        max_divs = current_divs;
        best_num = current_num;
    }
    if (prime_idx >= primes.size()) return;

    unsigned long long p = primes[prime_idx];
    for (int exp = 1; exp <= max_exp; ++exp) {
        if (__builtin_mul_overflow(current_num, p, &current_num)) break;
        if (current_num > N) break;
        dfs(prime_idx + 1, exp, current_num, current_divs * (exp + 1));
    }
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    if (cin >> N) {
        dfs(0, 60, 1, 1);
        cout << best_num << " " << max_divs << "\\n";
    }
    return 0;
}
""",
        "brute": """#include <iostream>

using namespace std;

long long count_divs(long long n) {
    long long c = 0;
    for (long long i = 1; i * i <= n; ++i) {
        if (n % i == 0) {
            c++;
            if (i * i != n) c++;
        }
    }
    return c;
}

int main() {
    long long n;
    cin >> n;
    long long best_num = 1, max_d = 1;
    for (long long i = 1; i <= n; ++i) {
        long long d = count_divs(i);
        if (d > max_d) {
            max_d = d;
            best_num = i;
        }
    }
    cout << best_num << " " << max_d << "\\n";
    return 0;
}
""",
        "generator": """#include <iostream>
#include <random>
#include <chrono>

using namespace std;

int main() {
    mt19937_64 rng(chrono::steady_clock::now().time_since_epoch().count());
    unsigned long long n = 1000000000000000LL + (rng() % 900000000000000000ULL);
    cout << n << "\\n";
    return 0;
}
""",
        "validator": """#include <iostream>

using namespace std;

int main() {
    unsigned long long n;
    if (!(cin >> n)) return 1;
    if (n < 1 || n > 1000000000000000000ULL) return 1;
    return 0;
}
""",
        "sample_in": "10\n",
        "corner_in": "1\n"
    },

    {
        "id": "p10_pollard_rho_factor",
        "title": "Tezkor Faktorizatsiya (Pollard's Rho Factorization)",
        "topic": "Sonning bo'luvchilari va tub bo'luvchilar",
        "difficulty": 5,
        "time_limit": "1.5s",
        "memory_limit": "256MB",
        "statement": """# Tezkor Faktorizatsiya (Pollard's Rho Factorization)

Sizga $T$ ta so'rovda juda katta butun sonlar beriladi ($2 \\le N \\le 10^{18}$).
Har bir sonni tub ko'paytuvchilarga ajrating va ularni o'sish tartibida chop eting.

Oddiy $O(\\sqrt{N})$ usuli $10^{18}$ da TLE beradi. Miller-Rabin deterministik tublik testi hamda Pollard's Rho algoritmi ($O(N^{1/4})$) talab etiladi.

### Kiruvchi ma'lumotlar
Birinchi qatorda so'rovlar soni $T$ ($1 \\le T \\le 100$) kiritiladi.
Keyingi $T$ ta qatorda bittadan butun son $N$ ($2 \\le N \\le 10^{18}$) beriladi.

### Chiquvchi ma'lumotlar
Har bir so'rov uchun alohida qatorda $N$ ning barcha tub ko'paytuvchilarini o'sish tartibida, bo'sh joy bilan ajratib chop eting (karrali ko'paytuvchilar necha marta qatnashsa, shuncha marta yoziladi).

### Namuna
#### Kiruvchi ma'lumotlar
```text
3
12
999999999989
1000000000000000000
```
#### Chiquvchi ma'lumotlar
```text
2 2 3
999999999989
2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5
```

### Tushuntirish
- $12 = 2 \\times 2 \\times 3$.
- $999999999989$ o'zi tub son.
- $10^{18} = 2^{18} \\times 5^{18}$.
""",
        "solution": """#include <iostream>
#include <vector>
#include <numeric>
#include <algorithm>

using namespace std;

using u128 = __uint128_t;
using u64 = unsigned long long;

u64 power(u64 base, u64 exp, u64 mod) {
    u64 res = 1;
    base %= mod;
    while (exp > 0) {
        if (exp % 2 == 1) res = (u128)res * base % mod;
        base = (u128)base * base % mod;
        exp /= 2;
    }
    return res;
}

bool miller_rabin(u64 n) {
    if (n < 2) return false;
    for (u64 p : {2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37}) {
        if (n % p == 0) return n == p;
    }
    int s = __builtin_ctzll(n - 1);
    u64 d = (n - 1) >> s;
    for (u64 a : {2, 325, 9375, 28178, 450775, 9780504, 1795265022}) {
        if (a % n == 0) continue;
        u64 x = power(a, d, n);
        if (x == 1 || x == n - 1) continue;
        bool composite = true;
        for (int r = 1; r < s; ++r) {
            x = (u128)x * x % n;
            if (x == n - 1) {
                composite = false;
                break;
            }
        }
        if (composite) return false;
    }
    return true;
}

u64 gcd_u64(u64 a, u64 b) {
    while (b) {
        a %= b;
        swap(a, b);
    }
    return a;
}

u64 pollard_rho(u64 n) {
    if (n % 2 == 0) return 2;
    auto f = [n](u64 x, u64 c) {
        return ((u128)x * x + c) % n;
    };
    u64 x = 2, y = 2, c = 1, d = 1;
    while (d == 1) {
        x = f(x, c);
        y = f(f(y, c), c);
        d = gcd_u64(x > y ? x - y : y - x, n);
        if (d == n) {
            x = 2;
            y = 2;
            c++;
            d = 1;
        }
    }
    return d;
}

void factorize(u64 n, vector<u64>& factors) {
    if (n == 1) return;
    while (n % 2 == 0) {
        factors.push_back(2);
        n /= 2;
    }
    while (n % 3 == 0) {
        factors.push_back(3);
        n /= 3;
    }
    if (n == 1) return;
    if (miller_rabin(n)) {
        factors.push_back(n);
        return;
    }
    u64 divisor = pollard_rho(n);
    factorize(divisor, factors);
    factorize(n / divisor, factors);
}

void solve() {
    u64 n;
    cin >> n;
    vector<u64> factors;
    factorize(n, factors);
    sort(factors.begin(), factors.end());
    for (size_t i = 0; i < factors.size(); ++i) {
        cout << factors[i] << (i + 1 == factors.size() ? "" : " ");
    }
    cout << "\\n";
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int t;
    if (cin >> t) {
        while (t--) solve();
    }
    return 0;
}
""",
        "brute": """#include <iostream>
#include <vector>

using namespace std;

void solve() {
    long long n;
    cin >> n;
    vector<long long> f;
    for (long long d = 2; d * d <= n; ++d) {
        while (n % d == 0) {
            f.push_back(d);
            n /= d;
        }
    }
    if (n > 1) f.push_back(n);
    for (size_t i = 0; i < f.size(); ++i) {
        cout << f[i] << (i + 1 == f.size() ? "" : " ");
    }
    cout << "\\n";
}

int main() {
    int t;
    if (cin >> t) {
        while (t--) solve();
    }
    return 0;
}
""",
        "generator": """#include <iostream>
#include <random>
#include <chrono>

using namespace std;

int main() {
    mt19937_64 rng(chrono::steady_clock::now().time_since_epoch().count());
    int t = 5;
    cout << t << "\\n";
    cout << "12\\n";
    cout << "999999999989\\n";
    cout << "1000000000000000000\\n";
    for (int i = 4; i <= t; ++i) {
        unsigned long long n = 2 + (rng() % 1000000000000000000ULL);
        cout << n << "\\n";
    }
    return 0;
}
""",
        "validator": """#include <iostream>

using namespace std;

int main() {
    int t;
    if (!(cin >> t)) return 1;
    if (t < 1 || t > 100) return 1;
    while (t--) {
        unsigned long long n;
        if (!(cin >> n)) return 1;
        if (n < 2 || n > 1000000000000000000ULL) return 1;
    }
    return 0;
}
""",
        "sample_in": "3\n12\n999999999989\n1000000000000000000\n",
        "corner_in": "2\n2\n999999999989\n"
    },

    # ── MAVZU 3: Evklid algoritmi, EKUB va EKUK ───────────────────────────────
    {
        "id": "p11_gcd_lcm_basics",
        "title": "Massivning EKUBi va EKUKi (Array GCD and Modular LCM)",
        "topic": "Evklid algoritmi, EKUB (GCD) va EKUK (LCM)",
        "difficulty": 1,
        "time_limit": "1.0s",
        "memory_limit": "256MB",
        "statement": """# Massivning EKUBi va EKUKi (Array GCD and Modular LCM)

Sizga $N$ ta musbat butun sondan iborat massiv berilgan: $A = [a_1, a_2, \\dots, a_N]$.

Siz quyidagilarni aniqlashingiz kerak:
1. Barcha sonlarning umumiy EKUBi: $\\gcd(a_1, a_2, \\dots, a_N)$;
2. Barcha sonlarning umumiy EKUKining $\\text{LCM}(a_1, a_2, \\dots, a_N) \\pmod{10^9+7}$ qiymati.

Eslatma: EKUK har bir tub bo'luvchining massivdagi maksimal darajasiga teng. Hisoblashda toshib ketishni (overflow) oldini olish uchun sonlarning tub ko'paytuvchilarini alohida saqlang.

### Kiruvchi ma'lumotlar
Birinchi qatorda butun son $N$ ($1 \\le N \\le 10^5$) beriladi.
Ikkinchi qatorda $N$ ta butun son $a_1, a_2, \\dots, a_N$ ($1 \\le a_i \\le 10^6$) kiritiladi.

### Chiquvchi ma'lumotlar
Ikkita butun sonni bo'sh joy bilan ajratib chop eting:
1. Umumiy EKUB;
2. Umumiy EKUK modulo $10^9+7$.

### Namuna
#### Kiruvchi ma'lumotlar
```text
3
12 18 24
```
#### Chiquvchi ma'lumotlar
```text
6 72
```

### Tushuntirish
- $\\gcd(12, 18, 24) = 6$;
- $\\text{LCM}(12, 18, 24) = 72 \\equiv 72 \\pmod{10^9+7}$.
""",
        "solution": """#include <iostream>
#include <vector>
#include <numeric>
#include <algorithm>

using namespace std;

const int MAXA = 1000000;
const int MOD = 1000000007;

int spf[MAXA + 1];
int max_exp[MAXA + 1];

void sieve() {
    for (int i = 2; i <= MAXA; ++i) {
        if (spf[i] == 0) {
            for (int j = i; j <= MAXA; j += i) {
                if (spf[j] == 0) spf[j] = i;
            }
        }
    }
}

long long power(long long base, long long exp) {
    long long res = 1;
    base %= MOD;
    while (exp > 0) {
        if (exp % 2 == 1) res = (res * base) % MOD;
        base = (base * base) % MOD;
        exp /= 2;
    }
    return res;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    sieve();

    int n;
    if (!(cin >> n)) return 0;

    vector<int> a(n);
    int overall_gcd = 0;

    for (int i = 0; i < n; ++i) {
        cin >> a[i];
        overall_gcd = std::gcd(overall_gcd, a[i]);

        int temp = a[i];
        while (temp > 1) {
            int p = spf[temp];
            int count = 0;
            while (temp % p == 0) {
                count++;
                temp /= p;
            }
            max_exp[p] = max(max_exp[p], count);
        }
    }

    long long overall_lcm = 1;
    for (int p = 2; p <= MAXA; ++p) {
        if (max_exp[p] > 0) {
            overall_lcm = (overall_lcm * power(p, max_exp[p])) % MOD;
        }
    }

    cout << overall_gcd << " " << overall_lcm << "\\n";
    return 0;
}
""",
        "brute": """#include <iostream>
#include <vector>
#include <numeric>

using namespace std;

int main() {
    int n;
    if (!(cin >> n)) return 0;
    vector<long long> a(n);
    long long g = 0;
    for (int i = 0; i < n; ++i) {
        cin >> a[i];
        g = std::gcd(g, a[i]);
    }
    // simple simulation
    long long lcm_val = a[0];
    for (int i = 1; i < n; ++i) {
        lcm_val = (lcm_val / std::gcd(lcm_val, a[i])) * a[i];
    }
    cout << g << " " << lcm_val % 1000000007 << "\\n";
    return 0;
}
""",
        "generator": """#include <iostream>
#include <random>
#include <chrono>

using namespace std;

int main() {
    mt19937 rng(chrono::steady_clock::now().time_since_epoch().count());
    int n = 5;
    cout << n << "\\n";
    for (int i = 0; i < n; ++i) {
        cout << 1 + (rng() % 1000) << (i + 1 == n ? "" : " ");
    }
    cout << "\\n";
    return 0;
}
""",
        "validator": """#include <iostream>

using namespace std;

int main() {
    int n;
    if (!(cin >> n)) return 1;
    if (n < 1 || n > 100000) return 1;
    for (int i = 0; i < n; ++i) {
        int x;
        if (!(cin >> x)) return 1;
        if (x < 1 || x > 1000000) return 1;
    }
    return 0;
}
""",
        "sample_in": "3\n12 18 24\n",
        "corner_in": "1\n1000000\n"
    },

    {
        "id": "p12_extended_euclid",
        "title": "Chiziqli Diofant Tenglamasi (Linear Diophantine Equation)",
        "topic": "Evklid algoritmi, EKUB (GCD) va EKUK (LCM)",
        "difficulty": 2,
        "time_limit": "1.0s",
        "memory_limit": "256MB",
        "statement": """# Chiziqli Diofant Tenglamasi (Linear Diophantine Equation)

Sizga butun koeffitsiyentli quyidagi tenglama beriladi:
$$A \\cdot x + B \\cdot y = C$$

Sizdan ushbu tenglamaning butun sonlardagi yechimini topish talab qilinadi.
Agar butun yechimlar mavjud bo'lmasa, `-1` chiqaring.
Agar yechimlar mavjud bo'lsa, **$x \\ge 0$ bo'lgan eng kichik nomanfiy $x$** qiymatiga mos keluvchi $(x, y)$ juftligini chop eting.

### Kiruvchi ma'lumotlar
Birinchi qatorda so'rovlar soni $T$ ($1 \\le T \\le 10^5$) kiritiladi.
Keyingi $T$ ta qatorda uchtadan butun son $A, B, C$ ($1 \\le A, B \\le 10^9, 0 \\le C \\le 10^9$) beriladi.

### Chiquvchi ma'lumotlar
Har bir so'rov uchun:
- Yechim bo'lmasa: `-1`;
- Yechim mavjud bo'lsa: $x$ va $y$ ni bo'sh joy bilan ajratib chop eting.

### Namuna
#### Kiruvchi ma'lumotlar
```text
3
3 5 11
2 4 5
6 9 15
```
#### Chiquvchi ma'lumotlar
```text
2 1
-1
1 1
```

### Tushuntirish
- $3 \\cdot 2 + 5 \\cdot 1 = 11$, bu yerda $x=2$ eng kichik nomanfiy yechim.
- $2x + 4y = 5$: $\\gcd(2, 4) = 2$, ammo $5$ soni $2$ ga bo'linmaydi. Yechim yo'q (`-1`).
- $6 \\cdot 1 + 9 \\cdot 1 = 15$.
""",
        "solution": """#include <iostream>

using namespace std;

long long extgcd(long long a, long long b, long long &x, long long &y) {
    if (b == 0) {
        x = 1;
        y = 0;
        return a;
    }
    long long x1, y1;
    long long g = extgcd(b, a % b, x1, y1);
    x = y1;
    y = x1 - y1 * (a / b);
    return g;
}

void solve() {
    long long a, b, c;
    cin >> a >> b >> c;
    long long x0, y0;
    long long g = extgcd(a, b, x0, y0);

    if (c % g != 0) {
        cout << -1 << "\\n";
        return;
    }

    long long step_x = b / g;
    // general x = x0 * (c / g) + k * step_x
    // want minimum x >= 0
    // x0 * (c/g) could overflow long long, use __int128
    __int128 X = (__int128)x0 * (c / g);
    __int128 k = 0;
    if (X < 0) {
        k = (-X + step_x - 1) / step_x;
        X += k * step_x;
    } else {
        k = X / step_x;
        X -= k * step_x;
    }

    long long ans_x = (long long)X;
    long long ans_y = (c - a * ans_x) / b;
    cout << ans_x << " " << ans_y << "\\n";
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int t;
    if (cin >> t) {
        while (t--) solve();
    }
    return 0;
}
""",
        "brute": """#include <iostream>

using namespace std;

void solve() {
    long long a, b, c;
    cin >> a >> b >> c;
    for (long long x = 0; x <= 100000; ++x) {
        long long rem = c - a * x;
        if (rem % b == 0) {
            cout << x << " " << rem / b << "\\n";
            return;
        }
    }
    cout << -1 << "\\n";
}

int main() {
    int t;
    if (cin >> t) {
        while (t--) solve();
    }
    return 0;
}
""",
        "generator": """#include <iostream>
#include <random>
#include <chrono>

using namespace std;

int main() {
    mt19937 rng(chrono::steady_clock::now().time_since_epoch().count());
    int t = 5;
    cout << t << "\\n";
    cout << "3 5 11\\n";
    cout << "2 4 5\\n";
    for (int i = 3; i <= t; ++i) {
        int a = 1 + rng() % 1000;
        int b = 1 + rng() % 1000;
        int c = rng() % 10000;
        cout << a << " " << b << " " << c << "\\n";
    }
    return 0;
}
""",
        "validator": """#include <iostream>

using namespace std;

int main() {
    int t;
    if (!(cin >> t)) return 1;
    if (t < 1 || t > 100000) return 1;
    while (t--) {
        long long a, b, c;
        if (!(cin >> a >> b >> c)) return 1;
        if (a < 1 || a > 1000000000LL || b < 1 || b > 1000000000LL || c < 0 || c > 1000000000LL) return 1;
    }
    return 0;
}
""",
        "sample_in": "3\n3 5 11\n2 4 5\n6 9 15\n",
        "corner_in": "2\n1 1 0\n1000000000 1000000000 1000000000\n"
    },

    {
        "id": "p13_gcd_pairs_sum",
        "title": "Barcha Juftliklar EKUB Yig'indisi (GCD Pairs Sum)",
        "topic": "Evklid algoritmi, EKUB (GCD) va EKUK (LCM)",
        "difficulty": 3,
        "time_limit": "1.5s",
        "memory_limit": "256MB",
        "statement": """# Barcha Juftliklar EKUB Yig'indisi (GCD Pairs Sum)

Sizga butun son $N$ beriladi. Quyidagi ifodaning qiymatini hisoblang:
$$G(N) = \\sum_{i=1}^N \\sum_{j=i+1}^N \\gcd(i, j)$$

So'rovlar soni $T$ tagacha bo'lishi mumkin. Har bir so'rovga tezkor javob berish uchun Euler Totient $\\phi(n)$ funktsiyasidan foydalanib oldindan hisoblash (precomputation) talab etiladi.

### Kiruvchi ma'lumotlar
Birinchi qatorda so'rovlar soni $T$ ($1 \\le T \\le 10^5$) kiritiladi.
Keyingi $T$ ta qatorda bittadan butun son $N$ ($1 \\le N \\le 10^6$) beriladi.

### Chiquvchi ma'lumotlar
Har bir so'rov uchun alohida qatorda $G(N)$ ning qiymatini chiqaring.

### Namuna
#### Kiruvchi ma'lumotlar
```text
3
3
4
10
```
#### Chiquvchi ma'lumotlar
```text
3
7
67
```

### Tushuntirish
- $N=3$: $\\gcd(1, 2) + \\gcd(1, 3) + \\gcd(2, 3) = 1 + 1 + 1 = 3$.
- $N=4$: $3 + \\gcd(1, 4) + \\gcd(2, 4) + \\gcd(3, 4) = 3 + 1 + 2 + 1 = 7$.
""",
        "solution": """#include <iostream>
#include <vector>

using namespace std;

const int MAXN = 1000000;
int phi[MAXN + 1];
long long f[MAXN + 1];
long long ans[MAXN + 1];

void precompute() {
    for (int i = 0; i <= MAXN; ++i) phi[i] = i;
    for (int i = 2; i <= MAXN; ++i) {
        if (phi[i] == i) {
            for (int j = i; j <= MAXN; j += i) {
                phi[j] -= phi[j] / i;
            }
        }
    }

    for (int i = 1; i <= MAXN; ++i) {
        for (int j = i * 2; j <= MAXN; j += i) {
            f[j] += 1LL * i * phi[j / i];
        }
    }

    for (int i = 2; i <= MAXN; ++i) {
        ans[i] = ans[i - 1] + f[i];
    }
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    precompute();

    int t;
    if (cin >> t) {
        while (t--) {
            int n;
            cin >> n;
            cout << ans[n] << "\\n";
        }
    }
    return 0;
}
""",
        "brute": """#include <iostream>
#include <numeric>

using namespace std;

void solve() {
    int n;
    cin >> n;
    long long sum = 0;
    for (int i = 1; i <= n; ++i) {
        for (int j = i + 1; j <= n; ++j) {
            sum += std::gcd(i, j);
        }
    }
    cout << sum << "\\n";
}

int main() {
    int t;
    if (cin >> t) {
        while (t--) solve();
    }
    return 0;
}
""",
        "generator": """#include <iostream>
#include <random>
#include <chrono>

using namespace std;

int main() {
    mt19937 rng(chrono::steady_clock::now().time_since_epoch().count());
    int t = 5;
    cout << t << "\\n";
    cout << "3\\n4\\n10\\n";
    for (int i = 4; i <= t; ++i) {
        cout << 1 + (rng() % 1000000) << "\\n";
    }
    return 0;
}
""",
        "validator": """#include <iostream>

using namespace std;

int main() {
    int t;
    if (!(cin >> t)) return 1;
    if (t < 1 || t > 100000) return 1;
    while (t--) {
        int n;
        if (!(cin >> n)) return 1;
        if (n < 1 || n > 1000000) return 1;
    }
    return 0;
}
""",
        "sample_in": "3\n3\n4\n10\n",
        "corner_in": "2\n1\n1000000\n"
    },

    {
        "id": "p14_gcd_counting_pairs",
        "title": "O'zaro Tub Juftliklar Soni (Coprime Pairs Count)",
        "topic": "Evklid algoritmi, EKUB (GCD) va EKUK (LCM)",
        "difficulty": 4,
        "time_limit": "1.0s",
        "memory_limit": "256MB",
        "statement": """# O'zaro Tub Juftliklar Soni (Coprime Pairs Count)

Sizga $N$ ta butun sondan iborat $A = [a_1, a_2, \\dots, a_N]$ massiv berilgan.
Barcha $1 \\le i < j \\le N$ indekslar juftliklari orasidan elementlari o'zaro tub bo'lgan, ya'ni:
$$\\gcd(a_i, a_j) = 1$$
shartni qanoatlantiruvchi juftliklar sonini hisoblang.

Elementlarning maksimal qiymati $10^6$ dan oshmaydi.
Inclusion-Exclusion prinsipi yoki Myobius funktsiyasi $\\mu(d)$ talab etiladi.

### Kiruvchi ma'lumotlar
Birinchi qatorda bitta butun son $N$ ($1 \\le N \\le 10^5$) beriladi.
Ikkinchi qatorda $N$ ta butun son $a_1, a_2, \\dots, a_N$ ($1 \\le a_i \\le 10^6$) kiritiladi.

### Chiquvchi ma'lumotlar
Yagona butun son — o'zaro tub bo'lgan $(a_i, a_j)$ juftliklar sonini chop eting.

### Namuna
#### Kiruvchi ma'lumotlar
```text
4
2 3 4 5
```
#### Chiquvchi ma'lumotlar
```text
5
```

### Tushuntirish
Barcha 6 ta juftlik:
- $(2, 3) \\implies \\gcd=1$ ✓
- $(2, 4) \\implies \\gcd=2$
- $(2, 5) \\implies \\gcd=1$ ✓
- $(3, 4) \\implies \\gcd=1$ ✓
- $(3, 5) \\implies \\gcd=1$ ✓
- $(4, 5) \\implies \\gcd=1$ ✓
Jami 5 ta juftlik.
""",
        "solution": """#include <iostream>
#include <vector>

using namespace std;

const int MAXA = 1000000;
int mu[MAXA + 1];
int spf[MAXA + 1];
int freq[MAXA + 1];
long long multiples_count[MAXA + 1];
vector<int> primes;

void sieve() {
    mu[1] = 1;
    for (int i = 2; i <= MAXA; ++i) {
        if (spf[i] == 0) {
            spf[i] = i;
            mu[i] = -1;
            primes.push_back(i);
        }
        for (int p : primes) {
            if (p > spf[i] || 1LL * i * p > MAXA) break;
            spf[i * p] = p;
            if (p == spf[i]) {
                mu[i * p] = 0;
            } else {
                mu[i * p] = -mu[i];
            }
        }
    }
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    sieve();

    int n;
    if (!(cin >> n)) return 0;

    for (int i = 0; i < n; ++i) {
        int x;
        cin >> x;
        freq[x]++;
    }

    for (int d = 1; d <= MAXA; ++d) {
        for (int m = d; m <= MAXA; m += d) {
            multiples_count[d] += freq[m];
        }
    }

    long long coprime_pairs = 0;
    for (int d = 1; d <= MAXA; ++d) {
        if (mu[d] == 0) continue;
        long long cnt = multiples_count[d];
        long long pairs = cnt * (cnt - 1) / 2;
        coprime_pairs += mu[d] * pairs;
    }

    cout << coprime_pairs << "\\n";
    return 0;
}
""",
        "brute": """#include <iostream>
#include <vector>
#include <numeric>

using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (int i = 0; i < n; ++i) cin >> a[i];
    long long ans = 0;
    for (int i = 0; i < n; ++i) {
        for (int j = i + 1; j < n; ++j) {
            if (std::gcd(a[i], a[j]) == 1) ans++;
        }
    }
    cout << ans << "\\n";
    return 0;
}
""",
        "generator": """#include <iostream>
#include <random>
#include <chrono>

using namespace std;

int main() {
    mt19937 rng(chrono::steady_clock::now().time_since_epoch().count());
    int n = 10;
    cout << n << "\\n";
    for (int i = 0; i < n; ++i) {
        cout << 1 + (rng() % 1000) << (i + 1 == n ? "" : " ");
    }
    cout << "\\n";
    return 0;
}
""",
        "validator": """#include <iostream>

using namespace std;

int main() {
    int n;
    if (!(cin >> n)) return 1;
    if (n < 1 || n > 100000) return 1;
    for (int i = 0; i < n; ++i) {
        int x;
        if (!(cin >> x)) return 1;
        if (x < 1 || x > 1000000) return 1;
    }
    return 0;
}
""",
        "sample_in": "4\n2 3 4 5\n",
        "corner_in": "2\n1 1\n"
    },

    {
        "id": "p15_extended_crt",
        "title": "Umumlashgan Xitoy Qoldiqlar Teoremasi (Extended CRT)",
        "topic": "Evklid algoritmi, EKUB (GCD) va EKUK (LCM)",
        "difficulty": 5,
        "time_limit": "1.0s",
        "memory_limit": "256MB",
        "statement": """# Umumlashgan Xitoy Qoldiqlar Teoremasi (Extended CRT)

Sizga $N$ ta modulli taqqoslamalar sistemasi beriladi:
$$x \\equiv r_1 \\pmod{m_1}$$
$$x \\equiv r_2 \\pmod{m_2}$$
$$\\dots$$
$$x \\equiv r_N \\pmod{m_N}$$

**Muhim:** Modullar $m_1, m_2, \\dots, m_N$ o'zaro tub bo'lishi SHART EMAS!
Sizdan ushbu taqqoslamalar sistemasini qanoatlantiruvchi **eng kichik manfiy bo'lmagan butun $x$** ($x \\ge 0$) sonini topish talab etiladi.
Agar bunday yechim mavjud bo'lmasa, `-1` chiqaring.

### Kiruvchi ma'lumotlar
Birinchi qatorda taqqoslamalar soni $N$ ($1 \\le N \\le 10^5$) kiritiladi.
Keyingi $N$ ta qatorda ikkitadan butun son $r_i$ va $m_i$ ($0 \\le r_i < m_i \\le 10^{12}$) beriladi.

Javob mavjud bo'lsa, u $10^{18}$ dan oshmasligi yoki $\\text{LCM}(m_i) \\le 10^{18}$ bo'lishi kafolatlanadi.

### Chiquvchi ma'lumotlar
Yagona qatorda eng kichik nomanfiy butun yechim $x$ ni yoki yechim yo'q bo'lsa `-1` ni chop eting.

### Namuna 1
#### Kiruvchi ma'lumotlar
```text
3
2 3
3 5
2 7
```
#### Chiquvchi ma'lumotlar
```text
23
```

### Namuna 2
#### Kiruvchi ma'lumotlar
```text
2
1 4
2 6
```
#### Chiquvchi ma'lumotlar
```text
-1
```

### Tushuntirish
- 1-namunada: $23 \\equiv 2 \\pmod 3, 23 \\equiv 3 \\pmod 5, 23 \\equiv 2 \\pmod 7$. Eng kichik nomanfiy son $23$.
- 2-namunada: $x \\equiv 1 \\pmod 4 \\implies x$ toq son. Ammo $x \\equiv 2 \\pmod 6 \\implies x$ juft son bo'lishi kerak. Ziddiyat bor, yechim yo'q (`-1`).
""",
        "solution": """#include <iostream>

using namespace std;

using i128 = __int128_t;

long long extgcd(long long a, long long b, long long &x, long long &y) {
    if (b == 0) {
        x = 1;
        y = 0;
        return a;
    }
    long long x1, y1;
    long long g = extgcd(b, a % b, x1, y1);
    x = y1;
    y = x1 - y1 * (a / b);
    return g;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n;
    if (!(cin >> n)) return 0;

    long long r1, m1;
    cin >> r1 >> m1;

    bool impossible = false;

    for (int i = 1; i < n; ++i) {
        long long r2, m2;
        cin >> r2 >> m2;

        if (impossible) continue;

        long long p, q;
        long long g = extgcd(m1, m2, p, q);

        if ((r2 - r1) % g != 0) {
            impossible = true;
            continue;
        }

        long long step = m2 / g;
        i128 diff = (r2 - r1) / g;
        i128 k = (i128)p * diff % step;
        if (k < 0) k += step;

        i128 new_m = (i128)m1 / g * m2;
        i128 new_r = (r1 + (i128)m1 * k) % new_m;
        if (new_r < 0) new_r += new_m;

        m1 = (long long)new_m;
        r1 = (long long)new_r;
    }

    if (impossible) {
        cout << -1 << "\\n";
    } else {
        cout << r1 << "\\n";
    }

    return 0;
}
""",
        "brute": """#include <iostream>
#include <vector>

using namespace std;

int main() {
    int n;
    cin >> n;
    vector<pair<long long, long long>> eq(n);
    for (int i = 0; i < n; ++i) cin >> eq[i].first >> eq[i].second;

    for (long long x = 0; x <= 1000000; ++x) {
        bool ok = true;
        for (int i = 0; i < n; ++i) {
            if (x % eq[i].second != eq[i].first) {
                ok = false;
                break;
            }
        }
        if (ok) {
            cout << x << "\\n";
            return 0;
        }
    }
    cout << -1 << "\\n";
    return 0;
}
""",
        "generator": """#include <iostream>
#include <random>
#include <chrono>

using namespace std;

int main() {
    mt19937 rng(chrono::steady_clock::now().time_since_epoch().count());
    int n = 3;
    cout << n << "\\n";
    cout << "2 3\\n";
    cout << "3 5\\n";
    cout << "2 7\\n";
    return 0;
}
""",
        "validator": """#include <iostream>

using namespace std;

int main() {
    int n;
    if (!(cin >> n)) return 1;
    if (n < 1 || n > 100000) return 1;
    while (n--) {
        long long r, m;
        if (!(cin >> r >> m)) return 1;
        if (m < 1 || m > 1000000000000LL || r < 0 || r >= m) return 1;
    }
    return 0;
}
""",
        "sample_in": "3\n2 3\n3 5\n2 7\n",
        "corner_in": "2\n1 4\n2 6\n"
    }
]

def build_all():
    print(f"Building {len(PROBLEMS)} competitive programming problem packages...")
    for idx, p in enumerate(PROBLEMS, 1):
        prob_dir = BASE_DIR / p["id"]
        tests_dir = prob_dir / "tests"
        tests_dir.mkdir(parents=True, exist_ok=True)

        # 1. statement.md
        with open(prob_dir / "statement.md", "w", encoding="utf-8") as f:
            f.write(p["statement"])

        # 2. solution.cpp
        sol_path = prob_dir / "solution.cpp"
        with open(sol_path, "w", encoding="utf-8") as f:
            f.write(p["solution"])

        # 3. brute.cpp
        with open(prob_dir / "brute.cpp", "w", encoding="utf-8") as f:
            f.write(p["brute"])

        # 4. generator.cpp
        with open(prob_dir / "generator.cpp", "w", encoding="utf-8") as f:
            f.write(p["generator"])

        # 5. validator.cpp
        with open(prob_dir / "validator.cpp", "w", encoding="utf-8") as f:
            f.write(p["validator"])

        # 6. Sample tests
        test1_in = tests_dir / "01.in"
        test1_out = tests_dir / "01.out"
        with open(test1_in, "w", encoding="utf-8") as f:
            f.write(p["sample_in"])

        test2_in = tests_dir / "02.in"
        test2_out = tests_dir / "02.out"
        with open(test2_in, "w", encoding="utf-8") as f:
            f.write(p["corner_in"])

        print(f"[{idx:02d}/15] Created problem package: {p['id']}")

    print("\\nAll 15 problem directories and files have been successfully constructed!")

if __name__ == "__main__":
    build_all()
