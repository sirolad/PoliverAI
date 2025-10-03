"""Authentication API routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from ....core.auth import create_access_token, credentials_exception, verify_token
from ....db.users import user_db
from ....domain.auth import Token, User, UserCreate, UserLogin, UserTier
import logging

logger = logging.getLogger(__name__)

router = APIRouter(tags=["auth"])
security = HTTPBearer()

# Constants to avoid hardcoded strings
BEARER_TOKEN_TYPE = "bearer"  # noqa: S105

# Dependency constants to avoid B008 errors
SECURITY_DEPENDENCY = Depends(security)


async def get_current_user(credentials: HTTPAuthorizationCredentials = SECURITY_DEPENDENCY) -> User:
    """Get current user from JWT token."""
    token = credentials.credentials
    email = verify_token(token)

    if email is None:
        raise credentials_exception

    user_in_db = user_db.get_user_by_email(email)
    if user_in_db is None:
        raise credentials_exception

    # Return user without password hash
    return User(
        id=user_in_db.id,
        name=user_in_db.name,
        email=user_in_db.email,
        tier=user_in_db.tier,
        credits=user_in_db.credits,
        subscription_expires=user_in_db.subscription_expires,
        created_at=user_in_db.created_at,
        is_active=user_in_db.is_active,
    )


# Create dependency constant for get_current_user to avoid B008 errors
CURRENT_USER_DEPENDENCY = Depends(get_current_user)


@router.post("/register", response_model=Token)
async def register(user_data: UserCreate):
    """Register a new user."""
    try:
        user = user_db.create_user(
            name=user_data.name, email=user_data.email, password=user_data.password
        )

        # Create access token
        access_token = create_access_token(data={"sub": user.email})

        return Token(access_token=access_token, token_type=BEARER_TOKEN_TYPE, user=user)

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e


@router.post("/login", response_model=Token)
async def login(user_data: UserLogin):
    """Login user."""
    logger.info("Authentication attempt for email=%s", user_data.email)
    user = user_db.authenticate_user(user_data.email, user_data.password)

    if not user:
        logger.warning("Authentication failed for email=%s", user_data.email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    else:
        logger.info("Authentication succeeded for email=%s, user_id=%s", user.email, user.id)

    # Create access token
    access_token = create_access_token(data={"sub": user.email})

    return Token(access_token=access_token, token_type=BEARER_TOKEN_TYPE, user=user)


@router.get("/me", response_model=User)
async def read_users_me(current_user: User = CURRENT_USER_DEPENDENCY):
    """Get current user information."""
    return current_user


# Dev-only: list users for debugging when DEV_DEBUG_USERS=1
import os
if os.getenv('DEV_DEBUG_USERS') == '1':
    @router.get('/admin/users')
    async def list_users():
        out = []
        try:
            udb = user_db
            # In-memory user_db exposes .users dict
            if hasattr(udb, 'users') and isinstance(getattr(udb, 'users'), dict):
                for uid, u in udb.users.items():
                    out.append({
                        'id': getattr(u, 'id', str(uid)),
                        'email': getattr(u, 'email', None),
                        'tier': getattr(u, 'tier', None),
                        'credits': getattr(u, 'credits', None),
                        'hashed_prefix': (getattr(u, 'hashed_password', '') or '')[:8],
                    })
            else:
                # Try Mongo-style collection
                try:
                    coll = getattr(udb, 'users', None)
                    if coll is not None:
                        docs = coll.find().limit(100)
                        for d in docs:
                            out.append({
                                'id': str(d.get('_id')),
                                'email': d.get('email'),
                                'tier': d.get('tier'),
                                'credits': d.get('credits'),
                                'hashed_prefix': (d.get('hashed_password') or '')[:8],
                            })
                except Exception:
                    pass
        except Exception:
            pass
        return {'users': out}


@router.post("/upgrade")
async def upgrade_to_pro(current_user: User = CURRENT_USER_DEPENDENCY, credits: int | None = None):
    """Upgrade user to pro tier (placeholder for payment integration)."""
    # In a real implementation, this would integrate with Stripe or similar
    # For now, just upgrade the user directly

    # Use the UserTier enum to avoid passing raw strings
    # set PRO tier and optionally add base credits
    success = user_db.update_user_tier(current_user.id, UserTier.PRO)
    if success and credits and credits > 0:
        try:
            user_db.update_user_credits(current_user.id, int(credits))
        except Exception:
            # Non-fatal; continue
            pass

    # Set subscription_expires to 30 days from now if we upgraded
    from datetime import datetime, timedelta
    if success:
        u = user_db.get_user_by_id(current_user.id)
        if u:
            try:
                u.subscription_expires = datetime.utcnow() + timedelta(days=30)
            except Exception:
                pass

    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to upgrade user"
        )

    # Return updated user
    updated_user = user_db.get_user_by_id(current_user.id)
    if updated_user:
        return User(
            id=updated_user.id,
            name=updated_user.name,
            email=updated_user.email,
            tier=updated_user.tier,
            credits=updated_user.credits,
            subscription_expires=updated_user.subscription_expires,
            created_at=updated_user.created_at,
            is_active=updated_user.is_active,
        )

    return current_user
