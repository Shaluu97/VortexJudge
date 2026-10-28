# -*- coding: utf-8 -*-
"""
Automated test suite for Contest Editorial System.
Verifies RBAC, Visibility Toggle, PUT (Edit), DELETE, and Student Views.
"""
import urllib.request
import urllib.parse
import http.cookiejar
import json
import sys

BASE_URL = "http://localhost:3000"

def run_tests():
    print("=== STARTING EDITORIAL SYSTEM VERIFICATION ===")
    
    # Setup cookie jar for admin session
    cj = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
    
    # 1. Login as Admin
    print("\n1. Testing Admin Authentication...")
    login_data = json.dumps({"username": "admin", "password": "admin2026"}).encode('utf-8')
    req = urllib.request.Request(f"{BASE_URL}/api/auth/login", data=login_data, headers={"Content-Type": "application/json"})
    try:
        resp = opener.open(req)
        assert resp.getcode() == 200, f"Expected 200, got {resp.getcode()}"
        login_res = json.loads(resp.read().decode('utf-8'))
        print(f"   [PASS] Logged in as: {login_res.get('user', {}).get('full_name')} ({login_res.get('user', {}).get('role')})")
    except Exception as e:
        print(f"   [FAIL] Admin login failed: {e}")
        sys.exit(1)

    # 2. Test GET /api/contests/1000016/editorial as Admin
    print("\n2. Testing GET /api/contests/1000016/editorial (Admin view)...")
    req = urllib.request.Request(f"{BASE_URL}/api/contests/1000016/editorial")
    resp = opener.open(req)
    assert resp.getcode() == 200
    data = json.loads(resp.read().decode('utf-8'))
    print(f"   [PASS] Contest Title: {data['contest']['title']}")
    print(f"   [PASS] Total Problems in Contest: {len(data['problems'])}")
    print(f"   [PASS] Is Staff: {data['is_staff']}")
    print(f"   [PASS] Is Ended: {data['is_ended']}")
    print(f"   [PASS] Editorial Enabled: {data['editorial_enabled']}")
    
    # Check that problem 999926 has explanation and all 3 codes
    p1 = next((p for p in data['problems'] if p['problem_id'] == 999926), None)
    assert p1 is not None, "Problem 999926 not found"
    assert p1.get('explanation'), "Problem 999926 explanation is empty"
    assert p1.get('code_cpp'), "Problem 999926 C++ code is empty"
    assert p1.get('code_python'), "Problem 999926 Python code is empty"
    assert p1.get('code_java'), "Problem 999926 Java code is empty"
    print(f"   [PASS] Problem 999926 has complete editorial (explanation + C++ + Python + Java).")

    # 3. Test Student (Guest / Unauthenticated) View when Enabled & Ended
    print("\n3. Testing Student GET /api/contests/1000016/editorial when Enabled & Ended...")
    guest_opener = urllib.request.build_opener() # fresh opener without cookies
    req = urllib.request.Request(f"{BASE_URL}/api/contests/1000016/editorial")
    resp = guest_opener.open(req)
    assert resp.getcode() == 200, f"Expected 200 for student, got {resp.getcode()}"
    student_data = json.loads(resp.read().decode('utf-8'))
    print(f"   [PASS] Student received editorial data successfully ({len(student_data['problems'])} problems).")
    print(f"   [PASS] Student is_staff: {student_data['is_staff']}")

    # 4. Test Visibility Toggle (Disable -> Student gets 403)
    print("\n4. Testing Visibility Toggle: Admin sets Disabled (enabled = 0)...")
    toggle_payload = json.dumps({"enabled": 0}).encode('utf-8')
    req = urllib.request.Request(f"{BASE_URL}/api/contests/1000016/editorial/visibility", data=toggle_payload, headers={"Content-Type": "application/json"})
    resp = opener.open(req)
    assert resp.getcode() == 200
    res_toggle = json.loads(resp.read().decode('utf-8'))
    print(f"   [PASS] Toggle response: {res_toggle['message']} (editorial_enabled={res_toggle['editorial_enabled']})")

    # Test student gets 403 now
    print("   Testing Student access when Disabled...")
    req = urllib.request.Request(f"{BASE_URL}/api/contests/1000016/editorial")
    try:
        guest_opener.open(req)
        print("   [FAIL] Student was able to access editorial when disabled!")
        sys.exit(1)
    except urllib.error.HTTPError as e:
        assert e.code == 403, f"Expected 403, got {e.code}"
        err_body = json.loads(e.read().decode('utf-8'))
        print(f"   [PASS] Student received expected HTTP 403 Forbidden: {err_body['error']}")
        print(f"   [PASS] Locked banner metadata: locked={err_body['locked']}, editorial_enabled={err_body['editorial_enabled']}")

    # Test Admin still gets 200 even when disabled
    req = urllib.request.Request(f"{BASE_URL}/api/contests/1000016/editorial")
    admin_resp = opener.open(req)
    assert admin_resp.getcode() == 200
    print("   [PASS] Admin can still view and manage editorial even when disabled for students.")

    # Re-enable visibility
    print("   Re-enabling editorial visibility (enabled = 1)...")
    toggle_payload = json.dumps({"enabled": 1}).encode('utf-8')
    req = urllib.request.Request(f"{BASE_URL}/api/contests/1000016/editorial/visibility", data=toggle_payload, headers={"Content-Type": "application/json"})
    resp = opener.open(req)
    assert resp.getcode() == 200
    print("   [PASS] Re-enabled successfully.")

    # 5. Test PUT /api/contests/1000016/editorial/999926 (Edit)
    print("\n5. Testing PUT (Edit) Problem Editorial...")
    updated_explanation = p1['explanation'] + "\n\n*(Admin tomonidan tahrirlandi: $O(\\sqrt{N})$ tasdiqlandi)*"
    put_payload = json.dumps({
        "explanation": updated_explanation,
        "code_cpp": p1['code_cpp'],
        "code_python": p1['code_python'],
        "code_java": p1['code_java']
    }).encode('utf-8')
    req = urllib.request.Request(f"{BASE_URL}/api/contests/1000016/editorial/999926", data=put_payload, headers={"Content-Type": "application/json"}, method='PUT')
    resp = opener.open(req)
    assert resp.getcode() == 200
    put_res = json.loads(resp.read().decode('utf-8'))
    print(f"   [PASS] PUT response: {put_res.get('message')}")

    # Verify update in GET
    req = urllib.request.Request(f"{BASE_URL}/api/contests/1000016/editorial")
    data_after_put = json.loads(opener.open(req).read().decode('utf-8'))
    p1_after = next(p for p in data_after_put['problems'] if p['problem_id'] == 999926)
    assert "Admin tomonidan tahrirlandi" in p1_after['explanation']
    print("   [PASS] Verified updated explanation via GET.")

    # 6. Test DELETE /api/contests/1000016/editorial/999926
    print("\n6. Testing DELETE Problem Editorial...")
    req = urllib.request.Request(f"{BASE_URL}/api/contests/1000016/editorial/999926", method='DELETE')
    resp = opener.open(req)
    assert resp.getcode() == 200
    del_res = json.loads(resp.read().decode('utf-8'))
    print(f"   [PASS] DELETE response: {del_res.get('message')}")

    # Verify problem editorial is now empty/null in GET
    req = urllib.request.Request(f"{BASE_URL}/api/contests/1000016/editorial")
    data_after_del = json.loads(opener.open(req).read().decode('utf-8'))
    p1_del = next(p for p in data_after_del['problems'] if p['problem_id'] == 999926)
    assert p1_del['explanation'] is None, f"Expected None explanation, got {p1_del['explanation']}"
    print("   [PASS] Verified problem 999926 editorial was deleted.")

    # Restore problem 999926 editorial
    print("   Restoring problem 999926 editorial...")
    restore_payload = json.dumps({
        "explanation": p1['explanation'],
        "code_cpp": p1['code_cpp'],
        "code_python": p1['code_python'],
        "code_java": p1['code_java']
    }).encode('utf-8')
    req = urllib.request.Request(f"{BASE_URL}/api/contests/1000016/editorial/999926", data=restore_payload, headers={"Content-Type": "application/json"}, method='PUT')
    opener.open(req)
    print("   [PASS] Problem 999926 editorial restored.")

    # 7. Final status verification
    print("\n7. Final System Verification...")
    req = urllib.request.Request(f"{BASE_URL}/api/contests/1000016/editorial")
    final_data = json.loads(opener.open(req).read().decode('utf-8'))
    assert len(final_data['problems']) == 12
    for p in final_data['problems']:
        assert p['explanation'] and p['code_cpp'] and p['code_python'] and p['code_java']
    print(f"   [PASS] All 12 problems in Contest 1000016 have 100% full rich editorials.")

    print("\n=== ALL EDITORIAL SYSTEM TESTS PASSED SUCCESSFULLY! ===")

if __name__ == '__main__':
    run_tests()
