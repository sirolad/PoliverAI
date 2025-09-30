"""Authentication API routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from ....core.auth import create_access_token, credentials_exception, verify_token
from ....db.users import user_db
from ....domain.auth import Token, User, UserCreate, UserLogin

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
    user = user_db.authenticate_user(user_data.email, user_data.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create access token
    access_token = create_access_token(data={"sub": user.email})

    return Token(access_token=access_token, token_type=BEARER_TOKEN_TYPE, user=user)


@router.get("/me", response_model=User)
async def read_users_me(current_user: User = CURRENT_USER_DEPENDENCY):
    """Get current user information."""
    return current_user


@router.post("/upgrade")
async def upgrade_to_pro(current_user: User = CURRENT_USER_DEPENDENCY):
    """Upgrade user to pro tier (placeholder for payment integration)."""
    # In a real implementation, this would integrate with Stripe or similar
    # For now, just upgrade the user directly

    success = user_db.update_user_tier(current_user.id, "pro")

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
