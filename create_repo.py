import json, urllib.request, sys, os

# Read token from .env
with open("E:\hermes\.env") as f:
    for line in f:
        line = line.strip()
        if line.startswith("GITHUB_TOKEN=") and not line.startswith("#"):
            token = line.split("=", 1)[1].strip()
            break
    else:
        print("FAIL No GITHUB_TOKEN found")
        sys.exit(1)

data = json.dumps({
    "name": "summarizer",
    "description": "EventMath desktop file summarizer",
    "private": False
}).encode()

req = urllib.request.Request(
    "https://api.github.com/user/repos",
    data=data,
    headers={
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
)

try:
    resp = urllib.request.urlopen(req)
    d = json.loads(resp.read())
    print(f"OK {d['html_url']}")
except urllib.error.HTTPError as e:
    err = json.loads(e.read())
    print(f"FAIL {err.get('message', str(e))}")
    sys.exit(1)
