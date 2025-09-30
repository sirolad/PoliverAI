"""Authentication and user management models."""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, EmailStr


class UserTier(str, Enum):
    FREE = "free"
    PRO = "pro"


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class User(BaseModel):
    id: str
    name: str
    email: EmailStr
    tier: UserTier = UserTier.FREE
    credits: int = 0
    subscription_expires: datetime | None = None
    created_at: datetime
    is_active: bool = True


class UserInDB(User):
    hashed_password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user: User


class TokenData(BaseModel):
    email: str | None = None
