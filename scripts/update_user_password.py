#!/usr/bin/env python3
"""
Update a user's hashed password in the MongoDB `users` collection.

Usage examples:

# Use MONGO_URI from environment
python scripts/update_user_password.py --email dagasonhackason@gmail.com --password 'GBEc~!5;eWerXm#@20'

# Provide a Mongo URI explicitly
python scripts/update_user_password.py --mongo-uri 'mongodb://mongo:27017/poliverai' --email user@example.com --password 'hunter2'

Options:
  --email       Email address of the user to update (required)
  --password    Plaintext new password (required unless --stdin-password)
  --stdin-password  Read password from stdin (useful for not leaking on shell history)
  --mongo-uri   Mongo connection string. Falls back to MONGO_URI env var.
  --dry-run     Compute hash and show what would be updated without writing to DB.

The script uses Argon2 (argon2-cffi) to hash the password in the same style as the application.
"""

import argparse
import os
import sys
from urllib.parse import urlparse
import time

from pymongo import MongoClient
from argon2 import PasswordHasher


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Update a user's hashed password in MongoDB")
    p.add_argument("--email", required=True, help="User email to locate in the users collection")
    group = p.add_mutually_exclusive_group(required=True)
    group.add_argument("--password", help="New plaintext password")
    group.add_argument("--stdin-password", action="store_true", help="Read plaintext password from STDIN")
    p.add_argument("--mongo-uri", help="MongoDB connection URI. Falls back to MONGO_URI env var.")
    p.add_argument("--db", help="Database name to use (overrides database parsed from URI). Falls back to MONGO_DB env or 'poliverai'.")
    p.add_argument("--insecure-tls", action="store_true", help="(dev only) Allow invalid TLS certificates/hostnames when connecting to MongoDB")
    p.add_argument("--retries", type=int, default=int(os.environ.get("UPDATE_USER_RETRIES", 5)), help="Number of connection retries for MongoDB before failing")
    p.add_argument("--retry-delay", type=float, default=float(os.environ.get("UPDATE_USER_RETRY_DELAY", 5.0)), help="Seconds to wait between retries")
    p.add_argument("--wait-until-connected", action="store_true", help="Keep trying until a connection is established or --wait-timeout seconds elapse")
    p.add_argument("--wait-timeout", type=float, default=float(os.environ.get("UPDATE_USER_WAIT_TIMEOUT", 300.0)), help="Total seconds to wait when --wait-until-connected is set")
    # Atlas Data API flags
    p.add_argument("--data-api-url", help="Atlas Data API URL (e.g. https://data.mongodb-api.com/app/<app-id>/endpoint/data/v1/action/updateOne)")
    p.add_argument("--data-api-key", help="Atlas Data API key")
    p.add_argument("--data-source", help="Atlas cluster name (data source). Defaults to 'Cluster0'", default=os.environ.get("ATLAS_DATA_SOURCE", "Cluster0"))
    p.add_argument("--data-db", help="Database name for Data API. Defaults to 'poliverai'", default=os.environ.get("ATLAS_DATA_DB", "poliverai"))
    p.add_argument("--data-collection", help="Collection name for Data API. Defaults to 'users'", default=os.environ.get("ATLAS_DATA_COLLECTION", "users"))
    p.add_argument("--dry-run", action="store_true", help="Do not write to DB; just print the computed hash and planned update")
    return p.parse_args()


def get_db_from_uri(client: MongoClient, uri: str):
    # Try to determine default database name from the URI path (/dbname)
    try:
        parsed = urlparse(uri)
        # mongodb://host:port/dbname
        path = parsed.path.lstrip("/") if parsed.path else ""
        if path:
            return client[path]
    except Exception:
        pass
    # Fallback: use client's _default_database if set
    try:
        default = client.get_default_database()
        if default is not None:
            return default
    except Exception:
        pass
    raise RuntimeError("Could not determine database name from URI; please include it in the URI or ensure default DB is set")


def main() -> int:
    args = parse_args()

    password = None
    if args.stdin_password:
        print("Enter password followed by newline:", file=sys.stderr)
        password = sys.stdin.readline().rstrip('\n')
    else:
        password = args.password

    if password is None:
        print("No password provided", file=sys.stderr)
        return 2

    mongo_uri = args.mongo_uri or os.environ.get("MONGO_URI")
    if not mongo_uri:
        print("ERROR: Mongo URI not provided via --mongo-uri and MONGO_URI env not set", file=sys.stderr)
        return 3

    # Optionally seed the password with SECRET_KEY from the environment
    secret = os.environ.get("SECRET_KEY")
    if secret:
        print("SECRET_KEY found in env — seeding password with SECRET_KEY before hashing", file=sys.stderr)
        to_hash = secret + password
    else:
        to_hash = password

    # Hash the password using Argon2 (same algorithm as application)
    ph = PasswordHasher()
    try:
        hashed = ph.hash(to_hash)
    except Exception as e:
        print(f"Failed to hash password: {e}", file=sys.stderr)
        return 4

    print(f"Computed Argon2 hash: {hashed}")

    if secret:
        print("WARNING: You seeded the password with SECRET_KEY when hashing. Ensure the running application also combines SECRET_KEY with the provided plaintext before verifying, otherwise logins will fail.", file=sys.stderr)

    if args.dry_run:
        print("Dry run requested; not updating DB.")
        return 0

    # If Atlas Data API args provided, use Data API to perform the update over HTTPS
    if args.data_api_url and args.data_api_key:
        print("Using Atlas Data API to update the user document (HTTPS)", file=sys.stderr)
        try:
            import json
            from urllib.request import Request, urlopen
            from urllib.error import URLError, HTTPError

            payload = {
                "dataSource": args.data_source,
                "database": args.data_db,
                "collection": args.data_collection,
                "filter": {"email": args.email},
                "update": {"$set": {"hashed_password": hashed}},
                "upsert": False,
            }

            req = Request(args.data_api_url, data=json.dumps(payload).encode("utf-8"), method="POST")
            req.add_header("Content-Type", "application/json")
            req.add_header("api-key", args.data_api_key)

            with urlopen(req, timeout=30) as resp:
                body = resp.read().decode("utf-8")
                print("Data API response:", body)
                print("Update via Data API completed.")
                return 0
        except HTTPError as he:
            print(f"Data API HTTP error: {he.code} {he.reason}", file=sys.stderr)
            try:
                print(he.read().decode(), file=sys.stderr)
            except Exception:
                pass
            return 8
        except URLError as ue:
            print(f"Data API network error: {ue}", file=sys.stderr)
            return 9
        except Exception as e:
            print(f"Data API unexpected error: {e}", file=sys.stderr)
            return 10

    # Connect to Mongo and update the user document
    # Connect to Mongo with a few strategies for better diagnostics and to work around
    # environments that may require a custom CA bundle.
    client = None
    last_exc = None

    def finalize_client(c):
        # determine db as before
        target_db_name = args.db or os.environ.get("MONGO_DB")
        if target_db_name:
            return c[target_db_name]
        try:
            return get_db_from_uri(c, mongo_uri)
        except RuntimeError:
            return c[os.environ.get("MONGO_DB", "poliverai")]

    # Strategy 1: default connection, with retries
    for attempt in range(1, args.retries + 1):
        try:
            print(f"Attempt {attempt}/{args.retries}: trying default MongoClient connection...", file=sys.stderr)
            c = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
            c.admin.command("ping")
            client = c
            print("Connected to MongoDB using default client", file=sys.stderr)
            break
        except Exception as e:
            last_exc = e
            print(f"Default MongoClient attempt {attempt} failed: {e}", file=sys.stderr)
            if attempt < args.retries:
                time.sleep(args.retry_delay)

    # Strategy 2: try with certifi CA bundle if available
    if client is None:
        try:
            import certifi

            ca = certifi.where()
            for attempt in range(1, args.retries + 1):
                try:
                    print(f"Attempt {attempt}/{args.retries}: Trying MongoClient with certifi CA bundle: {ca}", file=sys.stderr)
                    c = MongoClient(mongo_uri, tls=True, tlsCAFile=ca, serverSelectionTimeoutMS=5000)
                    c.admin.command("ping")
                    client = c
                    print("Connected to MongoDB using certifi CA bundle", file=sys.stderr)
                    break
                except Exception as e:
                    last_exc = e
                    print(f"Certifi attempt {attempt} failed: {e}", file=sys.stderr)
                    if attempt < args.retries:
                        time.sleep(args.retry_delay)
        except Exception as e:
            last_exc = e
            print(f"Connection with certifi setup failed: {e}", file=sys.stderr)

    # Strategy 3: insecure TLS (dev-only) if requested
    if client is None and args.insecure_tls:
        for attempt in range(1, args.retries + 1):
            try:
                print(f"Attempt {attempt}/{args.retries}: Attempting insecure TLS connection (tlsAllowInvalidCertificates=True) — dev only", file=sys.stderr)
                c = MongoClient(
                    mongo_uri,
                    tls=True,
                    tlsAllowInvalidCertificates=True,
                    tlsAllowInvalidHostnames=True,
                    serverSelectionTimeoutMS=5000,
                )
                c.admin.command("ping")
                client = c
                print("Connected to MongoDB with insecure TLS (dev only)", file=sys.stderr)
                break
            except Exception as e:
                last_exc = e
                print(f"Insecure TLS attempt {attempt} failed: {e}", file=sys.stderr)
                if attempt < args.retries:
                    time.sleep(args.retry_delay)

    if client is None:
        print(f"Failed to connect to MongoDB at {mongo_uri}: {last_exc}", file=sys.stderr)
        print("Hints: ensure network allows outbound TLS to Atlas, install/update 'certifi' in the environment, or use --insecure-tls for a dev bypass.", file=sys.stderr)
        return 5

    try:
        db = finalize_client(client)
        users = db.get_collection("users")
    except Exception as e:
        print(f"Failed to select database/collection: {e}", file=sys.stderr)
        return 5

    try:
        res = users.update_one({"email": args.email}, {"$set": {"hashed_password": hashed}})
        if res.matched_count == 0:
            print(f"No user found with email {args.email}")
            return 6
        print(f"Updated user {args.email}: matched={res.matched_count}, modified={res.modified_count}")
        return 0
    except Exception as e:
        print(f"Failed to update user document: {e}", file=sys.stderr)
        return 7


if __name__ == "__main__":
    raise SystemExit(main())
