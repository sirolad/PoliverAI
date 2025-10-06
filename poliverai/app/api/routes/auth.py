"""Authentication API routes."""

from fastapi import APIRouter, Depends, HTTPException, status, Request
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


async def get_current_user(request: Request, credentials: HTTPAuthorizationCredentials = SECURITY_DEPENDENCY) -> User:
    """Get current user from JWT token."""
    token = credentials.credentials
    # Optional, opt-in header diagnostics to help debug missing/malformed auth during redirects.
    try:
        if os.getenv('DEBUG_REQUEST_HEADERS') == '1':
            # Build a safe, masked header dict for logging (don't print full auth tokens/cookies)
            hdrs = {}
            for k, v in request.headers.items():
                lk = k.lower()
                if lk == 'authorization':
                    # mask most of the token but keep prefix
                    try:
                        parts = v.split(' ')
                        if len(parts) == 2:
                            hdrs[k] = parts[0] + ' ' + (parts[1][:8] + '...')
                        else:
                            hdrs[k] = '***'
                    except Exception:
                        hdrs[k] = '***'
                elif lk in ('cookie', 'set-cookie'):
                    hdrs[k] = '***'
                else:
                    hdrs[k] = v
            logger.info('Request headers (masked) for get_current_user: %s', hdrs)
    except Exception:
        logger.exception('Failed to emit request header diagnostics in get_current_user')
    email = verify_token(token)

    if email is None:
        raise credentials_exception

    user_in_db = user_db.get_user_by_email(email)
    # Diagnostic: log whether the token maps to a known user (helps debug 403s)
    try:
        logger.info('get_current_user token_sub=%s user_found=%s', email, bool(user_in_db))
    except Exception:
        logger.exception('Failed to log get_current_user diagnostic info')
    if user_in_db is None:
        raise credentials_exception

    # Return user without password hash
    return User(
        id=user_in_db.id,
        name=user_in_db.name,
        email=user_in_db.email,
        tier=user_in_db.tier,
        credits=user_in_db.credits,
        subscription_credits=getattr(user_in_db, 'subscription_credits', 0),
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


# Dev-only: allow updating the current user's display name when DEV_DEBUG_USERS=1
import os
if os.getenv('DEV_DEBUG_USERS') == '1':
    from pydantic import BaseModel

    class NameUpdate(BaseModel):
        name: str

    @router.patch("/me", response_model=User)
    async def update_me_name(payload: NameUpdate, current_user: User = CURRENT_USER_DEPENDENCY):
        """Dev-only: update the current user's name in the underlying user_db.

        This updates the in-memory user DB or the Mongo-backed collection depending
        on which backend is active. It's intentionally gated by DEV_DEBUG_USERS
        to avoid exposing a profile update endpoint accidentally in production.
        """
        try:
            # Best-effort: if the underlying user_db exposes a dict of users (in-memory), mutate it
            from ....db import users as users_module

            udb = users_module.user_db
            # In-memory implementation: users is a dict of id->UserInDB
            if hasattr(udb, 'users') and isinstance(getattr(udb, 'users'), dict):
                u = udb.get_user_by_email(current_user.email)
                if u:
                    try:
                        u.name = payload.name
                    except Exception:
                        pass
            else:
                # Mongo-like backend: try to update the collection directly
                try:
                    coll = getattr(udb, 'users', None)
                    if coll is not None:
                        coll.update_one({'email': current_user.email}, {'$set': {'name': payload.name}})
                except Exception:
                    # Non-fatal for dev route
                    pass

            # Return the fresh user (best-effort)
            refreshed = udb.get_user_by_email(current_user.email)
            if refreshed is None:
                raise HTTPException(status_code=404, detail='user not found after update')

            return User(
                id=refreshed.id,
                name=refreshed.name,
                email=refreshed.email,
                tier=refreshed.tier,
                credits=refreshed.credits,
                subscription_credits=getattr(refreshed, 'subscription_credits', 0),
                subscription_expires=refreshed.subscription_expires,
                created_at=refreshed.created_at,
                is_active=refreshed.is_active,
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.exception('Failed to update user name via dev route: %s', e)
            raise HTTPException(status_code=500, detail='Failed to update user') from e


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


# Dev-only: admin route to update a user's hashed password in the backing store.
# This route is intentionally gated by two environment variables:
#  - DEV_DEBUG_USERS=1 (already required for other dev routes in this file)
#  - ENABLE_ADMIN_PASSWORD_UPDATE=1 (extra opt-in to avoid accidental exposure)
# The route exists so operators can temporarily enable it in a running deployment
# to fix authentication issues (for example, migrating plaintext passwords to
# Argon2 hashes). It should remain commented out or disabled in production.
if os.getenv('DEV_DEBUG_USERS') == '1' and os.getenv('ENABLE_ADMIN_PASSWORD_UPDATE') == '1':
    from pydantic import BaseModel
    from ....core.auth import get_password_hash

    class AdminPasswordUpdate(BaseModel):
        email: str
        new_password: str

    @router.post('/admin/update-password')
    async def admin_update_password(payload: AdminPasswordUpdate):
        """Dev-only: update the stored hashed_password for a given user email.

        This uses the existing `user_db` instance. When `MONGO_URI` is present
        the underlying implementation will be `MongoUserDB` and we will try to
        update the Mongo collection directly. Otherwise we mutate the in-memory
        UserDatabase. The route is intentionally minimal and guarded by two
        env vars; enable only briefly to perform fixes and then disable it.
        """
        try:
            udb = user_db
            hashed = get_password_hash(payload.new_password)

            # If underlying backend exposes a pymongo Collection, update via update_one
            coll = getattr(udb, 'users', None)
            if coll is not None and hasattr(coll, 'update_one'):
                res = coll.update_one({'email': payload.email}, {'$set': {'hashed_password': hashed}})
                if res.matched_count == 0:
                    raise HTTPException(status_code=404, detail='user not found')
                # Return the new hashed value so operators can copy it into Atlas UI if desired
                return {
                    'status': 'ok',
                    'matched': int(res.matched_count),
                    'modified': int(res.modified_count),
                    'hashed_password': hashed,
                }

            # Fallback: in-memory mutation
            if hasattr(udb, 'get_user_by_email'):
                u = udb.get_user_by_email(payload.email)
                if not u:
                    raise HTTPException(status_code=404, detail='user not found')
                try:
                    # Some implementations store as attribute, others as dict
                    if hasattr(u, 'hashed_password'):
                        u.hashed_password = hashed
                    elif isinstance(u, dict):
                        u['hashed_password'] = hashed
                    else:
                        # Try best-effort setattr
                        setattr(u, 'hashed_password', hashed)
                except Exception:
                    logger.exception('Failed to set hashed_password on in-memory user object')
                # Return the new hashed value so operators can copy it into Atlas UI if desired
                return {'status': 'ok', 'updated': True, 'hashed_password': hashed}

            # If we get here, we couldn't update
            raise HTTPException(status_code=500, detail='No supported user backend found')
        except HTTPException:
            raise
        except Exception as e:
            logger.exception('admin_update_password failed: %s', e)
            raise HTTPException(status_code=500, detail='Failed to update password') from e


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
            subscription_credits=getattr(updated_user, 'subscription_credits', 0),
            subscription_expires=updated_user.subscription_expires,
            created_at=updated_user.created_at,
            is_active=updated_user.is_active,
        )

    return current_user
