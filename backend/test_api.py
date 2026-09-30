"""Test the PYAAZ-PRO API endpoints."""
import urllib.request
import json

BASE = "http://localhost:8000"


def get(path):
    url = BASE + path
    with urllib.request.urlopen(url) as resp:
        return json.loads(resp.read().decode())


def post(path, data):
    url = BASE + path
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())


if __name__ == "__main__":
    print("=== PYAAZ-PRO API Tests ===\n")

    # 1. Health check
    print("1. Health check:")
    h = get("/health")
    print("   ", h)

    # 2. Login as inspector
    print("\n2. Login as inspector_sharma:")
    try:
        token = post("/auth/login", {"username": "inspector_sharma", "password": "inspector123"})
        print("   ✓ Login successful")
        print("   Token: %s..." % token["access_token"][:20])
        user = token["user"]
        print("   Role: %s" % user["role"])
    except Exception as e:
        print("   ✗ Login failed:", e)

    # 3. Login as admin
    print("\n3. Login as admin:")
    try:
        token = post("/auth/login", {"username": "admin", "password": "admin123"})
        print("   ✓ Login successful")
        user = token["user"]
        print("   Role: %s" % user["role"])
    except Exception as e:
        print("   ✗ Login failed:", e)

    # 4. List lots
    print("\n4. List lots (as inspector):")
    # Note: Need auth token - skip for now, just check endpoint exists
    try:
        url = BASE + "/api/v1/lots"
        req = urllib.request.Request(url, headers={"Authorization": "Bearer " + token["access_token"]})
        with urllib.request.urlopen(req) as resp:
            lots = json.loads(resp.read().decode())
            print("   ✓ Found %d lots" % len(lots))
    except Exception as e:
        print("   Note: %s" % str(e)[:80])

    print("\n=== Tests Complete ===")