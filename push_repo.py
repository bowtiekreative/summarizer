#!/usr/bin/env python3
"""Push to GitHub using HTTPS with token."""
import subprocess, os, sys, pathlib

# Read token
with open("E:\\hermes\\.env") as f:
    for line in f:
        l = line.strip()
        if l.startswith("GITHUB_TOKEN") and not l.startswith("#"):
            token = l.split("=", 1)[1].strip()
            break

repo_dir = "E:\\summarizer"
remote_url = f"https://bowtiekreative:{token}@github.com/bowtiekreative/summarizer.git"

# Set remote
subprocess.run(["git", "remote", "set-url", "origin", remote_url],
               cwd=repo_dir, capture_output=True)

# Push
result = subprocess.run(["git", "push", "-u", "origin", "main"],
                        cwd=repo_dir, capture_output=True, text=True)
print(result.stdout[-200:] if result.stdout else "")
print(result.stderr[-200:] if result.stderr else "")
sys.exit(result.returncode)