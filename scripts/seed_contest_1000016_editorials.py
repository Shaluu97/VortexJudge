# -*- coding: utf-8 -*-
"""
Seed rich editorials (Explanations with KaTeX math + C++20 + Python 3 + Java 21 code)
for Contest 1000016 (Raqamlar Nazariyasi Master Kontest - 12 ta Masala).
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'database.sqlite')

EDITORIALS = [
    {
        "problem_id": 999926,
        "explanation": """### Masala tahlili: Tublikka Tekshirish (Prime Checking)

Berilgan $N$ sonining tub yoki tub emasligini aniqlash talab etiladi.

#### Matematik g'oya:
1. Agar $N \\le 1$ bo'lsa, son tub emas.
2. Agar $N = 2$ yoki $N = 3$ bo'lsa, son tub.
3. Agar $N$ juft bo'lsa ($N \\pmod 2 = 0$) yoki $3$ ga bo'linsa ($N \\pmod 3 = 0$), son tub emas.
4. Har qanday murakkab $N$ sonining kamida bitta bo'luvchisi $d \\le \\sqrt{N}$ oraliqda yotadi. Shuning uchun $5$ dan boshlab $6k \\pm 1$ ko'rinishidagi sonlarni $\\sqrt{N}$ gacha tekshirish optimal hisoblanadi.

#### Murakkablik:
- **Vaqt murakkabligi:** $O(\\sqrt{N})$
- **Xotira murakkabligi:** $O(1)$
""",
        "code_cpp": """#include <iostream>
using namespace std;

bool isPrime(long long n) {
    if (n <= 1) return false;
    if (n <= 3) return true;
    if (n % 2 == 0 || n % 3 == 0) return false;
    for (long long i = 5; i * i <= n; i += 6) {
        if (n % i == 0 || n % (i + 2) == 0) return false;
    }
    return true;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    long long n;
    if (cin >> n) {
        if (isPrime(n)) cout << "YES\\n";
        else cout << "NO\\n";
    }
    return 0;
}
""",
        "code_python": """import sys

def is_prime(n: int) -> bool:
    if n <= 1:
        return False
    if n <= 3:
        return True
    if n % 2 == 0 or n % 3 == 0:
        return False
    i = 5
    while i * i <= n:
        if n % i == 0 or n % (i + 2) == 0:
            return False
        i += 6
    return True

def main():
    tokens = sys.stdin.read().split()
    if not tokens:
        return
    n = int(tokens[0])
    print("YES" if is_prime(n) else "NO")

if __name__ == '__main__':
    main()
""",
        "code_java": """import java.util.Scanner;

public class PrimeCheck {
    public static boolean isPrime(long n) {
        if (n <= 1) return false;
        if (n <= 3) return true;
        if (n % 2 == 0 || n % 3 == 0) return false;
        for (long i = 5; i * i <= n; i += 6) {
            if (n % i == 0 || n % (i + 2) == 0) return false;
        }
        return true;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        if (in.hasNextLong()) {
            long n = in.nextLong();
            System.out.println(isPrime(n) ? "YES" : "NO");
        }
    }
}
"""
    },
    {
        "problem_id": 999927,
        "explanation": """### Masala tahlili: Oraliqdagi Tub Sonlar Soni (Prime Counting in Range)

Sizga $Q$ ta so'rov beriladi. Har bir so'rovda $[L, R]$ oralig'idagi tub sonlar sonini topish kerak.

#### Matematik g'oya:
Har bir so'rov uchun alohida tekshirish $O(Q \\cdot \\sqrt{R})$ vaqt oladi va TLE beradi.
Buning o'rniga:
1. $M = \\max(R) \\le 10^6$ gacha Eratosfen g'alviri (Sieve of Eratosthenes) yordamida barcha tub sonlarni oldindan hisoblab olamiz: $O(M \\log \\log M)$.
2. Prefiks yig'indisi massivini quramiz:
$$pref[i] = \\text{([1, i] oralig'idagi tub sonlar soni)}$$
3. Har bir $[L, R]$ so'rovi uchun javob bir zumda hisoblanadi:
$$\\text{Javob} = pref[R] - pref[L - 1]$$

#### Murakkablik:
- **Oldindan hisoblash:** $O(M \\log \\log M)$
- **Har bir so'rov:** $O(1)$
- **Jami vaqt:** $O(M \\log \\log M + Q)$
- **Xotira:** $O(M)$
""",
        "code_cpp": """#include <iostream>
#include <vector>
using namespace std;

const int MAX_R = 1000000;
bool is_p[MAX_R + 1];
int pref[MAX_R + 1];

void sieve() {
    fill(is_p + 2, is_p + MAX_R + 1, true);
    for (int p = 2; p * p <= MAX_R; p++) {
        if (is_p[p]) {
            for (int i = p * p; i <= MAX_R; i += p) {
                is_p[i] = false;
            }
        }
    }
    for (int i = 1; i <= MAX_R; i++) {
        pref[i] = pref[i - 1] + (is_p[i] ? 1 : 0);
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
            cout << (pref[r] - pref[l - 1]) << "\\n";
        }
    }
    return 0;
}
""",
        "code_python": """import sys

MAX_R = 1000000
is_p = [False, False] + [True] * (MAX_R - 1)
pref = [0] * (MAX_R + 1)

def sieve():
    for p in range(2, int(MAX_R ** 0.5) + 1):
        if is_p[p]:
            for i in range(p * p, MAX_R + 1, p):
                is_p[i] = False
    for i in range(1, MAX_R + 1):
        pref[i] = pref[i - 1] + (1 if is_p[i] else 0)

def main():
    sieve()
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    q = int(input_data[0])
    idx = 1
    out = []
    for _ in range(q):
        l = int(input_data[idx])
        r = int(input_data[idx + 1])
        idx += 2
        out.append(str(pref[r] - pref[l - 1]))
    sys.stdout.write('\\n'.join(out) + '\\n')

if __name__ == '__main__':
    main()
""",
        "code_java": """import java.io.*;
import java.util.*;

public class RangePrimes {
    static final int MAX_R = 1000000;
    static boolean[] isP = new boolean[MAX_R + 1];
    static int[] pref = new int[MAX_R + 1];

    static void sieve() {
        Arrays.fill(isP, 2, MAX_R + 1, true);
        for (int p = 2; p * p <= MAX_R; p++) {
            if (isP[p]) {
                for (int i = p * p; i <= MAX_R; i += p) isP[i] = false;
            }
        }
        for (int i = 1; i <= MAX_R; i++) {
            pref[i] = pref[i - 1] + (isP[i] ? 1 : 0);
        }
    }

    public static void main(String[] args) throws IOException {
        sieve();
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String line = br.readLine();
        if (line == null) return;
        int q = Integer.parseInt(line.trim());
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < q; i++) {
            StringTokenizer st = new StringTokenizer(br.readLine());
            int l = Integer.parseInt(st.nextToken());
            int r = Integer.parseInt(st.nextToken());
            sb.append(pref[r] - pref[l - 1]).append("\\n");
        }
        System.out.print(sb);
    }
}
"""
    },
    {
        "problem_id": 999928,
        "explanation": """### Masala tahlili: Segmentlangan G'alvir (Segmented Sieve)

Katta $L$ va $R$ sonlari berilgan ($1 \\le L \\le R \\le 10^{12}, R - L \\le 10^6$). $[L, R]$ oralig'idagi barcha tub sonlarni topish yoki sanash kerak.

#### Algoritm:
$R$ soni $10^{12}$ gacha bo'lgani sababli, butun massiv ochib bo'lmaydi. Biroq $R - L \\le 10^6$ oralig'i xotiraga bemalol sig'adi.
1. Avvalo $\\sqrt{R} \\le 10^6$ gacha bo'lgan barcha tub sonlarni oddiy Eratosfen g'alviri bilan topamiz.
2. Uzunligi $(R - L + 1)$ bo'lgan `segment` massivini ochamiz, bunda `index = X - L`.
3. Har bir topilgan tub $p \\le \\sqrt{R}$ soni uchun $[L, R]$ oralig'idagi $p$ ga karrali bo'lgan eng kichik sonni topamiz:
$$\\text{start} = \\max(p \\times p, \\; \\lceil L / p \\rceil \\times p)$$
4. $\\text{start}$ dan boshlab $p$ qadam bilan barcha karralilarni murakkab deb belgilaymiz.
5. $L = 1$ bo'lgan holatda $1$ soni tub emasligini inobatga olamiz.

#### Murakkablik:
- **Vaqt murakkabligi:** $O(\\sqrt{R} \\log \\log \\sqrt{R} + (R - L + 1) \\log \\log R)$
- **Xotira murakkabligi:** $O(\\sqrt{R} + (R - L + 1))$
""",
        "code_cpp": """#include <iostream>
#include <vector>
#include <cmath>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    long long L, R;
    if (!(cin >> L >> R)) return 0;

    long long lim = sqrt(R) + 1;
    vector<bool> is_prime(lim + 1, true);
    vector<long long> primes;
    for (long long p = 2; p <= lim; p++) {
        if (is_prime[p]) {
            primes.push_back(p);
            for (long long i = p * p; i <= lim; i += p) is_prime[i] = false;
        }
    }

    int sz = R - L + 1;
    vector<bool> is_p_seg(sz, true);
    for (long long p : primes) {
        long long start = max(p * p, ((L + p - 1) / p) * p);
        for (long long j = start; j <= R; j += p) {
            is_p_seg[j - L] = false;
        }
    }
    if (L == 1) is_p_seg[0] = false;

    long long count = 0;
    for (int i = 0; i < sz; i++) {
        if (is_p_seg[i]) count++;
    }
    cout << count << "\\n";
    return 0;
}
""",
        "code_python": """import sys
import math

def segmented_sieve(L: int, R: int) -> int:
    lim = int(math.isqrt(R)) + 1
    is_prime = [False, False] + [True] * (lim - 1)
    primes = []
    for p in range(2, lim + 1):
        if is_prime[p]:
            primes.append(p)
            for i in range(p * p, lim + 1, p):
                is_prime[i] = False

    sz = R - L + 1
    seg = [True] * sz
    for p in primes:
        start = max(p * p, ((L + p - 1) // p) * p)
        for j in range(start, R + 1, p):
            seg[j - L] = False

    if L == 1 and sz > 0:
        seg[0] = False

    return sum(seg)

def main():
    tokens = sys.stdin.read().split()
    if not tokens:
        return
    L = int(tokens[0])
    R = int(tokens[1])
    print(segmented_sieve(L, R))

if __name__ == '__main__':
    main()
""",
        "code_java": """import java.util.*;

public class SegmentedSieve {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        if (!in.hasNextLong()) return;
        long L = in.nextLong();
        long R = in.nextLong();

        int lim = (int) Math.sqrt(R) + 1;
        boolean[] isP = new boolean[lim + 1];
        Arrays.fill(isP, true);
        List<Long> primes = new ArrayList<>();
        for (int p = 2; p <= lim; p++) {
            if (isP[p]) {
                primes.add((long) p);
                for (long i = (long) p * p; i <= lim; i += p) isP[(int) i] = false;
            }
        }

        int sz = (int) (R - L + 1);
        boolean[] seg = new boolean[sz];
        Arrays.fill(seg, true);
        for (long p : primes) {
            long start = Math.max(p * p, ((L + p - 1) / p) * p);
            for (long j = start; j <= R; j += p) {
                seg[(int) (j - L)] = false;
            }
        }
        if (L == 1) seg[0] = false;

        int count = 0;
        for (boolean b : seg) if (b) count++;
        System.out.println(count);
    }
}
"""
    },
    {
        "problem_id": 999929,
        "explanation": """### Masala tahlili: Chiziqli G'alvir va Tub Bo'luvchilar (Linear Sieve & Omega Function)

Har bir butun $X$ soni uchun uning unikal tub bo'luvchilari soni $\\omega(X)$ hamda tub bo'luvchilarining karrali (umumiy) soni $\\Omega(X)$ ni hisoblash talab etiladi.

#### Matematik xossalar:
Chiziqli g'alvir (Linear Sieve) yordamida har bir son o'zining eng kichik tub bo'luvchisi $lp[x]$ orqali aynan bir marta elanadi:
- Agar $x$ tub son bo'lsa:
$$\\omega(x) = 1, \\quad \\Omega(x) = 1$$
- Agar $x = p \\cdot y$ (bu yerda $p = lp[x]$ eng kichik tub bo'luvchi):
  - Agar $y$ soni ham $p$ ga bo'linsa ($y \\pmod p == 0$):
  $$\\omega(x) = \\omega(y), \\quad \\Omega(x) = \\Omega(y) + 1$$
  - Agar $y$ soni $p$ ga bo'linmasa ($y \\pmod p \\neq 0$):
  $$\\omega(x) = \\omega(y) + 1, \\quad \\Omega(x) = \\Omega(y) + 1$$

#### Murakkablik:
- **Vaqt murakkabligi:** $O(N)$ qat'iy chiziqli vaqt.
- **Xotira murakkabligi:** $O(N)$.
""",
        "code_cpp": """#include <iostream>
#include <vector>
using namespace std;

const int MAXN = 10000000;
int lp[MAXN + 1];
int omega[MAXN + 1];
int Omega[MAXN + 1];
vector<int> primes;

void linear_sieve(int n) {
    for (int i = 2; i <= n; i++) {
        if (lp[i] == 0) {
            lp[i] = i;
            primes.push_back(i);
            omega[i] = 1;
            Omega[i] = 1;
        }
        for (int p : primes) {
            if (p > lp[i] || (long long)i * p > n) break;
            int comp = i * p;
            lp[comp] = p;
            if (i % p == 0) {
                omega[comp] = omega[i];
                Omega[comp] = Omega[i] + 1;
            } else {
                omega[comp] = omega[i] + 1;
                Omega[comp] = Omega[i] + 1;
            }
        }
    }
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n;
    if (cin >> n) {
        linear_sieve(n);
        long long sum_omega = 0, sum_Omega = 0;
        for (int i = 2; i <= n; i++) {
            sum_omega += omega[i];
            sum_Omega += Omega[i];
        }
        cout << sum_omega << " " << sum_Omega << "\\n";
    }
    return 0;
}
""",
        "code_python": """import sys

def main():
    tokens = sys.stdin.read().split()
    if not tokens:
        return
    n = int(tokens[0])

    lp = [0] * (n + 1)
    primes = []
    omega = [0] * (n + 1)
    big_omega = [0] * (n + 1)

    for i in range(2, n + 1):
        if lp[i] == 0:
            lp[i] = i
            primes.append(i)
            omega[i] = 1
            big_omega[i] = 1
        for p in primes:
            if p > lp[i] or i * p > n:
                break
            comp = i * p
            lp[comp] = p
            if i % p == 0:
                omega[comp] = omega[i]
                big_omega[comp] = big_omega[i] + 1
            else:
                omega[comp] = omega[i] + 1
                big_omega[comp] = big_omega[i] + 1

    print(sum(omega), sum(big_omega))

if __name__ == '__main__':
    main()
""",
        "code_java": """import java.util.*;

public class LinearSieveOmega {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        if (!in.hasNextInt()) return;
        int n = in.nextInt();

        int[] lp = new int[n + 1];
        int[] omega = new int[n + 1];
        int[] Omega = new int[n + 1];
        int[] primes = new int[n / 2 + 1];
        int pCount = 0;

        for (int i = 2; i <= n; i++) {
            if (lp[i] == 0) {
                lp[i] = i;
                primes[pCount++] = i;
                omega[i] = 1;
                Omega[i] = 1;
            }
            for (int j = 0; j < pCount; j++) {
                int p = primes[j];
                if (p > lp[i] || (long) i * p > n) break;
                int comp = i * p;
                lp[comp] = p;
                if (i % p == 0) {
                    omega[comp] = omega[i];
                    Omega[comp] = Omega[i] + 1;
                } else {
                    omega[comp] = omega[i] + 1;
                    Omega[comp] = Omega[i] + 1;
                }
            }
        }

        long sumW = 0, sumBigW = 0;
        for (int i = 2; i <= n; i++) {
            sumW += omega[i];
            sumBigW += Omega[i];
        }
        System.out.println(sumW + " " + sumBigW);
    }
}
"""
    },
    {
        "problem_id": 999931,
        "explanation": """### Masala tahlili: Bo'luvchilar Soni va Yig'indisi (Divisor Count and Sum)

Natural $N$ soni berilgan. Uning barcha natural bo'luvchilari soni $d(N)$ hamda yig'indisi $\\sigma(N)$ ni topish talab qilinadi.

#### Matematik formula:
Arifmetikaning asosiy teoremasiga ko'ra, har qanday $N > 1$ soni yagona tarzda tub ko'paytuvchilarga ajraladi:
$$N = p_1^{a_1} \\cdot p_2^{a_2} \\cdots p_k^{a_k}$$

1. **Bo'luvchilar soni:**
$$d(N) = (a_1 + 1)(a_2 + 1)\\cdots(a_k + 1) = \\prod_{i=1}^k (a_i + 1)$$

2. **Bo'luvchilar yig'indisi:**
$$\\sigma(N) = \\prod_{i=1}^k (1 + p_i + p_i^2 + \\dots + p_i^{a_i}) = \\prod_{i=1}^k \\frac{p_i^{a_i + 1} - 1}{p_i - 1}$$

$2$ dan $\\sqrt{N}$ gacha bo'lgan tub ko'paytuvchilarni ajratish yetarlidir.

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
        long long d_count = 1;
        long long sigma_sum = 1;
        long long temp = n;

        for (long long p = 2; p * p <= temp; p++) {
            if (temp % p == 0) {
                long long a = 0;
                long long p_pow = 1;
                long long p_sum = 1;
                while (temp % p == 0) {
                    temp /= p;
                    a++;
                    p_pow *= p;
                    p_sum += p_pow;
                }
                d_count *= (a + 1);
                sigma_sum *= p_sum;
            }
        }
        if (temp > 1) {
            d_count *= 2;
            sigma_sum *= (1 + temp);
        }

        cout << d_count << " " << sigma_sum << "\\n";
    }
    return 0;
}
""",
        "code_python": """import sys

def main():
    tokens = sys.stdin.read().split()
    if not tokens:
        return
    n = int(tokens[0])
    
    d_count = 1
    sigma_sum = 1
    temp = n
    p = 2
    while p * p <= temp:
        if temp % p == 0:
            a = 0
            p_pow = 1
            p_sum = 1
            while temp % p == 0:
                temp //= p
                a += 1
                p_pow *= p
                p_sum += p_pow
            d_count *= (a + 1)
            sigma_sum *= p_sum
        p += 1

    if temp > 1:
        d_count *= 2
        sigma_sum *= (1 + temp)

    print(d_count, sigma_sum)

if __name__ == '__main__':
    main()
""",
        "code_java": """import java.util.Scanner;

public class DivisorsCountSum {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        if (!in.hasNextLong()) return;
        long n = in.nextLong();

        long dCount = 1;
        long sigmaSum = 1;
        long temp = n;

        for (long p = 2; p * p <= temp; p++) {
            if (temp % p == 0) {
                long a = 0;
                long pPow = 1;
                long pSum = 1;
                while (temp % p == 0) {
                    temp /= p;
                    a++;
                    pPow *= p;
                    pSum += pPow;
                }
                dCount *= (a + 1);
                sigmaSum *= pSum;
            }
        }
        if (temp > 1) {
            dCount *= 2;
            sigmaSum *= (1 + temp);
        }

        System.out.println(dCount + " " + sigmaSum);
    }
}
"""
    },
    {
        "problem_id": 999932,
        "explanation": """### Masala tahlili: Umumiy Bo'luvchilar Soni (Common Divisors Count)

Ikkita musbat butun $A$ va $B$ sonining barcha umumiy natural bo'luvchilari sonini topish kerak.

#### Matematik g'oya:
1. $d$ soni ham $A$ ni, ham $B$ ni bo'lsa, u ularning eng katta umumiy bo'luvchisi $G = \\gcd(A, B)$ ning ham bo'luvchisi bo'ladi.
2. Demak, $A$ va $B$ ning barcha umumiy bo'luvchilari to'plami aynan $G$ ning natural bo'luvchilari to'plami bilan bir xildir!
3. Masala $G = \\gcd(A, B)$ sonining bo'luvchilari soni $d(G)$ ni topishga keltiriladi.
4. Evklid algoritmi yordamida $G = \\gcd(A, B)$ hisoblanadi ($O(\\log(\\min(A, B)))$), so'ngra $G$ soni tub ko'paytuvchilarga ajratiladi ($O(\\sqrt{G})$).

#### Murakkablik:
- **Vaqt murakkabligi:** $O(\\log(\\min(A, B)) + \\sqrt{\\gcd(A, B)})$
- **Xotira murakkabligi:** $O(1)$
""",
        "code_cpp": """#include <iostream>
#include <numeric>
using namespace std;

long long gcd(long long a, long long b) {
    while (b) {
        a %= b;
        swap(a, b);
    }
    return a;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    long long a, b;
    if (cin >> a >> b) {
        long long g = gcd(a, b);
        long long ans = 1;
        for (long long p = 2; p * p <= g; p++) {
            if (g % p == 0) {
                long long cnt = 0;
                while (g % p == 0) {
                    g /= p;
                    cnt++;
                }
                ans *= (cnt + 1);
            }
        }
        if (g > 1) ans *= 2;
        cout << ans << "\\n";
    }
    return 0;
}
""",
        "code_python": """import sys
import math

def main():
    tokens = sys.stdin.read().split()
    if not tokens:
        return
    a = int(tokens[0])
    b = int(tokens[1])
    g = math.gcd(a, b)

    ans = 1
    p = 2
    while p * p <= g:
        if g % p == 0:
            cnt = 0
            while g % p == 0:
                g //= p
                cnt += 1
            ans *= (cnt + 1)
        p += 1
    if g > 1:
        ans *= 2

    print(ans)

if __name__ == '__main__':
    main()
""",
        "code_java": """import java.util.Scanner;

public class CommonDivisors {
    static long gcd(long a, long b) {
        while (b != 0) {
            long t = a % b;
            a = b;
            b = t;
        }
        return a;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        if (!in.hasNextLong()) return;
        long a = in.nextLong();
        long b = in.nextLong();
        long g = gcd(a, b);

        long ans = 1;
        for (long p = 2; p * p <= g; p++) {
            if (g % p == 0) {
                long cnt = 0;
                while (g % p == 0) {
                    g /= p;
                    cnt++;
                }
                ans *= (cnt + 1);
            }
        }
        if (g > 1) ans *= 2;

        System.out.println(ans);
    }
}
"""
    },
    {
        "problem_id": 999933,
        "explanation": """### Masala tahlili: Barcha Sonlar Bo'luvchilari Yig'indisi (Sum of Divisors Sum)

Quyidagi yig'indini hisoblash talab etiladi:
$$S(N) = \\sum_{i=1}^N \\sigma(i)$$

#### Matematik almashtirish:
Har bir $d$ soni $1$ dan $N$ gacha bo'lgan sonlar orasida nechtasida bo'luvchi sifatida qatnashadi?
Aynan $\\lfloor \\frac{N}{d} \\rfloor$ ta karralisida!
Demak:
$$S(N) = \\sum_{d=1}^N d \\cdot \\left\\lfloor \\frac{N}{d} \\right\\rfloor$$

#### Kvadrat ildiz dekompozitsiyasi (Floor Division):
$\\lfloor \\frac{N}{d} \\rfloor$ ifodasi faqat $O(\\sqrt{N})$ ta turlicha qiymat qabul qiladi.
Bir xil $k = \\lfloor \\frac{N}{d} \\rfloor$ qiymatiga ega bo'lgan oraliq $[l, r]$ bo'lsa, bu yerda $r = \\lfloor \\frac{N}{k} \\rfloor$.
Ushbu oraliqdagi $d$ larning yig'indisi arifmetik progressiya:
$$\\sum_{d=l}^r d = \\frac{(l + r)(r - l + 1)}{2}$$
Bu orqali har bir blok $O(1)$ da hisoblanadi.

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
        long long total = 0;
        for (long long l = 1, r; l <= n; l = r + 1) {
            long long k = n / l;
            r = n / k;
            // Sum of d in [l, r]: (l + r) * (r - l + 1) / 2
            long long sum_d = (l + r) * (r - l + 1) / 2;
            total += sum_d * k;
        }
        cout << total << "\\n";
    }
    return 0;
}
""",
        "code_python": """import sys

def main():
    tokens = sys.stdin.read().split()
    if not tokens:
        return
    n = int(tokens[0])

    total = 0
    l = 1
    while l <= n:
        k = n // l
        r = n // k
        sum_d = (l + r) * (r - l + 1) // 2
        total += sum_d * k
        l = r + 1

    print(total)

if __name__ == '__main__':
    main()
""",
        "code_java": """import java.util.Scanner;

public class SumOfDivisorsSum {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        if (!in.hasNextLong()) return;
        long n = in.nextLong();

        long total = 0;
        long l = 1;
        while (l <= n) {
            long k = n / l;
            long r = n / k;
            long sumD = (l + r) * (r - l + 1) / 2;
            total += sumD * k;
            l = r + 1;
        }

        System.out.println(total);
    }
}
"""
    },
    {
        "problem_id": 999934,
        "explanation": """### Masala tahlili: Anti-Tub Sonlar (Highly Composite Numbers)

O'zidan kichik barcha sonlardan ko'ra ko'proq natural bo'luvchiga ega bo'lgan son **Anti-tub son (Highly Composite Number)** deyiladi.
$N$ dan oshmaydigan eng katta bo'luvchilar soniga ega eng kichik sonni topish kerak.

#### Matematik xossalar:
Highly Composite Number soni $X = 2^{a_1} 3^{a_2} 5^{a_3} \\dots$ ko'rinishida bo'lib, quyidagi qat'iy qoidalarga bo'ysunadi:
1. Tub ko'paytuvchilar birinchi $k$ ta tub son bo'lishi shart (hech biri tushib qolmaydi).
2. Darajalar kamaymaydigan tartibda bo'ladi:
$$a_1 \\ge a_2 \\ge a_3 \\ge \\dots \\ge a_k \\ge 0$$
3. $N \\le 10^{18}$ gacha bo'lgan sonlar uchun birinchi 15 ta tub son yetarli: $[2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47]$.

Ushbu qidiruv bo'shlig'i juda kichik bo'lib, rekursiv backtracking orqali bir necha millisekundda topiladi.

#### Murakkablik:
- **Vaqt murakkabligi:** $O(\\text{HCN holatlari}) \\ll 10^5$ amallar.
- **Xotira murakkabligi:** $O(1)$.
""",
        "code_cpp": """#include <iostream>
#include <vector>
using namespace std;

const long long primes[] = {2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47};
const int NUM_PRIMES = 15;

long long N;
long long best_num = 1;
long long max_divs = 1;

void dfs(int p_idx, long long current_num, long long current_divs, int max_exp) {
    if (current_divs > max_divs || (current_divs == max_divs && current_num < best_num)) {
        max_divs = current_divs;
        best_num = current_num;
    }
    if (p_idx >= NUM_PRIMES) return;

    long long p = primes[p_idx];
    long long p_pow = p;
    for (int exp = 1; exp <= max_exp; exp++) {
        if (current_num > N / p_pow) break;
        dfs(p_idx + 1, current_num * p_pow, current_divs * (exp + 1), exp);
        if (p_pow > N / p) break;
        p_pow *= p;
    }
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    if (cin >> N) {
        dfs(0, 1, 1, 60);
        cout << best_num << "\\n";
    }
    return 0;
}
""",
        "code_python": """import sys

PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47]

best_num = 1
max_divs = 1
N = 0

def dfs(p_idx, current_num, current_divs, max_exp):
    global best_num, max_divs, N
    if current_divs > max_divs or (current_divs == max_divs and current_num < best_num):
        max_divs = current_divs
        best_num = current_num

    if p_idx >= len(PRIMES):
        return

    p = PRIMES[p_idx]
    p_pow = p
    for exp in range(1, max_exp + 1):
        if current_num * p_pow > N:
            break
        dfs(p_idx + 1, current_num * p_pow, current_divs * (exp + 1), exp)
        p_pow *= p

def main():
    global N
    tokens = sys.stdin.read().split()
    if not tokens:
        return
    N = int(tokens[0])
    dfs(0, 1, 1, 60)
    print(best_num)

if __name__ == '__main__':
    main()
""",
        "code_java": """import java.util.Scanner;

public class HighlyComposite {
    static final long[] PRIMES = {2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47};
    static long N;
    static long bestNum = 1;
    static long maxDivs = 1;

    static void dfs(int pIdx, long currentNum, long currentDivs, int maxExp) {
        if (currentDivs > maxDivs || (currentDivs == maxDivs && currentNum < bestNum)) {
            maxDivs = currentDivs;
            bestNum = currentNum;
        }
        if (pIdx >= PRIMES.length) return;

        long p = PRIMES[pIdx];
        long pPow = p;
        for (int exp = 1; exp <= maxExp; exp++) {
            if (currentNum > N / pPow) break;
            dfs(pIdx + 1, currentNum * pPow, currentDivs * (exp + 1), exp);
            if (pPow > N / p) break;
            pPow *= p;
        }
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        if (!in.hasNextLong()) return;
        N = in.nextLong();
        dfs(0, 1, 1, 60);
        System.out.println(bestNum);
    }
}
"""
    },
    {
        "problem_id": 999936,
        "explanation": """### Masala tahlili: Massivning EKUBi va EKUKi (Array GCD and Modular LCM)

$N$ ta musbat butun sondan iborat massivning barcha elementlarining umumiy EKUBi hamda EKUKining $(10^9 + 7)$ bo'yicha qoldig'ini topish kerak.

#### Matematik g'oya:
1. **EKUB:**
$$G = \\gcd(a_1, \\gcd(a_2, \\dots, a_N))$$
Ketma-ket Evklid algoritmi bilan $O(N \\log(\\max A))$ da topiladi.

2. **EKUK modulo $10^9 + 7$:**
EKUKni oddiy ko'paytirib ketish mumkin emas, chunki modulo ostida bo'lish amali umumiy holatda EKUK xossasini saqlamaydi.
To'g'ri usul: Har bir tub son $p$ uchun, massivdagi barcha sonlarning tub yoyilmasidagi $p$ ning maksimal darajasini $\\max(e_p)$ topamiz:
$$\\text{LCM} = \\prod_{p} p^{\\max(e_p)} \\pmod{10^9 + 7}$$
Har bir sonni tub ko'paytuvchilarga ajratib, xaritada (map yoki array) har bir tub son uchun maksimal darajani saqlaymiz.

#### Murakkablik:
- **Vaqt murakkabligi:** $O(N \\sqrt{\\max A})$
- **Xotira murakkabligi:** $O(\\pi(\\max A))$
""",
        "code_cpp": """#include <iostream>
#include <vector>
#include <numeric>
#include <map>
using namespace std;

const long long MOD = 1000000007;

long long gcd(long long a, long long b) {
    while (b) { a %= b; swap(a, b); }
    return a;
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
    int n;
    if (cin >> n) {
        vector<long long> a(n);
        long long total_gcd = 0;
        map<long long, int> max_prime_pow;

        for (int i = 0; i < n; i++) {
            cin >> a[i];
            total_gcd = (i == 0) ? a[i] : gcd(total_gcd, a[i]);

            long long temp = a[i];
            for (long long p = 2; p * p <= temp; p++) {
                if (temp % p == 0) {
                    int cnt = 0;
                    while (temp % p == 0) {
                        temp /= p;
                        cnt++;
                    }
                    max_prime_pow[p] = max(max_prime_pow[p], cnt);
                }
            }
            if (temp > 1) {
                max_prime_pow[temp] = max(max_prime_pow[temp], 1);
            }
        }

        long long total_lcm = 1;
        for (auto const& [p, exp] : max_prime_pow) {
            total_lcm = (total_lcm * power(p, exp)) % MOD;
        }

        cout << total_gcd << " " << total_lcm << "\\n";
    }
    return 0;
}
""",
        "code_python": """import sys
import math

MOD = 10**9 + 7

def main():
    tokens = sys.stdin.read().split()
    if not tokens:
        return
    n = int(tokens[0])
    a = [int(x) for x in tokens[1:n+1]]

    total_gcd = a[0]
    for x in a[1:]:
        total_gcd = math.gcd(total_gcd, x)

    max_prime_pow = {}
    for x in a:
        temp = x
        p = 2
        while p * p <= temp:
            if temp % p == 0:
                cnt = 0
                while temp % p == 0:
                    temp //= p
                    cnt += 1
                max_prime_pow[p] = max(max_prime_pow.get(p, 0), cnt)
            p += 1
        if temp > 1:
            max_prime_pow[temp] = max(max_prime_pow.get(temp, 0), 1)

    total_lcm = 1
    for p, exp in max_prime_pow.items():
        total_lcm = (total_lcm * pow(p, exp, MOD)) % MOD

    print(total_gcd, total_lcm)

if __name__ == '__main__':
    main()
""",
        "code_java": """import java.util.*;

public class ArrayGcdLcm {
    static final long MOD = 1000000007;

    static long gcd(long a, long b) {
        while (b != 0) {
            long t = a % b;
            a = b;
            b = t;
        }
        return a;
    }

    static long power(long base, long exp) {
        long res = 1;
        base %= MOD;
        while (exp > 0) {
            if (exp % 2 == 1) res = (res * base) % MOD;
            base = (base * base) % MOD;
            exp /= 2;
        }
        return res;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        if (!in.hasNextInt()) return;
        int n = in.nextInt();
        long[] a = new long[n];
        long totalGcd = 0;
        Map<Long, Integer> maxPow = new HashMap<>();

        for (int i = 0; i < n; i++) {
            a[i] = in.nextLong();
            totalGcd = (i == 0) ? a[i] : gcd(totalGcd, a[i]);

            long temp = a[i];
            for (long p = 2; p * p <= temp; p++) {
                if (temp % p == 0) {
                    int cnt = 0;
                    while (temp % p == 0) {
                        temp /= p;
                        cnt++;
                    }
                    maxPow.put(p, Math.max(maxPow.getOrDefault(p, 0), cnt));
                }
            }
            if (temp > 1) {
                maxPow.put(temp, Math.max(maxPow.getOrDefault(temp, 0), 1));
            }
        }

        long totalLcm = 1;
        for (Map.Entry<Long, Integer> entry : maxPow.entrySet()) {
            totalLcm = (totalLcm * power(entry.getKey(), entry.getValue())) % MOD;
        }

        System.out.println(totalGcd + " " + totalLcm);
    }
}
"""
    },
    {
        "problem_id": 999937,
        "explanation": """### Masala tahlili: Chiziqli Diofant Tenglamasi (Linear Diophantine Equation)

Berilgan tenglamaning butun sonlardagi yechimini topish talab qilinadi:
$$A \\cdot x + B \\cdot y = C$$

#### Matematik asos:
Bezu ayniyatiga ko'ra, $A \\cdot x + B \\cdot y = C$ tenglama butun sonlarda yechimga ega bo'lishi uchun zarur va yetarli shart:
$$C \\pmod{\\gcd(A, B)} == 0$$
Agar $C$ soni $g = \\gcd(A, B)$ ga bo'linmasa, butun yechim mavjud emas ("NO").

#### Kengaytirilgan Evklid Algoritmi:
Kengaytirilgan Evklid (Extended Euclidean Algorithm) orqali:
$$A \\cdot x_0 + B \\cdot y_0 = g$$
yechimi topiladi.
So'ngra ikkala tomonni $\\frac{C}{g}$ ga ko'paytirsak:
$$x = x_0 \\cdot \\frac{C}{g}, \\quad y = y_0 \\cdot \\frac{C}{g}$$
boshlang'ich butun yechim hosil bo'ladi.

#### Murakkablik:
- **Vaqt murakkabligi:** $O(\\log(\\min(|A|, |B|)))$
- **Xotira murakkabligi:** $O(1)$
""",
        "code_cpp": """#include <iostream>
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

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    long long a, b, c;
    if (cin >> a >> b >> c) {
        long long x, y;
        long long g = extgcd(abs(a), abs(b), x, y);
        if (c % g != 0) {
            cout << "NO\\n";
        } else {
            cout << "YES\\n";
            long long k = c / g;
            if (a < 0) x = -x;
            if (b < 0) y = -y;
            cout << (x * k) << " " << (y * k) << "\\n";
        }
    }
    return 0;
}
""",
        "code_python": """import sys

def extgcd(a, b):
    if b == 0:
        return a, 1, 0
    d, x1, y1 = extgcd(b, a % b)
    x = y1
    y = x1 - y1 * (a // b)
    return d, x, y

def main():
    tokens = sys.stdin.read().split()
    if not tokens:
        return
    a = int(tokens[0])
    b = int(tokens[1])
    c = int(tokens[2])

    g, x, y = extgcd(abs(a), abs(b))
    if c % g != 0:
        print("NO")
    else:
        print("YES")
        k = c // g
        if a < 0: x = -x
        if b < 0: y = -y
        print(f"{x * k} {y * k}")

if __name__ == '__main__':
    main()
""",
        "code_java": """import java.util.Scanner;

public class Diophantine {
    static long extgcd(long a, long b, long[] xy) {
        if (b == 0) {
            xy[0] = 1;
            xy[1] = 0;
            return a;
        }
        long[] xy1 = new long[2];
        long d = extgcd(b, a % b, xy1);
        xy[0] = xy1[1];
        xy[1] = xy1[0] - xy1[1] * (a / b);
        return d;
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        if (!in.hasNextLong()) return;
        long a = in.nextLong();
        long b = in.nextLong();
        long c = in.nextLong();

        long[] xy = new long[2];
        long g = extgcd(Math.abs(a), Math.abs(b), xy);

        if (c % g != 0) {
            System.out.println("NO");
        } else {
            System.out.println("YES");
            long k = c / g;
            long x = xy[0] * (a < 0 ? -1 : 1);
            long y = xy[1] * (b < 0 ? -1 : 1);
            System.out.println((x * k) + " " + (y * k));
        }
    }
}
"""
    },
    {
        "problem_id": 999938,
        "explanation": """### Masala tahlili: Barcha Juftliklar EKUB Yig'indisi (GCD Pairs Sum)

Berilgan $N$ uchun quyidagi ifodani hisoblash talab etiladi:
$$G(N) = \\sum_{i=1}^N \\sum_{j=i+1}^N \\gcd(i, j)$$

#### Matematik g'oya va Eyler funksiyasi:
Har bir mumkin bo'lgan $g = \\gcd(i, j)$ ni ko'rib chiqamiz. Agar $i = g \\cdot x$ va $j = g \\cdot y$ bo'lsa, $\\gcd(x, y) = 1$ va $1 \\le x < y \\le \\lfloor N / g \\rfloor$.
Har bir qat'iy $y$ uchun $1 \\le x < y$ va $\\gcd(x, y) = 1$ bo'lgan $x$ larning soni aynan **Eyler funksiyasi** $\\varphi(y)$ ga tengdir!
Shuning uchun:
$$G(N) = \\sum_{g=1}^N g \\sum_{y=2}^{\\lfloor N / g \\rfloor} \\varphi(y)$$

1. Chiziqli g'alvir yordamida $1$ dan $N$ gacha bo'lgan barcha $\\varphi(y)$ larni hisoblaymiz: $O(N)$.
2. $\\varphi(y)$ larning prefiks yig'indisini tuzamiz:
$$S_\\varphi(m) = \\sum_{y=2}^m \\varphi(y)$$
3. Umumiy yig'indi bir zumda hisoblanadi:
$$G(N) = \\sum_{g=1}^N g \\cdot S_\\varphi\\left(\\left\\lfloor \\frac{N}{g} \\right\\rfloor\\right)$$

#### Murakkablik:
- **Vaqt murakkabligi:** $O(N)$
- **Xotira murakkabligi:** $O(N)$
""",
        "code_cpp": """#include <iostream>
#include <vector>
using namespace std;

const int MAXN = 2000000;
int phi[MAXN + 1];
long long pref_phi[MAXN + 1];
vector<int> primes;

void precompute(int n) {
    phi[1] = 1;
    for (int i = 2; i <= n; i++) {
        if (phi[i] == 0) {
            phi[i] = i - 1;
            primes.push_back(i);
        }
        for (int p : primes) {
            if ((long long)i * p > n) break;
            if (i % p == 0) {
                phi[i * p] = phi[i] * p;
                break;
            } else {
                phi[i * p] = phi[i] * (p - 1);
            }
        }
    }
    for (int i = 2; i <= n; i++) {
        pref_phi[i] = pref_phi[i - 1] + phi[i];
    }
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n;
    if (cin >> n) {
        precompute(n);
        long long ans = 0;
        for (int g = 1; g <= n; g++) {
            ans += (long long)g * pref_phi[n / g];
        }
        cout << ans << "\\n";
    }
    return 0;
}
""",
        "code_python": """import sys

def precompute(n):
    phi = [0] * (n + 1)
    phi[1] = 1
    primes = []
    for i in range(2, n + 1):
        if phi[i] == 0:
            phi[i] = i - 1
            primes.append(i)
        for p in primes:
            if i * p > n:
                break
            if i % p == 0:
                phi[i * p] = phi[i] * p
                break
            else:
                phi[i * p] = phi[i] * (p - 1)

    pref_phi = [0] * (n + 1)
    for i in range(2, n + 1):
        pref_phi[i] = pref_phi[i - 1] + phi[i]
    return pref_phi

def main():
    tokens = sys.stdin.read().split()
    if not tokens:
        return
    n = int(tokens[0])
    pref_phi = precompute(n)

    ans = 0
    for g in range(1, n + 1):
        ans += g * pref_phi[n // g]

    print(ans)

if __name__ == '__main__':
    main()
""",
        "code_java": """import java.util.*;

public class GcdPairsSum {
    static int[] phi;
    static long[] prefPhi;

    static void precompute(int n) {
        phi = new int[n + 1];
        prefPhi = new long[n + 1];
        phi[1] = 1;
        int[] primes = new int[n / 2 + 1];
        int pCount = 0;

        for (int i = 2; i <= n; i++) {
            if (phi[i] == 0) {
                phi[i] = i - 1;
                primes[pCount++] = i;
            }
            for (int j = 0; j < pCount; j++) {
                int p = primes[j];
                if ((long) i * p > n) break;
                if (i % p == 0) {
                    phi[i * p] = phi[i] * p;
                    break;
                } else {
                    phi[i * p] = phi[i] * (p - 1);
                }
            }
        }

        for (int i = 2; i <= n; i++) {
            prefPhi[i] = prefPhi[i - 1] + phi[i];
        }
    }

    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        if (!in.hasNextInt()) return;
        int n = in.nextInt();
        precompute(n);

        long ans = 0;
        for (int g = 1; g <= n; g++) {
            ans += (long) g * prefPhi[n / g];
        }
        System.out.println(ans);
    }
}
"""
    },
    {
        "problem_id": 999939,
        "explanation": """### Masala tahlili: O'zaro Tub Juftliklar Soni (Coprime Pairs Count)

$N$ ta butun sondan iborat $A = [a_1, a_2, \\dots, a_N]$ massiv berilgan. Barcha $1 \\le i < j \\le N$ uchun $\\gcd(a_i, a_j) = 1$ shartini qanoatlantiruvchi juftliklar sonini hisoblash talab etiladi.

#### Matematik g'oya: Mobius Inversiyasi
Iveron qavsi bo'yicha:
$$[\\gcd(a_i, a_j) = 1] = \\sum_{d \\mid \\gcd(a_i, a_j)} \\mu(d)$$
Bu yerda $\\mu(d)$ — **Mobius funksiyasi**.
Ushbu ifodani barcha juftliklar ustidan yig'sak:
$$\\sum_{1 \\le i < j \\le N} [\\gcd(a_i, a_j) = 1] = \\sum_{d=1}^{M} \\mu(d) \\cdot \\frac{C_d (C_d - 1)}{2}$$
bu yerda:
- $M = \\max(A)$
- $C_d$ — berilgan massivdagi $d$ ga karrali bo'lgan elementlar soni.

#### Algoritm qadamlari:
1. Massiv elementlarining uchrashlar chastotasi `cnt[v]` ni hisoblaymiz.
2. Har bir $d$ uchun $C_d = \\sum_{k=1}^{\\lfloor M/d \\rfloor} cnt[k \\cdot d]$ ni Eratosfen g'alviri usulida hisoblaymiz: $O(M \\log M)$.
3. Chiziqli g'alvir bilan $\\mu(d)$ ni topib, yakuniy yig'indini olamiz.

#### Murakkablik:
- **Vaqt murakkabligi:** $O(M \\log M + N)$
- **Xotira murakkabligi:** $O(M)$
""",
        "code_cpp": """#include <iostream>
#include <vector>
using namespace std;

const int MAXA = 1000000;
int mu[MAXA + 1];
int cnt[MAXA + 1];
int C[MAXA + 1];
vector<int> primes;

void sieve(int m) {
    vector<bool> is_p(m + 1, true);
    mu[1] = 1;
    for (int i = 2; i <= m; i++) {
        if (is_p[i]) {
            primes.push_back(i);
            mu[i] = -1;
        }
        for (int p : primes) {
            if ((long long)i * p > m) break;
            is_p[i * p] = false;
            if (i % p == 0) {
                mu[i * p] = 0;
                break;
            } else {
                mu[i * p] = -mu[i];
            }
        }
    }
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n;
    if (cin >> n) {
        int max_val = 1;
        for (int i = 0; i < n; i++) {
            int x;
            cin >> x;
            cnt[x]++;
            if (x > max_val) max_val = x;
        }

        sieve(max_val);

        for (int d = 1; d <= max_val; d++) {
            for (int k = d; k <= max_val; k += d) {
                C[d] += cnt[k];
            }
        }

        long long coprime_pairs = 0;
        for (int d = 1; d <= max_val; d++) {
            if (mu[d] != 0 && C[d] >= 2) {
                coprime_pairs += (long long)mu[d] * ((long long)C[d] * (C[d] - 1) / 2);
            }
        }

        cout << coprime_pairs << "\\n";
    }
    return 0;
}
""",
        "code_python": """import sys

MAXA = 1000000

def main():
    tokens = sys.stdin.read().split()
    if not tokens:
        return
    n = int(tokens[0])
    a = [int(x) for x in tokens[1:n+1]]
    max_val = max(a) if a else 1

    cnt = [0] * (max_val + 1)
    for x in a:
        cnt[x] += 1

    # Linear sieve for Mobius function
    mu = [0] * (max_val + 1)
    mu[1] = 1
    is_p = [True] * (max_val + 1)
    primes = []
    for i in range(2, max_val + 1):
        if is_p[i]:
            primes.append(i)
            mu[i] = -1
        for p in primes:
            if i * p > max_val:
                break
            is_p[i * p] = False
            if i % p == 0:
                mu[i * p] = 0
                break
            else:
                mu[i * p] = -mu[i]

    # Compute C[d]
    C = [0] * (max_val + 1)
    for d in range(1, max_val + 1):
        s = 0
        for k in range(d, max_val + 1, d):
            s += cnt[k]
        C[d] = s

    coprime_pairs = 0
    for d in range(1, max_val + 1):
        if mu[d] != 0 and C[d] >= 2:
            coprime_pairs += mu[d] * (C[d] * (C[d] - 1) // 2)

    print(coprime_pairs)

if __name__ == '__main__':
    main()
""",
        "code_java": """import java.io.*;
import java.util.*;

public class CoprimePairs {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String line = br.readLine();
        if (line == null) return;
        int n = Integer.parseInt(line.trim());

        int[] a = new int[n];
        int maxVal = 1;
        StringTokenizer st = new StringTokenizer(br.readLine());
        for (int i = 0; i < n; i++) {
            a[i] = Integer.parseInt(st.nextToken());
            if (a[i] > maxVal) maxVal = a[i];
        }

        int[] cnt = new int[maxVal + 1];
        for (int x : a) cnt[x]++;

        int[] mu = new int[maxVal + 1];
        mu[1] = 1;
        boolean[] isP = new boolean[maxVal + 1];
        Arrays.fill(isP, true);
        List<Integer> primes = new ArrayList<>();

        for (int i = 2; i <= maxVal; i++) {
            if (isP[i]) {
                primes.add(i);
                mu[i] = -1;
            }
            for (int p : primes) {
                if ((long) i * p > maxVal) break;
                isP[i * p] = false;
                if (i % p == 0) {
                    mu[i * p] = 0;
                    break;
                } else {
                    mu[i * p] = -mu[i];
                }
            }
        }

        int[] C = new int[maxVal + 1];
        for (int d = 1; d <= maxVal; d++) {
            int s = 0;
            for (int k = d; k <= maxVal; k += d) s += cnt[k];
            C[d] = s;
        }

        long coprimePairs = 0;
        for (int d = 1; d <= maxVal; d++) {
            if (mu[d] != 0 && C[d] >= 2) {
                coprimePairs += (long) mu[d] * ((long) C[d] * (C[d] - 1) / 2);
            }
        }

        System.out.println(coprimePairs);
    }
}
"""
    }
]

def seed():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # 1. Ensure editorial_enabled and editorial_published are 1 for contest 1000016
    c.execute("UPDATE contests SET editorial_enabled = 1, editorial_published = 1 WHERE id = 1000016")
    
    # 2. Insert/Update all 12 editorials
    inserted = 0
    for ed in EDITORIALS:
        c.execute("""
            INSERT INTO contest_editorials (
                contest_id, problem_id, explanation, code_cpp, code_python, code_java, is_published, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
            ON CONFLICT(contest_id, problem_id) DO UPDATE SET
                explanation = excluded.explanation,
                code_cpp = excluded.code_cpp,
                code_python = excluded.code_python,
                code_java = excluded.code_java,
                is_published = 1,
                updated_at = CURRENT_TIMESTAMP
        """, (
            1000016,
            ed["problem_id"],
            ed["explanation"],
            ed["code_cpp"],
            ed["code_python"],
            ed["code_java"]
        ))
        inserted += 1
    
    conn.commit()
    print(f"Successfully seeded {inserted} rich editorials for Contest 1000016.")
    
    # Verify count
    c.execute("SELECT count(*) FROM contest_editorials WHERE contest_id = 1000016")
    total = c.fetchone()[0]
    print(f"Total editorials in DB for Contest 1000016: {total}")
    conn.close()

if __name__ == '__main__':
    seed()
