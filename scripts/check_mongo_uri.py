#!/usr/bin/env python3
"""Simple helper to inspect MONGO_URI from .env, mask details, and suggest a URL-encoded password variant.

This script does NOT print the raw password. It only shows masked values and a suggested encoded URI (password part encoded).
"""
import os
import sys
import urllib.parse

from pathlib import Path

ENV_PATH = Path(__file__).resolve().parents[1] / ".env"

if not ENV_PATH.exists():
    print(f"No .env file found at {ENV_PATH}")
    sys.exit(1)

raw = ENV_PATH.read_text(encoding="utf-8", errors="ignore")
lines = [l.strip() for l in raw.splitlines() if l.strip() and not l.strip().startswith("#")]

mongo_line = None
for l in lines:
    if l.startswith("MONGO_URI=") or l.startswith("POLIVERAI_MONGO_URI="):
        mongo_line = l
        break

if not mongo_line:
    # also try plain MONGO_URI without key
    for l in lines:
        if "mongodb://" in l or "mongodb+srv://" in l:
            mongo_line = l
            break

if not mongo_line:
    print("No MONGO_URI found in .env")
    sys.exit(1)

# Extract value
key, _, val = mongo_line.partition("=")
val = val.strip()
# Remove optional surrounding quotes
if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
    val = val[1:-1]

uri = val
print("Found MONGO_URI (masked preview):", (uri[:80] + "...") if len(uri) > 80 else uri)

# Try to parse using urllib
try:
    parsed = urllib.parse.urlparse(uri)
    username = parsed.username
    password = parsed.password
    hostname = parsed.hostname
    port = parsed.port
    path = parsed.path
    query = parsed.query
    print("Basic parse: scheme=", parsed.scheme)
    print("  host=", hostname, "port=", port)
    if username:
        masked_user = username[0] + '***' + (username[-1] if len(username) > 1 else '')
        print("  username=", masked_user)
    else:
        print("  username= <none>")

    # Check if password likely needs encoding
    if password is None:
        print("  password: <none in URL>")
    else:
        encoded = urllib.parse.quote_plus(password)
        if encoded != password:
            print("  password contains characters that should be URL-encoded")
            print("  suggested encoded password (shown masked):", encoded[:6] + "..." + encoded[-6:])
            # Build suggested URI by replacing the password portion
            # Reconstruct netloc
            userinfo = urllib.parse.quote_plus(username) + ":" + encoded
            hostport = (hostname or "") + (":" + str(port) if port else "")
            netloc = userinfo + "@" + hostport
            suggested = urllib.parse.urlunparse((parsed.scheme, netloc, parsed.path or "", parsed.params or "", parsed.query or "", parsed.fragment or ""))
            # Mask the suggested password in the output but show the encoded snippet
            safe_suggested = suggested.replace(encoded, encoded[:6] + "..." + encoded[-6:])
            print("  suggested URI (password encoded, masked):\n    ", safe_suggested)
        else:
            print("  password appears URL-safe (no encoding needed)")

    # Show authSource if present
    qs = urllib.parse.parse_qs(query)
    authsource = qs.get("authSource") or qs.get("authsource")
    if authsource:
        print("  authSource=", authsource)

except Exception as e:
    print("Failed to parse URI with urllib: ", e)

print("\nRecommendation checklist:")
print("- Ensure the password is URL-encoded if it contains special characters (use urllib.parse.quote_plus()).")
print("- If using Atlas, ensure your IP / Cloud Run service account is allowed in Network Access (or use 0.0.0.0/0 for testing).")
print("- Verify the username/password in Atlas, and confirm the authSource/database if different from the DB in the URI.")
print("- Do not commit production credentials into .env checked into version control. Use Secret Manager in GCP.")
