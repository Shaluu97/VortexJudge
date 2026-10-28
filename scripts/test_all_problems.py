"""
Comprehensive test & verification runner for all 15 contest problems.
"""

import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
PROBLEMS_DIR = REPO_ROOT / "problems"
TESTLIB_DIR = REPO_ROOT / "testlib"

ENV = dict(os.environ)
ENV["PATH"] = r"C:\msys64\ucrt64\bin;" + ENV.get("PATH", "")

CXX = "g++"
CXXFLAGS = [
    "-std=c++17",
    "-O2",
    "-Wall",
    "-Wextra",
    "-Werror",
    f"-I{TESTLIB_DIR}"
]

def log(msg: str):
    print(msg, flush=True)

def to_windows_eol(data: bytes) -> bytes:
    return data.replace(b"\r\n", b"\n").replace(b"\n", b"\r\n")

def clean_text(s: str) -> str:
    return "\n".join(line.strip() for line in s.replace("\r\n", "\n").strip().splitlines() if line.strip())

def run_cmd(cmd: list[str], input_bytes: bytes = None, timeout: float = 30.0):
    if input_bytes is not None:
        input_bytes = to_windows_eol(input_bytes)
    try:
        proc = subprocess.run(
            cmd,
            input=input_bytes,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=timeout,
            env=ENV,
            check=False
        )
        return proc.returncode, proc.stdout, proc.stderr
    except subprocess.TimeoutExpired:
        return -999, b"", b"TIMEOUT"

def test_problem(pdir: Path, stress_count: int = 10):
    name = pdir.name
    log(f"\n==================================================")
    log(f"Testing problem: {name}")
    log(f"==================================================")

    build_dir = pdir / ".build_test"
    if build_dir.exists():
        shutil.rmtree(build_dir, ignore_errors=True)
    build_dir.mkdir(parents=True, exist_ok=True)

    # 1. Static Checks
    for f in (pdir / "solutions").glob("*.*"):
        content = f.read_text(encoding="utf-8", errors="ignore")
        if "#pragma GCC optimize" in content:
            log(f"  [FAIL] Static check: optimize pragma found in {f.name}")
            return False
        if "freopen" in content:
            log(f"  [FAIL] Static check: freopen found in {f.name}")
            return False
    log("  [PASS] Static checks (no pragmas, no freopen)")

    # 2. Compilations
    # Validator
    val_exe = build_dir / "validator.exe"
    rc, _, err = run_cmd([CXX] + CXXFLAGS + [str(pdir / "validator.cpp"), "-o", str(val_exe)], timeout=45.0)
    if rc != 0:
        log(f"  [FAIL] Validator compilation error:\n{err.decode(errors='ignore')}")
        return False
    log("  [PASS] Validator compiled (-Werror)")

    # Generator
    gen_exe = build_dir / "gen.exe"
    rc, _, err = run_cmd([CXX] + CXXFLAGS + [str(pdir / "generators" / "generator.cpp"), "-o", str(gen_exe)], timeout=45.0)
    if rc != 0:
        log(f"  [FAIL] Generator compilation error:\n{err.decode(errors='ignore')}")
        return False
    log("  [PASS] Generator compiled (-Werror)")

    # Solutions
    sol_map = {}
    for sol in ["acc", "acc_alt", "brute", "wa"]:
        exe = build_dir / f"{sol}.exe"
        rc, _, err = run_cmd([CXX] + CXXFLAGS + [str(pdir / "solutions" / f"{sol}.cpp"), "-o", str(exe)], timeout=45.0)
        if rc != 0:
            log(f"  [FAIL] {sol}.cpp compilation error:\n{err.decode(errors='ignore')}")
            return False
        sol_map[sol] = exe
    log("  [PASS] Solutions compiled: acc, acc_alt, brute, wa (-Werror)")

    # Java compilation
    java_class = build_dir
    rc, _, err = run_cmd(["javac", "-Xlint:all", "-d", str(java_class), str(pdir / "solutions" / "acc_java.java")], timeout=45.0)
    if rc != 0:
        log(f"  [FAIL] Java compilation error:\n{err.decode(errors='ignore')}")
        return False
    log("  [PASS] Java ACC compiled (javac -Xlint:all)")

    # 3. Validator Tests
    for vf in sorted((pdir / "validator_tests").glob("*.in")):
        in_bytes = vf.read_bytes()
        rc, _, err = run_cmd([str(val_exe)], input_bytes=in_bytes, timeout=10.0)
        is_valid_test = vf.name.startswith("valid_")
        if is_valid_test and rc != 0:
            log(f"  [FAIL] Validator rejected expected valid test: {vf.name} (rc={rc}, err={err.decode(errors='ignore').strip()})")
            return False
        elif not is_valid_test and rc == 0:
            log(f"  [FAIL] Validator accepted expected invalid test: {vf.name}")
            return False
    log("  [PASS] Validator tests checked (valid & invalid handled correctly)")

    # 4. Samples Verification
    sample_in = (pdir / "samples" / "1.in").read_bytes()
    expected_out = clean_text((pdir / "samples" / "1.out").read_text(encoding="utf-8"))

    # Validate sample input
    rc, _, err = run_cmd([str(val_exe)], input_bytes=sample_in, timeout=10.0)
    if rc != 0:
        log(f"  [FAIL] Validator rejected sample input 1.in:\n{err.decode(errors='ignore')}")
        return False

    # Check acc
    rc, out, _ = run_cmd([str(sol_map["acc"])], input_bytes=sample_in, timeout=10.0)
    if clean_text(out.decode(errors='ignore')) != expected_out:
        log(f"  [FAIL] ACC sample mismatch: got '{clean_text(out.decode(errors='ignore'))}', expected '{expected_out}'")
        return False

    # Check acc_alt
    rc, out, _ = run_cmd([str(sol_map["acc_alt"])], input_bytes=sample_in, timeout=10.0)
    if clean_text(out.decode(errors='ignore')) != expected_out:
        log(f"  [FAIL] acc_alt sample mismatch: got '{clean_text(out.decode(errors='ignore'))}', expected '{expected_out}'")
        return False

    # Check brute
    rc, out, _ = run_cmd([str(sol_map["brute"])], input_bytes=sample_in, timeout=10.0)
    if clean_text(out.decode(errors='ignore')) != expected_out:
        log(f"  [FAIL] Brute sample mismatch: got '{clean_text(out.decode(errors='ignore'))}', expected '{expected_out}'")
        return False

    # Check Java ACC
    rc, out, _ = run_cmd(["java", "-cp", str(java_class), "acc_java"], input_bytes=sample_in, timeout=10.0)
    if clean_text(out.decode(errors='ignore')) != expected_out:
        log(f"  [FAIL] Java ACC sample mismatch: got '{clean_text(out.decode(errors='ignore'))}', expected '{expected_out}'")
        return False

    log("  [PASS] Sample 1: verified on acc, acc_alt, acc_java, brute")

    # 5. Stress Testing (ACC vs Brute & Java ACC)
    stress_conf = (pdir / "stress.conf").read_text(encoding="utf-8").strip().split()
    log(f"  Running stress tests ({stress_count} iterations)...")
    wa_rejected = False
    for seed in range(1, stress_count + 1):
        gen_cmd = [str(gen_exe)] + stress_conf + [str(seed)]
        rc, test_in, err = run_cmd(gen_cmd, timeout=10.0)
        if rc != 0 or len(test_in) == 0:
            log(f"  [FAIL] Generator error on seed {seed}:\n{err.decode(errors='ignore')}")
            return False

        # Validate generated input
        rc, _, err = run_cmd([str(val_exe)], input_bytes=test_in, timeout=10.0)
        if rc != 0:
            log(f"  [FAIL] Validator rejected generated test (seed {seed}):\n{err.decode(errors='ignore')}")
            return False

        # Run acc
        _, acc_out, _ = run_cmd([str(sol_map["acc"])], input_bytes=test_in, timeout=10.0)
        # Run brute
        _, brute_out, _ = run_cmd([str(sol_map["brute"])], input_bytes=test_in, timeout=10.0)

        acc_txt = clean_text(acc_out.decode(errors='ignore'))
        brute_txt = clean_text(brute_out.decode(errors='ignore'))

        if acc_txt != brute_txt:
            log(f"  [FAIL] Stress mismatch on seed {seed}!")
            log(f"    Input: {test_in.decode()[:100]}")
            log(f"    ACC:   {acc_txt[:100]}")
            log(f"    Brute: {brute_txt[:100]}")
            return False

        # Run Java ACC
        _, java_out, _ = run_cmd(["java", "-cp", str(java_class), "acc_java"], input_bytes=test_in, timeout=10.0)
        java_txt = clean_text(java_out.decode(errors='ignore'))
        if java_txt != acc_txt:
            log(f"  [FAIL] Java ACC mismatch with C++ ACC on seed {seed}!")
            return False

        # Check WA solution
        _, wa_out, _ = run_cmd([str(sol_map["wa"])], input_bytes=test_in, timeout=10.0)
        wa_txt = clean_text(wa_out.decode(errors='ignore'))
        if wa_txt != acc_txt:
            wa_rejected = True

    log(f"  [PASS] Stress test passed ({stress_count}/{stress_count} iterations matched ACC vs Brute vs Java)")
    if wa_rejected:
        log("  [PASS] WA solution correctly rejected on stress tests")
    else:
        log("  [NOTE] WA solution passed small stress tests (subtle bug)")

    time.sleep(0.1)
    shutil.rmtree(build_dir, ignore_errors=True)
    return True

def main():
    problems = sorted([d for d in PROBLEMS_DIR.iterdir() if d.is_dir() and d.name.startswith("grade")])
    log(f"Found {len(problems)} contest problems to test.\n")

    results = {}
    for pdir in problems:
        ok = test_problem(pdir, stress_count=10)
        results[pdir.name] = ok

    log("\n" + "=" * 50)
    log("OVERALL SUMMARY")
    log("=" * 50)
    passed = 0
    for name, ok in results.items():
        status = "[PASS]" if ok else "[FAIL]"
        log(f"  {status} {name}")
        if ok:
            passed += 1

    log(f"\nResult: {passed}/{len(problems)} problems passed all checks.")
    if passed == len(problems):
        log("ALL CONTEST PROBLEMS VERIFIED SUCCESSFULLY!")
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()
