import urllib.request
import json

def test():
    # 1. Fetch contest problems
    url = 'http://localhost:3000/api/contests/6/problems'
    with urllib.request.urlopen(url) as res:
        probs = json.loads(res.read().decode('utf-8'))
        print(f"Contest 6 Problems count: {len(probs)}")
        for p in probs:
            print(f"  {p['letter']}. {p['title']} (Code: {p['code']}, Score: {p['score']})")

    # 2. Check editorial access as unauthenticated user
    # Since editorial_published is 0, unauthenticated should get 403
    url_ed = 'http://localhost:3000/api/contests/6/editorial'
    try:
        with urllib.request.urlopen(url_ed) as res:
            ed_data = json.loads(res.read().decode('utf-8'))
            print("Editorial received publicly (published):", len(ed_data.get('problems', [])))
    except urllib.error.HTTPError as e:
        print(f"Editorial as unauthenticated correctly locked: HTTP {e.code} ({e.reason})")

if __name__ == '__main__':
    test()
