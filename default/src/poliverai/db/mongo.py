"""MongoDB helper for user storage."""
from __future__ import annotations

from datetime import datetime
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
        self.client = MongoClient(uri)
        try:
            # Force a connection/check to surface problems early during startup
            self.client.server_info()

            # Try to parse the URI to surface useful, non-sensitive details
            try:
                from pymongo.uri_parser import parse_uri

                parsed = parse_uri(uri)
                username = parsed.get("username")
                nodelist = parsed.get("nodelist")
                options = parsed.get("options")
                authsource = parsed.get("authsource") or options.get("authsource") if options else None
            except Exception:
                # Fallback to urllib parsing for basic fields
                u = urllib.parse.urlparse(uri)
                username = u.username
                # mongodb+srv may contain SRV records; represent host roughly
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
                "MongoDB connected: user=%s hosts=%s authSource=%s uri_prefix=%s",
                masked_user,
                nodelist,
                authsource,
                (uri[:60] + "...") if uri else None,
            )
        except Exception as e:  # keep broad except so initialization doesn't crash without logging
            # Log detailed diagnostics (without secrets)
            logger.error("MongoDB connection failed: %s (%s)", e, type(e).__name__)
            logger.debug("Traceback:\n%s", traceback.format_exc())
            # Try to provide parsed URI hints for debugging
            try:
                from pymongo.uri_parser import parse_uri

                parsed = parse_uri(uri)
                logger.debug(
                    "Parsed URI (masked): username=%s, nodelist=%s, options=%s",
                    (parsed.get("username")[:1] + "***" + parsed.get("username")[-1]) if parsed.get("username") else None,
                    parsed.get("nodelist"),
                    {k: v for k, v in (parsed.get("options") or {}).items() if k.lower() != "password"},
                )
            except Exception as ee:
                logger.debug("Failed to parse URI for extra details: %s", ee)
            raise

        self.db = self.client[db_name]
        self.users: Collection = self.db.get_collection("users")

    def create_user(self, name: str, email: str, password: str) -> UserInDB:
        if self.users.find_one({"email": email}):
            raise ValueError("Email already registered")

        user = {
            "name": name,
            "email": email,
            "tier": UserTier.FREE.value if isinstance(UserTier.FREE, UserTier) else "free",
            "credits": 0,
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
            return None
        return UserInDB(
            id=str(doc.get("_id")),
            name=doc.get("name"),
            email=doc.get("email"),
            tier=UserTier(doc.get("tier", "free")),
            credits=doc.get("credits", 0),
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
            subscription_expires=doc.get("subscription_expires"),
            created_at=doc.get("created_at"),
            is_active=doc.get("is_active", True),
            hashed_password=doc.get("hashed_password"),
        )

    def authenticate_user(self, email: str, password: str):
        user = self.get_user_by_email(email)
        if not user:
            return None

        from ..core.auth import verify_password

        if not verify_password(password, user.hashed_password):
            return None

        # return public User (without hashed_password) by using UserInDB fields mapped elsewhere
        return user

    def update_user_tier(self, user_id: str, tier: UserTier) -> bool:
        from bson import ObjectId

        result = self.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"tier": tier}})
        return result.modified_count > 0
