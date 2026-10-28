import urllib.request
import urllib.parse
import http.cookiejar
import json

BASE_URL = "http://localhost:3000"

def run_tests():
    cj = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))

    print("1. Logging in as admin...")
    login_data = json.dumps({"username": "admin", "password": "admin2026"}).encode('utf-8')
    req = urllib.request.Request(f"{BASE_URL}/api/auth/login", data=login_data, headers={'Content-Type': 'application/json'})
    with opener.open(req) as res:
        assert res.status == 200
        print("   Admin logged in successfully.")

    print("2. Fetching editorial as admin...")
    with opener.open(f"{BASE_URL}/api/contests/6/editorial") as res:
        assert res.status == 200
        ed_data = json.loads(res.read().decode('utf-8'))
        assert "problems" in ed_data
        assert len(ed_data.get("problems", [])) == 20
        print(f"   Admin successfully retrieved {len(ed_data['problems'])} problem editorials!")
        p1 = ed_data["problems"][0]
        print(f"   Problem {p1['letter']} ({p1['title']}):")
        print(f"     Explanation length: {len(p1['explanation'])} chars")
        print(f"     C++ code: {len(p1['code_cpp'])} chars")
        print(f"     Python code: {len(p1['code_python'])} chars")
        print(f"     Java code: {len(p1['code_java'])} chars")

    print("3. Testing Admin PUT editorial update...")
    update_data = json.dumps({
        "explanation": p1["explanation"] + "\n\n*(Admin tomonidan tekshirilgan va tasdiqlangan)*",
        "code_cpp": p1["code_cpp"],
        "code_python": p1["code_python"],
        "code_java": p1["code_java"]
    }).encode('utf-8')
    req_put = urllib.request.Request(f"{BASE_URL}/api/contests/6/editorial/4001", data=update_data, headers={'Content-Type': 'application/json'}, method='PUT')
    with opener.open(req_put) as res:
        assert res.status == 200
        print("   Editorial update successful.")

    print("4. Testing Toggle Publish (to Published = 1)...")
    req_toggle = urllib.request.Request(f"{BASE_URL}/api/contests/6/editorial/toggle-publish", data=b'{}', headers={'Content-Type': 'application/json'}, method='POST')
    with opener.open(req_toggle) as res:
        assert res.status == 200
        data = json.loads(res.read().decode('utf-8'))
        assert data["editorial_published"] == 1
        print("   Editorial published successfully to public!")

    print("5. Verifying unauthenticated user can now view editorial...")
    with urllib.request.urlopen(f"{BASE_URL}/api/contests/6/editorial") as res:
        assert res.status == 200
        pub_ed = json.loads(res.read().decode('utf-8'))
        assert len(pub_ed["problems"]) == 20
        print(f"   Public user can view {len(pub_ed['problems'])} editorials while published.")

    print("6. Testing Toggle Publish back (to Unpublished = 0)...")
    with opener.open(req_toggle) as res:
        assert res.status == 200
        data = json.loads(res.read().decode('utf-8'))
        assert data["editorial_published"] == 0
        print("   Editorial toggled back to private.")

    print("7. Verifying unauthenticated user gets 403 Forbidden again...")
    try:
        urllib.request.urlopen(f"{BASE_URL}/api/contests/6/editorial")
        raise AssertionError("Expected 403 Forbidden!")
    except urllib.error.HTTPError as e:
        assert e.code == 403
        print("   Unauthenticated access properly blocked (HTTP 403).")

    print("\nALL RBAC, CRUD, AND EDITORIAL TESTS PASSED WITH 100% SUCCESS!")

if __name__ == '__main__':
    run_tests()
