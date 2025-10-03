"""In-memory user database for development purposes."""

import uuid
from datetime import datetime

from ..core.auth import get_password_hash, verify_password
from ..domain.auth import User, UserInDB, UserTier
import logging
try:
    from .transactions import transactions
except Exception:
    transactions = None

logger = logging.getLogger(__name__)


class UserDatabase:
    """Simple in-memory user database for development."""

    def __init__(self):
        self.users: dict[str, UserInDB] = {}
        self.email_to_id: dict[str, str] = {}

    def create_user(self, name: str, email: str, password: str) -> User:
        """Create a new user."""
        if email in self.email_to_id:
            raise ValueError("Email already registered")

        user_id = str(uuid.uuid4())
        hashed_password = get_password_hash(password)

        user_in_db = UserInDB(
            id=user_id,
            name=name,
            email=email,
            tier=UserTier.FREE,
            credits=0,
            created_at=datetime.utcnow(),
            is_active=True,
            hashed_password=hashed_password,
        )

        self.users[user_id] = user_in_db
        self.email_to_id[email] = user_id

        # Return user without password hash
        return User(
            id=user_id,
            name=name,
            email=email,
            tier=UserTier.FREE,
            credits=0,
            created_at=user_in_db.created_at,
            is_active=True,
        )

    def get_user_by_email(self, email: str) -> UserInDB | None:
        """Get user by email."""
        user_id = self.email_to_id.get(email)
        if user_id:
            return self.users.get(user_id)
        return None

    def get_user_by_id(self, user_id: str) -> UserInDB | None:
        """Get user by ID."""
        return self.users.get(user_id)

    def authenticate_user(self, email: str, password: str) -> User | None:
        """Authenticate a user."""
        user = self.get_user_by_email(email)
        if not user:
            logger.info("No user found for email=%s (in-memory)", email)
            return None
        # Log a masked prefix of the stored hash for debugging purposes (no plaintext)
        try:
            hp = (user.hashed_password or '')[:8]
        except Exception:
            hp = 'unknown'
        logger.info("Found user=%s hashed_prefix=%s", email, hp)
        # Try normal Argon2 verification first
        try:
            if verify_password(password, user.hashed_password):
                logger.info("Argon2 verification passed for email=%s", email)
                pass
            else:
                logger.info("Argon2 verification failed for email=%s; trying plaintext fallback", email)
                raise ValueError("verify_failed")
        except Exception:
            # Legacy fallback: some users may have been imported/edited with a
            # plaintext password by mistake. If the stored value equals the
            # provided password, re-hash it and accept the login (best-effort).
            try:
                if user.hashed_password == password:
                    logger.info("Plaintext password matched for email=%s; re-hashing and accepting login", email)
                    # Re-hash and store the correct hash
                    user.hashed_password = get_password_hash(password)
                else:
                    logger.info("Plaintext fallback did not match for email=%s", email)
                    return None
            except Exception as e:
                logger.error("Error during plaintext fallback for email=%s: %s", email, e)
                return None

        # Return user without password hash
        return User(
            id=user.id,
            name=user.name,
            email=user.email,
            tier=user.tier,
            credits=user.credits,
            subscription_expires=user.subscription_expires,
            created_at=user.created_at,
            is_active=user.is_active,
        )

    def update_user_tier(self, user_id: str, tier: UserTier) -> bool:
        """Update user tier."""
        if user_id in self.users:
            self.users[user_id].tier = tier
            # Record a transaction for tier change (best-effort)
            try:
                if transactions is not None:
                    tx = {
                        'user_email': self.users[user_id].email,
                        'event_type': 'tier_update',
                        'amount_usd': 0.0,
                        'credits': 0,
                        'description': f'Tier changed to {tier}',
                    }
                    transactions.add(tx)
            except Exception:
                # Non-fatal
                pass
            return True
        return False

    def update_user_credits(self, user_id: str, delta: int) -> bool:
        """Increment (or decrement) credits for a user."""
        if user_id in self.users:
            self.users[user_id].credits = int(self.users[user_id].credits or 0) + int(delta)
            # Record a transaction for credit change (best-effort)
            try:
                if transactions is not None:
                    tx = {
                        'user_email': self.users[user_id].email,
                        'event_type': 'credit_change',
                        'amount_usd': None,
                        'credits': int(delta),
                        'description': f'Credits adjusted by {delta}',
                    }
                    transactions.add(tx)
            except Exception:
                pass
            return True
        return False


import os

# If a MONGO_URI environment variable is provided, use Mongo backend
MONGO_URI = os.getenv("MONGO_URI")

if MONGO_URI:
    try:
        from .mongo import MongoUserDB
        user_db = MongoUserDB(MONGO_URI)
        # If using Mongo backend in development, ensure demo users are present
        try:
            # Only attempt to seed if users are missing
            if not user_db.get_user_by_email('john@example.com'):
                user_db.create_user('John Doe', 'john@example.com', 'password123')
            if not user_db.get_user_by_email('jane@example.com'):
                user_db.create_user('Jane Pro', 'jane@example.com', 'password123')
                jane = user_db.get_user_by_email('jane@example.com')
                if jane:
                    user_db.update_user_tier(jane.id, UserTier.PRO)
        except Exception:
            # Non-fatal: if seeding fails, continue without blocking startup
            pass
    except Exception:
        # Fall back to in-memory if Mongo fails to initialize
        user_db = UserDatabase()
else:
    # Global user database instance (in-memory for development)
    user_db = UserDatabase()

    # Add some demo users for development
    try:
        user_db.create_user("John Doe", "john@example.com", "password123")
        user_db.create_user("Jane Pro", "jane@example.com", "password123")
        # Make Jane a pro user
        jane = user_db.get_user_by_email("jane@example.com")
        if jane:
            user_db.update_user_tier(jane.id, UserTier.PRO)
    except ValueError:
        # Users already exist
        pass
