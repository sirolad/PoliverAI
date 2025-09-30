"""In-memory user database for development purposes."""

import uuid
from datetime import datetime

from ..core.auth import get_password_hash, verify_password
from ..domain.auth import User, UserInDB, UserTier


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
            return None
        if not verify_password(password, user.hashed_password):
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
            return True
        return False


# Global user database instance
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
