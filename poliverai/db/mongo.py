"""MongoDB helper for user storage."""
from __future__ import annotations

from datetime import datetime
import os
import ssl
import socket
from typing import Optional

import logging
import traceback
import urllib.parse

from pymongo import MongoClient
from pymongo.collection import Collection

from ..domain.auth import UserInDB, UserTier
from ..core.auth import get_password_hash

logger = logging.getLogger(__name__)


class MongoUserDB:
    def __init__(self, uri: str, db_name: str = "poliverai") -> None:
        # Initialize client and perform a quick server_info() call to validate connection.
        # This will raise an exception if the URI is invalid or the network/connectivity fails,
        # which will cause the application to fall back to the in-memory DB in `db/users.py`.
        # Emit some diagnostics helpful when debugging TLS issues to Atlas.
        # These do not change behavior unless MONGO_DEBUG_CONN=1 is set, but
        # we always attempt to report basic runtime SSL info and whether
        # certifi is present so operators can spot missing CA bundles.
        try:
            logger.info("python OpenSSL version: %s", ssl.OPENSSL_VERSION)
        except Exception:
            logger.debug("Failed to read OpenSSL version")


        # Create a MongoClient using the provided URI. We rely on the URI
        # (which should include username/password) for authentication. Do
        # not attempt to perform cert-based auth or manually inject CA
        # bundles here; Atlas connections should work using the default
        # system trust store when possible. Use short connection timeouts so
        # failures surface quickly instead of hanging application startup.

        # Debug-only network checks: when MONGO_DEBUG_CONN=1, attempt to
        # resolve and create a small TCP connection to each host in the URI
        # so we can detect DNS/firewall issues prior to the MongoClient TLS
        # handshake. This is best-effort and will not raise on failure.
        debug_conn = os.getenv("MONGO_DEBUG_CONN") == "1"
        if debug_conn:
            try:
                from pymongo.uri_parser import parse_uri

                parsed = parse_uri(uri)
                nodelist = parsed.get("nodelist") or []
            except Exception:
                u = urllib.parse.urlparse(uri)
                nodelist = [(u.hostname or "") + (f":{u.port}" if u.port else "")]

            for host_port in nodelist:
                try:
                    host, port = (host_port[0], host_port[1]) if isinstance(host_port, tuple) else (host_port.split(":")[0], int(host_port.split(":")[1]) if ":" in host_port else 27017)
                except Exception:
                    try:
                        hp = str(host_port)
                        parts = hp.split(":")
                        host = parts[0]
                        port = int(parts[1]) if len(parts) > 1 else 27017
                    except Exception:
                        host = str(host_port)
                        port = 27017
                try:
                    s = socket.create_connection((host, port), timeout=5)
                    s.close()
                    logger.info("Connection test OK to %s:%s", host, port)
                except Exception as e:
                    logger.warning("Connection test FAILED to %s:%s: %s", host, port, e)

        try:
            # Build a client with short timeouts so failures are fast and do
            # not cause long blocking during import/startup. We do not set
            # explicit TLS/CA options here; the MONGO_URI should carry the
            # auth details (username/password) and the environment should
            # provide a valid trust store.
            self.client = MongoClient(uri, serverSelectionTimeoutMS=2000, connectTimeoutMS=2000)
        except Exception:
            # If client construction itself fails, re-raise after logging.
            logger.exception("Failed to construct MongoClient (pre-server_info)")
            raise
        # Do not force a blocking server_info() call at import time. Some
        # environments (local dev or restricted network) may trigger TLS
        # handshake errors that would otherwise crash startup. Instead, try
        # to parse and log non-sensitive URI details for diagnostics and
        # continue — runtime DB operations will surface connectivity issues.
        try:
            from pymongo.uri_parser import parse_uri

            parsed = parse_uri(uri)
            username = parsed.get("username")
            nodelist = parsed.get("nodelist")
            options = parsed.get("options")
            authsource = parsed.get("authsource") or options.get("authsource") if options else None
        except Exception:
            u = urllib.parse.urlparse(uri)
            username = u.username
            nodelist = [(u.hostname or "") + (f":{u.port}" if u.port else "")]
            qs = urllib.parse.parse_qs(u.query or "")
            authsource = qs.get("authSource", [None])[0]

        masked_user = None
        if username:
            try:
                masked_user = username[0] + "***" + username[-1]
            except Exception:
                masked_user = "***"

        logger.info(
            "MongoDB client created: user=%s hosts=%s authSource=%s uri_prefix=%s",
            masked_user,
            nodelist,
            authsource,
            (uri[:60] + "...") if uri else None,
        )

        self.db = self.client[db_name]
        self.users: Collection = self.db.get_collection("users")
        # Ensure a transactions collection exists for recording payment events
        try:
            self.transactions: Collection = self.db.get_collection("transactions")
        except Exception:
            self.transactions = None

        # A lightweight metadata collection we can use to mark that the app
        # has completed initial seeding/initialization so we don't repeatedly
        # attempt to insert demo users on every import/startup.
        try:
            self._metadata: Collection = self.db.get_collection("metadata")
        except Exception:
            self._metadata = None

    def create_user(self, name: str, email: str, password: str) -> UserInDB:
        if self.users.find_one({"email": email}):
            raise ValueError("Email already registered")

        user = {
            "name": name,
            "email": email,
            "tier": UserTier.FREE.value if isinstance(UserTier.FREE, UserTier) else "free",
            "credits": 0,
            "subscription_credits": 0,
            "subscription_expires": None,
            "created_at": datetime.utcnow(),
            "is_active": True,
            "hashed_password": get_password_hash(password),
        }

        result = self.users.insert_one(user)
        user_doc = self.users.find_one({"_id": result.inserted_id})

        return UserInDB(
            id=str(user_doc["_id"]),
            name=user_doc["name"],
            email=user_doc["email"],
            tier=UserTier(user_doc.get("tier", "free")),
            credits=user_doc.get("credits", 0),
            subscription_expires=user_doc.get("subscription_expires"),
            created_at=user_doc.get("created_at"),
            is_active=user_doc.get("is_active", True),
            hashed_password=user_doc.get("hashed_password"),
        )

    def get_user_by_email(self, email: str) -> Optional[UserInDB]:
        doc = self.users.find_one({"email": email})
        if not doc:
            logger.info("No user found in Mongo for email=%s", email)
            return None
        # Masked hash prefix for debugging
        try:
            hp = (doc.get('hashed_password') or '')[:8]
        except Exception:
            hp = 'unknown'
        logger.info("Found user in Mongo email=%s hashed_prefix=%s", email, hp)
        return UserInDB(
            id=str(doc.get("_id")),
            name=doc.get("name"),
            email=doc.get("email"),
            tier=UserTier(doc.get("tier", "free")),
            credits=doc.get("credits", 0),
            subscription_credits=doc.get("subscription_credits", 0),
            subscription_expires=doc.get("subscription_expires"),
            created_at=doc.get("created_at"),
            is_active=doc.get("is_active", True),
            hashed_password=doc.get("hashed_password"),
        )

    def get_user_by_id(self, user_id: str) -> Optional[UserInDB]:
        from bson import ObjectId

        doc = self.users.find_one({"_id": ObjectId(user_id)})
        if not doc:
            return None
        return UserInDB(
            id=str(doc.get("_id")),
            name=doc.get("name"),
            email=doc.get("email"),
            tier=UserTier(doc.get("tier", "free")),
            credits=doc.get("credits", 0),
            subscription_credits=doc.get("subscription_credits", 0),
            subscription_expires=doc.get("subscription_expires"),
            created_at=doc.get("created_at"),
            is_active=doc.get("is_active", True),
            hashed_password=doc.get("hashed_password"),
        )

    def authenticate_user(self, email: str, password: str):
        user = self.get_user_by_email(email)
        if not user:
            return None
        from ..core.auth import verify_password, get_password_hash
        try:
            if verify_password(password, user.hashed_password):
                logger.info("Argon2 verification passed for email=%s", email)
                pass
            else:
                logger.info("Argon2 verification failed for email=%s; trying plaintext fallback", email)
                raise ValueError("verify_failed")
        except Exception:
            try:
                if user.hashed_password == password:
                    logger.info("Plaintext password matched for email=%s; re-hashing and storing in Mongo", email)
                    # update the stored hash
                    self.users.update_one({"_id": user.id}, {"$set": {"hashed_password": get_password_hash(password)}})
                else:
                    logger.info("Plaintext fallback did not match for email=%s", email)
                    return None
            except Exception as e:
                logger.error("Error updating Mongo password hash for email=%s: %s", email, e)
                return None

        # return public User (without hashed_password) by using UserInDB fields mapped elsewhere
        return user

    def update_user_tier(self, user_id: str, tier: UserTier) -> bool:
        from bson import ObjectId

        # Store the tier as its string value
        result = self.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"tier": tier.value}})
        success = result.modified_count > 0
        # Record transaction for tier update (best-effort)
        try:
            if success and self.transactions is not None:
                tx = {
                    'user_email': self.get_user_by_id(user_id).email if self.get_user_by_id(user_id) else None,
                    'event_type': 'tier_update',
                    'amount_usd': 0.0,
                    'credits': 0,
                    'description': f'Tier changed to {tier.value}',
                    'timestamp': datetime.utcnow(),
                }
                self.transactions.insert_one(tx)
        except Exception:
            pass
        return success

    def update_user_credits(self, user_id: str, delta: int) -> bool:
        """Atomically increment user's credits by delta (can be negative)."""
        from bson import ObjectId
        try:
            # Read current credits for logging
            user = self.get_user_by_id(user_id)
            prev = user.credits if user else None
        except Exception:
            prev = None

        result = self.users.update_one({"_id": ObjectId(user_id)}, {"$inc": {"credits": int(delta)}})
        success = result.modified_count > 0
        if success:
            try:
                user_after = self.get_user_by_id(user_id)
                logger.info('Mongo credits updated for user_id=%s email=%s: %s -> %s', user_id, user_after.email if user_after else None, prev, user_after.credits if user_after else None)
            except Exception:
                logger.exception('Failed to log updated credits for user_id=%s', user_id)
        # Record a transaction for credit change
        try:
            if success and self.transactions is not None:
                user = self.get_user_by_id(user_id)
                tx = {
                    'user_email': user.email if user else None,
                    'event_type': 'credit_change',
                    'amount_usd': None,
                    'credits': int(delta),
                    'description': f'Credits adjusted by {delta}',
                    'timestamp': datetime.utcnow(),
                }
                self.transactions.insert_one(tx)
        except Exception:
            pass
        return success

    def update_user_subscription_credits(self, user_id: str, delta: int) -> bool:
        """Increment (or decrement) the subscription_credits field (used to track credits provided by active subscriptions)."""
        from bson import ObjectId
        try:
            result = self.users.update_one({"_id": ObjectId(user_id)}, {"$inc": {"subscription_credits": int(delta)}})
            success = result.modified_count > 0
            if success and self.transactions is not None:
                user = self.get_user_by_id(user_id)
                tx = {
                    'user_email': user.email if user else None,
                    'event_type': 'subscription_credit_change',
                    'amount_usd': None,
                    'credits': int(delta),
                    'description': f'Subscription credits adjusted by {delta}',
                    'timestamp': datetime.utcnow(),
                }
                self.transactions.insert_one(tx)
            return success
        except Exception:
            logger.exception('Failed to update subscription_credits for user_id=%s', user_id)
            return False

    def update_user_subscription(self, user_id: str, expires_at) -> bool:
        """Set user's subscription_expires timestamp in Mongo."""
        from bson import ObjectId
        try:
            result = self.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"subscription_expires": expires_at}})
            success = result.modified_count > 0
            if success and self.transactions is not None:
                tx = {
                    'user_email': self.get_user_by_id(user_id).email if self.get_user_by_id(user_id) else None,
                    'event_type': 'subscription_update',
                    'amount_usd': 0.0,
                    'credits': 0,
                    'description': f'Subscription expires at {expires_at}',
                    'timestamp': datetime.utcnow(),
                }
                self.transactions.insert_one(tx)
            return success
        except Exception:
            logger.exception('Failed to set subscription_expires for user_id=%s', user_id)
            return False

    # --- helper methods for idempotent startup seeding ---
    def has_seed_marker(self) -> bool:
        """Return True if a one-time seed marker exists in the metadata collection."""
        if not self._metadata:
            return False
        try:
            return self._metadata.find_one({"key": "app_initialized"}) is not None
        except Exception:
            return False

    def set_seed_marker(self) -> None:
        """Create a seed marker documenting that initial seeding ran."""
        if not self._metadata:
            return
        try:
            self._metadata.insert_one({"key": "app_initialized", "timestamp": datetime.utcnow()})
        except Exception:
            # Non-fatal if metadata collection cannot be written
            pass

    def get_user_count(self) -> int:
        """Return the number of user documents present (0 if unknown)."""
        try:
            return int(self.users.count_documents({}))
        except Exception:
            return 0
