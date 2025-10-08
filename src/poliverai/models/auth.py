"""Authentication and user management Pydantic models.

This module contains all Pydantic models related to user authentication,
user management, and access control.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel

# Using str for email to avoid email-validator dependency in development
# In production, this should be EmailStr from pydantic


class UserTier(str, Enum):
    """User subscription tiers."""

    FREE = "free"
    PRO = "pro"


class UserCreate(BaseModel):
    """Model for user creation requests."""

    name: str
    email: str  # EmailStr in production
    password: str


class UserLogin(BaseModel):
    """Model for user login requests."""

    email: str  # EmailStr in production
    password: str


class User(BaseModel):
    """Model for user data (without sensitive information)."""

    id: str
    name: str
    email: str  # EmailStr in production
    tier: UserTier = UserTier.FREE
    credits: int = 0
    subscription_expires: datetime | None = None
    created_at: datetime
    is_active: bool = True


class UserInDB(User):
    """Model for user data stored in database (includes sensitive information)."""

    hashed_password: str


class Token(BaseModel):
    """Model for authentication tokens."""

    access_token: str
    token_type: str
    user: User


class TokenData(BaseModel):
    """Model for token payload data."""

    email: str | None = None
