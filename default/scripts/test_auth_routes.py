#!/usr/bin/env python3
"""Smoke test for auth routes: register and login using the real app and user_db.

This script loads .env, imports the FastAPI app, and uses TestClient to POST to
/auth/register and /auth/login. It then cleans up the created user (if Mongo).
"""
from __future__ import annotations

import os
import uuid
import json
from typing import Any

# Load .env into environment if present
if os.path.exists('.env'):
    # shell-style load
    with open('.env', 'r') as fh:
        for line in fh:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if '=' in line:
                k, v = line.split('=', 1)
                v = v.strip().strip('"').strip("'")
                os.environ[k.strip()] = v

from fastapi.testclient import TestClient

from poliverai.app.main import app
from poliverai.db import users as user_module


def cleanup_user(email: str) -> None:
    """Remove test user from the underlying store if possible."""
    try:
        udb = user_module.user_db
        # MongoUserDB exposes a .users Collection
        if hasattr(udb, 'users'):
            # pymongo collection
            udb.users.delete_one({'email': email})
        else:
            # in-memory
            if hasattr(udb, 'email_to_id'):
                uid = udb.email_to_id.get(email)
                if uid:
                    del udb.users[uid]
                    del udb.email_to_id[email]
    except Exception:
        pass


def main() -> None:
    client = TestClient(app)

    test_email = f"test+{uuid.uuid4().hex[:8]}@example.com"
    payload = {
        'name': 'Test User',
        'email': test_email,
        'password': 'testpassword123',
    }

    try:
        # Register
        r = client.post('/auth/register', json=payload)
        print('/auth/register ->', r.status_code, r.text)
        if r.status_code != 200:
            raise SystemExit('Register failed')

        data = r.json()
        assert 'access_token' in data and 'user' in data
        assert data['user']['email'] == test_email

        # Login
        r2 = client.post('/auth/login', json={'email': test_email, 'password': payload['password']})
        print('/auth/login ->', r2.status_code, r2.text)
        if r2.status_code != 200:
            raise SystemExit('Login failed')

        data2 = r2.json()
        assert 'access_token' in data2 and 'user' in data2
        assert data2['user']['email'] == test_email

        print('Auth routes are wired to user_db: OK')

        # Test upgrade endpoint - use the token from login
        token = data2['access_token']
        headers = {'Authorization': f'Bearer {token}'}
        r3 = client.post('/auth/upgrade', headers=headers)
        print('/auth/upgrade ->', r3.status_code, r3.text)
        if r3.status_code != 200:
            raise SystemExit('Upgrade failed')

        upgraded = r3.json()
        # upgraded is the updated user or current_user; check tier
        tier = upgraded.get('tier') if isinstance(upgraded, dict) else None
        print('Upgraded tier:', tier)

    finally:
        cleanup_user(test_email)


if __name__ == '__main__':
    main()
