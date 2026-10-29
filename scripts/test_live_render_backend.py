# -*- coding: utf-8 -*-
"""
Verification script for Live Render Backend (https://vortexjudge.onrender.com)
Tests /health, /api/problems, /api/contests, /api/submissions, /api/users
"""
import urllib.request
import json
import ssl

LIVE_URL = "https://vortexjudge.onrender.com"

# In case local python environment has SSL cert bundle variance
ctx = ssl.create_default_context()

endpoints = [
    ("/health", "Healthcheck"),
    ("/api/health", "API Healthcheck"),
    ("/api/problems", "Problems List"),
    ("/api/contests", "Contests List"),
    ("/api/submissions", "Submissions List"),
    ("/api/users", "Users List"),
]

print(f"=== TESTING LIVE RENDER BACKEND: {LIVE_URL} ===")

all_ok = True
for ep, name in endpoints:
    url = f"{LIVE_URL}{ep}"
    req = urllib.request.Request(url, headers={
        "User-Agent": "VortexJudge-TestClient/1.0",
        "Accept": "application/json"
    })
    try:
        resp = urllib.request.urlopen(req, context=ctx, timeout=15)
        code = resp.getcode()
        body = resp.read().decode('utf-8')
        try:
            data = json.loads(body)
            preview = f"JSON data ({type(data).__name__})"
            if isinstance(data, list):
                preview += f" count={len(data)}"
            elif isinstance(data, dict):
                preview += f" keys={list(data.keys())[:4]}"
        except:
            preview = body[:60]
        print(f" [PASS] {code} {name:20} -> {url} | {preview}")
    except Exception as e:
        all_ok = False
        print(f" [FAIL] {name:20} -> {url} | Error: {e}")

if all_ok:
    print("\nALL LIVE ENDPOINTS ARE RESPONDING PERFECTLY!")
else:
    print("\nSOME ENDPOINTS HAD ISSUES (Might still be deploying or cold starting).")
