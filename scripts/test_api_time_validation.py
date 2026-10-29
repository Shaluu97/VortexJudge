# -*- coding: utf-8 -*-
import urllib.request, urllib.parse, json, http.cookiejar

cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))

# 1. Login as admin
login_data = json.dumps({'username': 'admin', 'password': 'admin2026'}).encode('utf-8')
req = urllib.request.Request('http://localhost:3000/api/auth/login', data=login_data, headers={'Content-Type': 'application/json'})
resp = opener.open(req)
assert resp.getcode() == 200, 'Login failed'
print('[PASS] Admin logged in')

# 2. Test invalid contest creation (end_time <= start_time)
invalid_payload = {
    'title': 'Test Invalid Time Contest',
    'start_time': '2026-11-03T13:00',
    'end_time': '2026-11-03T09:00',
    'duration': '04:00'
}
req = urllib.request.Request('http://localhost:3000/api/contests', data=json.dumps(invalid_payload).encode('utf-8'), headers={'Content-Type': 'application/json'})
try:
    opener.open(req)
    assert False, 'Should have failed with 400'
except urllib.error.HTTPError as e:
    assert e.code == 400
    err_body = json.loads(e.read().decode('utf-8'))
    assert 'Tugash vaqti boshlanish vaqtidan keyin' in err_body['error']
    print('[PASS] Successfully rejected end_time <= start_time with 400:', err_body['error'])

# 3. Test valid contest creation (start 09:00, end 13:00, duration 04:00)
valid_payload = {
    'title': 'Test Valid Time Contest 12345',
    'start_time': '2026-11-03T09:00',
    'end_time': '2026-11-03T13:00',
    'duration': '04:00',
    'type': 'PUBLIC'
}
req = urllib.request.Request('http://localhost:3000/api/contests', data=json.dumps(valid_payload).encode('utf-8'), headers={'Content-Type': 'application/json'})
resp = opener.open(req)
assert resp.getcode() == 200
data = json.loads(resp.read().decode('utf-8'))
cid = data['id']
print(f'[PASS] Contest created successfully with ID={cid}')

# 4. Fetch contest and verify start_time, end_time, duration
req = urllib.request.Request(f'http://localhost:3000/api/contests/{cid}')
resp = opener.open(req)
c_data = json.loads(resp.read().decode('utf-8'))['contest']
assert c_data['start_time'] == '2026-11-03T09:00'
assert c_data['end_time'] == '2026-11-03T13:00'
assert c_data['duration'] == '04:00'
print(f"[PASS] Verified fetched contest data: start={c_data['start_time']}, end={c_data['end_time']}, duration={c_data['duration']}")

# 5. Clean up test contest
req = urllib.request.Request(f'http://localhost:3000/api/admin/contests/{cid}', headers={'Content-Type': 'application/json'})
req.get_method = lambda: 'DELETE'
resp = opener.open(req)
assert resp.getcode() == 200
print('[PASS] Cleaned up test contest')
print('=== ALL API CONTEST TIME SYNC TESTS PASSED! ===')
