"""Stripe payment endpoints for one-time payments and webhooks."""

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
import logging
import traceback
import os
try:
    # In development, load .env so STRIPE_* vars are available when running uvicorn from the project root
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    # dotenv is optional; if it's not installed or fails, fall back to environment variables
    pass
from ....db.users import user_db
from ....db.transactions import transactions
from datetime import datetime
from ....domain.auth import User, UserTier
from ....core.auth import verify_token

router = APIRouter(tags=["payments"])

logger = logging.getLogger(__name__)

# Load stripe keys from env
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

try:
    import stripe
    stripe.api_key = STRIPE_SECRET_KEY
except Exception:
    stripe = None

# If stripe is imported but no API key is configured, treat as not configured
if stripe is not None and not STRIPE_SECRET_KEY:
    logger.warning('Stripe library loaded but STRIPE_SECRET_KEY is not set in environment')
    stripe = None


@router.post("/create-payment-intent")
async def create_payment_intent(request: Request):
    """Create a Stripe PaymentIntent for a one-time payment.

    Expects JSON: {"amount_usd": float, "description": str}
    Returns client_secret and publishable key for client-side confirmation.
    """
    # If Stripe is not configured, allow a development fallback: create a
    # fake session object so local flows can proceed and be finalized by
    # the dev-only simulation below. In production stripe will be set and
    # used to create real sessions.
    fake_session = None

    data = await request.json()
    amount_usd = data.get("amount_usd")
    description = data.get("description", "PoliverAI credits")

    if not amount_usd or amount_usd <= 0:
        raise HTTPException(status_code=400, detail="Invalid amount")

    # convert USD to cents
    amount_cents = int(round(float(amount_usd) * 100))

    # Try to capture Authorization header to attach user metadata (optional)
    auth_header = request.headers.get('authorization')
    metadata = {}
    if auth_header and auth_header.lower().startswith('bearer '):
        token = auth_header.split(' ', 1)[1]
        email = verify_token(token)
        if email:
            metadata['user_email'] = email

    try:
        intent = stripe.PaymentIntent.create(
            amount=amount_cents,
            currency="usd",
            payment_method_types=["card"],
            description=description,
            metadata=metadata or None,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stripe error creating PaymentIntent: {e}") from e

    return JSONResponse({
        "client_secret": intent.client_secret,
        "publishable_key": STRIPE_PUBLISHABLE_KEY,
    })


@router.post('/create-checkout-session')
async def create_checkout_session(request: Request):
    """Create a Stripe Checkout session and return the URL to redirect the user to.

    Expects JSON: {amount_usd: float, description?: str, success_url?: str, cancel_url?: str}
    Returns: {url: str}
    """
    if stripe is None:
        raise HTTPException(status_code=500, detail="Stripe not configured")

    data = await request.json()
    amount_usd = data.get('amount_usd')
    description = data.get('description', 'PoliverAI credits')
    payment_type = data.get('payment_type')
    success_url = data.get('success_url') or 'http://localhost:5173'
    cancel_url = data.get('cancel_url') or success_url

    # Ensure Stripe will include the session id on redirect so the frontend
    # can finalize the persisted pending transaction. Stripe supports the
    # placeholder {CHECKOUT_SESSION_ID} which will be replaced server-side.
    try:
        if '?' in success_url:
            success_url = f"{success_url}&session_id={{CHECKOUT_SESSION_ID}}"
        else:
            success_url = f"{success_url}?session_id={{CHECKOUT_SESSION_ID}}"
    except Exception:
        # Fallback: leave success_url unchanged
        pass

    if not amount_usd or amount_usd <= 0:
        raise HTTPException(status_code=400, detail='Invalid amount')

    amount_cents = int(round(float(amount_usd) * 100))

    # capture optional auth header to attach user metadata
    auth_header = request.headers.get('authorization')
    metadata = {}
    if auth_header and auth_header.lower().startswith('bearer '):
        token = auth_header.split(' ', 1)[1]
        email = verify_token(token)
        if email:
            metadata['user_email'] = email

    try:
        if stripe is not None:
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[
                    {
                        'price_data': {
                            'currency': 'usd',
                            'product_data': {'name': description},
                            'unit_amount': amount_cents,
                        },
                        'quantity': 1,
                    }
                ],
                mode='payment',
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={**(metadata or {}), **({'payment_type': payment_type} if payment_type else {})} or None,
            )
        else:
            # Development fallback: construct a simple dict mimicking Stripe's session
            import uuid
            session = {'id': f'dev_{uuid.uuid4().hex}', 'url': success_url}
            fake_session = session
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Failed to create checkout session: {e}') from e

    # Persist a pending transaction record so the client can poll/finalize it
    try:
        tx = {
            'user_email': metadata.get('user_email') if isinstance(metadata, dict) else None,
            'event_type': 'checkout_session_pending',
            'amount_usd': float(amount_usd),
            'credits': None,
            'description': description,
            'session_id': getattr(session, 'id', None) or (session.get('id') if isinstance(session, dict) else None),
            'status': 'pending',
            'payment_type': payment_type,
        }
        transactions.add(tx)
    except Exception:
        # Non-fatal: proceed even if we can't persist the pending tx
        logger.exception('Failed to persist pending transaction for session creation')

    # DEV: If Stripe isn't configured (local dev), simulate immediate completion
    # so local checkout flows can be finalized without external Stripe calls.
    if stripe is None:
        try:
            sess_id = getattr(session, 'id', None) or (session.get('id') if isinstance(session, dict) else None)
            # mark transaction completed and apply credits immediately
            if sess_id:
                try:
                    found = transactions.get_by_session_or_id(sess_id)
                    if found:
                        amt = float(amount_usd)
                        credits = int(round(amt * 10))
                        # if subscription payment_type, upgrade user and allocate sub credits
                        if payment_type == 'subscription' or ('upgrade' in (description or '').lower()):
                            ue = found.get('user_email')
                            if ue:
                                u = user_db.get_user_by_email(ue)
                                if u:
                                    try:
                                        from datetime import timedelta
                                        user_db.update_user_tier(u.id, UserTier.PRO)
                                        expires_at = datetime.utcnow() + timedelta(days=30)
                                        if hasattr(user_db, 'update_user_subscription'):
                                            user_db.update_user_subscription(u.id, expires_at)
                                        else:
                                            u.subscription_expires = expires_at
                                    except Exception:
                                        logger.exception('Dev: failed to set subscription expiry for %s', ue)
                                    # allocate subscription credits
                                    try:
                                        base_sub_credits = int(round(amt * 10))
                                        bonus = int(round(base_sub_credits * 0.2))
                                        sub_credits = base_sub_credits + bonus
                                        if hasattr(user_db, 'update_user_subscription_credits'):
                                            user_db.update_user_subscription_credits(u.id, sub_credits)
                                        else:
                                            try:
                                                u.subscription_credits = (getattr(u, 'subscription_credits', 0) or 0) + sub_credits
                                            except Exception:
                                                pass
                                    except Exception:
                                        logger.exception('Dev: failed to allocate subscription credits for %s', ue)
                        else:
                            # For one-off purchases, add purchased credits
                            try:
                                if found.get('user_email'):
                                    u = user_db.get_user_by_email(found.get('user_email'))
                                    if u:
                                        user_db.update_user_credits(u.id, credits)
                            except Exception:
                                logger.exception('Dev: failed to apply credits for session %s', sess_id)

                        try:
                            transactions.update(sess_id, {'status': 'completed', 'amount_usd': amt, 'credits': credits})
                        except Exception:
                            logger.exception('Dev: failed to update transaction for %s', sess_id)
                except Exception:
                    logger.exception('Dev: error simulating checkout completion for session %s', sess_id)
        except Exception:
            logger.exception('Dev: error in simulated completion flow')

    return JSONResponse({'url': session.url, 'id': getattr(session, 'id', None) or session.get('id') if isinstance(session, dict) else None})


@router.get('/debug/transactions')
async def debug_transactions():
    """DEV-ONLY: return raw transactions list for debugging. Enabled when FAST_DEV=1 or DEBUG_TRANSACTION_DUMP=1."""
    if os.getenv('FAST_DEV', 'false').lower() != 'true' and os.getenv('DEBUG_TRANSACTION_DUMP', 'false').lower() != 'true':
        raise HTTPException(status_code=404, detail='Not found')
    try:
        # Try to expose internal items if present (in-memory store)
        if hasattr(transactions, 'items'):
            out = list(getattr(transactions, 'items'))
        else:
            # Fallback for Mongo-backed store: attempt to list a few entries
            try:
                out = transactions.list_for_user(None) or []
            except Exception:
                out = []
        return JSONResponse({'transactions_raw': out})
    except Exception as e:
        logger.exception('Failed to return debug transactions: %s', e)
        raise HTTPException(status_code=500, detail='Failed to read transactions') from e



@router.post('/checkout/complete')
async def complete_checkout_session(request: Request):
    """Finalize a Checkout Session by session_id. Useful for local dev when webhooks are not configured.

    Expects JSON: {session_id: str}
    """
    if stripe is None:
        raise HTTPException(status_code=500, detail='Stripe not configured')

    data = await request.json()
    session_id = data.get('session_id')
    if not session_id:
        raise HTTPException(status_code=400, detail='Missing session_id')

    try:
        sess = stripe.checkout.Session.retrieve(session_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f'Failed to retrieve session: {e}') from e

    # Ensure payment was successful
    payment_status = getattr(sess, 'payment_status', None) or (sess.get('payment_status') if isinstance(sess, dict) else None)
    if payment_status != 'paid':
        raise HTTPException(status_code=400, detail=f'Session payment_status={payment_status}')

    # Extract metadata and amount
    metadata = (sess.get('metadata') or {}) if isinstance(sess, dict) else (sess.metadata or {})
    user_email = metadata.get('user_email') if isinstance(metadata, dict) else None
    payment_type = metadata.get('payment_type') if isinstance(metadata, dict) else getattr(sess, 'metadata', {}).get('payment_type') if getattr(sess, 'metadata', None) else None
    amount_cents = getattr(sess, 'amount_total', None) or sess.get('amount_total') if isinstance(sess, dict) else None
    description = getattr(sess, 'description', None) or sess.get('description') if isinstance(sess, dict) else None

    # Avoid duplicate processing: check if transactions already contain this session_id
    try:
        existing = None
        try:
            # If transactions is backed by Mongo it may have find
            if hasattr(transactions, 'list_for_user'):
                # In-memory fallback: scan items
                all_tx = []
                try:
                    # try to access internal items for in-memory store
                    if hasattr(transactions, 'items'):
                        all_tx = list(getattr(transactions, 'items'))
                except Exception:
                    all_tx = []
                for t in all_tx:
                    if t.get('session_id') == session_id:
                        existing = t
                        break
        except Exception:
            existing = None
        if existing:
            return JSONResponse({'status': 'already_processed'})
    except Exception:
        pass

    # Apply server-side changes based on metadata
    if user_email:
        user = user_db.get_user_by_email(user_email)
        if user:
            try:
                # If this checkout was a subscription/upgrade, update tier and subscription expiry
                if payment_type == 'subscription' or (isinstance(description, str) and 'upgrade' in (description or '').lower()):
                    try:
                        from datetime import timedelta
                        user_db.update_user_tier(user.id, UserTier.PRO)
                        expires_at = datetime.utcnow() + timedelta(days=30)
                        try:
                            if hasattr(user_db, 'update_user_subscription'):
                                user_db.update_user_subscription(user.id, expires_at)
                            else:
                                user.subscription_expires = expires_at
                        except Exception:
                            logger.exception('Failed to persist subscription_expires for %s', user_email)

                        # Allocate subscription credits as part of the subscription benefit.
                        try:
                            # Simple rule: convert paid USD to credits (1 USD -> 10 credits)
                            # and add a subscription bonus multiplier (e.g., 1.2x).
                            usd = (float(amount_cents) / 100.0) if amount_cents else 0.0
                            base_sub_credits = int(round(usd * 10))
                            bonus = int(round(base_sub_credits * 0.2))
                            sub_credits = base_sub_credits + bonus
                            if hasattr(user_db, 'update_user_subscription_credits'):
                                user_db.update_user_subscription_credits(user.id, sub_credits)
                            else:
                                # Fallback for in-memory user without helper (shouldn't happen)
                                try:
                                    user.subscription_credits = (getattr(user, 'subscription_credits', 0) or 0) + sub_credits
                                except Exception:
                                    pass
                        except Exception:
                            logger.exception('Failed to allocate subscription credits for %s', user_email)
                    except Exception:
                        logger.exception('Failed to upgrade user to PRO for %s', user_email)
                else:
                    usd = (float(amount_cents) / 100.0) if amount_cents else 0.0
                    credits = int(round(usd * 10))
                    logger.info('Finalizing checkout for session=%s user=%s amount_usd=%s credits=%s', session_id, user_email, usd, credits)
                    if not isinstance(credits, int):
                        logger.error('Computed credits is not int: %s', credits)
                    else:
                        user_db.update_user_credits(user.id, credits)
            except Exception:
                pass

    # Persist transaction record
    try:
        amt = (float(amount_cents) / 100.0) if amount_cents else 0.0
        tx = {
            'user_email': user_email,
            'event_type': 'checkout_session_completed',
            'amount_usd': amt,
            'credits': int(round(amt * 10)),
            'description': description or 'Checkout purchase',
            'session_id': session_id,
            'payment_type': payment_type,
        }
        transactions.add(tx)
    except Exception:
        pass

    # Clear any duplicate pending handling is done client-side; return status
    resp = {'status': 'completed'}
    try:
        if user_email:
            u = user_db.get_user_by_email(user_email)
            if u:
                resp['user'] = {'email': u.email, 'credits': u.credits, 'tier': getattr(u, 'tier', None)}
            else:
                logger.warning('User not found after checkout finalization for email=%s', user_email)
    except Exception:
        logger.exception('Failed to include updated user info in checkout response for %s', user_email)

    return JSONResponse(resp)



@router.get('/checkout/finalize')
async def checkout_finalize_get(request: Request):
    """Finalize a checkout session via GET for use as a redirect target from Stripe.

    Query param: session_id
    This endpoint is intended for development flows where the browser is
    redirected back from Stripe; it finalizes the session server-side and
    then redirects the user to the app credits page.
    """
    if stripe is None:
        raise HTTPException(status_code=500, detail='Stripe not configured')

    session_id = request.query_params.get('session_id')
    if not session_id:
        raise HTTPException(status_code=400, detail='Missing session_id')

    try:
        sess = stripe.checkout.Session.retrieve(session_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f'Failed to retrieve session: {e}') from e

    payment_status = getattr(sess, 'payment_status', None) or (sess.get('payment_status') if isinstance(sess, dict) else None)
    if payment_status != 'paid':
        # Not paid - redirect back to credits page but include session id so
        # the frontend can attempt to finalize/check the transaction and
        # show a failure result if applicable.
        from fastapi.responses import RedirectResponse
        try:
            return RedirectResponse(url=f'/credits?session_id={session_id}&status=failed')
        except Exception:
            return RedirectResponse(url='/credits')

    # Reuse similar finalization logic to complete_checkout_session (best-effort)
    try:
        metadata = (sess.get('metadata') or {}) if isinstance(sess, dict) else (sess.metadata or {})
        user_email = metadata.get('user_email') if isinstance(metadata, dict) else None
        amount_cents = getattr(sess, 'amount_total', None) or sess.get('amount_total') if isinstance(sess, dict) else None
        description = getattr(sess, 'description', None) or sess.get('description') if isinstance(sess, dict) else None

        if user_email:
            u = user_db.get_user_by_email(user_email)
            if u:
                try:
                    payment_type = metadata.get('payment_type') if isinstance(metadata, dict) else None
                    if payment_type == 'subscription' or (isinstance(description, str) and 'upgrade' in (description or '').lower()):
                        from datetime import timedelta
                        user_db.update_user_tier(u.id, UserTier.PRO)
                        expires_at = datetime.utcnow() + timedelta(days=30)
                        try:
                            if hasattr(user_db, 'update_user_subscription'):
                                user_db.update_user_subscription(u.id, expires_at)
                            else:
                                u.subscription_expires = expires_at
                        except Exception:
                            logger.exception('Failed to persist subscription_expires for %s', user_email)
                        # Allocate subscription credits (same rule as complete_checkout_session)
                        try:
                            usd = (float(amount_cents) / 100.0) if amount_cents else 0.0
                            base_sub_credits = int(round(usd * 10))
                            bonus = int(round(base_sub_credits * 0.2))
                            sub_credits = base_sub_credits + bonus
                            if hasattr(user_db, 'update_user_subscription_credits'):
                                user_db.update_user_subscription_credits(u.id, sub_credits)
                            else:
                                try:
                                    u.subscription_credits = (getattr(u, 'subscription_credits', 0) or 0) + sub_credits
                                except Exception:
                                    pass
                        except Exception:
                            logger.exception('Failed to allocate subscription credits for %s', user_email)
                    else:
                        usd = (float(amount_cents) / 100.0) if amount_cents else 0.0
                        credits = int(round(usd * 10))
                        user_db.update_user_credits(u.id, credits)
                except Exception:
                    logger.exception('Failed to apply purchase for %s', user_email)

        # Persist transaction record (best-effort)
        try:
            amt = (float(amount_cents) / 100.0) if amount_cents else 0.0
            tx = {
                'user_email': user_email,
                'event_type': 'checkout_session_completed',
                'amount_usd': amt,
                'credits': int(round(amt * 10)),
                'description': description or 'Checkout purchase',
                'session_id': session_id,
            }
            transactions.add(tx)
        except Exception:
            logger.exception('Failed to persist transaction for session %s', session_id)

    except Exception:
        logger.exception('Error finalizing checkout session %s', session_id)

    from fastapi.responses import RedirectResponse
    try:
        # Include session_id so the frontend can detect the return and show
        # the result modal by calling the transactions endpoint.
        return RedirectResponse(url=f'/credits?session_id={session_id}&status=completed')
    except Exception:
        return RedirectResponse(url='/credits')


@router.post("/webhook")
async def stripe_webhook(request: Request):
    """Basic webhook endpoint to handle payment succeeded events.

    NOTE: This is minimal and in a production app you'd verify signatures.
    """
    if stripe is None:
        raise HTTPException(status_code=500, detail="Stripe not configured")

    # Read raw body for signature verification if possible
    payload = await request.body()

    # If we have a webhook secret configured, verify signature
    event = None
    if STRIPE_WEBHOOK_SECRET:
        sig_header = request.headers.get('stripe-signature')
        try:
            event = stripe.Webhook.construct_event(payload=payload, sig_header=sig_header, secret=STRIPE_WEBHOOK_SECRET)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Webhook signature verification failed: {e}")
    else:
        try:
            event = await request.json()
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid webhook payload")

    # Handle specific event types
    evt_type = event.get('type') if isinstance(event, dict) else getattr(event, 'type', None)
    if event and (evt_type == 'payment_intent.succeeded' or evt_type == 'checkout.session.completed' or evt_type == 'payment_intent.payment_failed' or evt_type == 'charge.failed'):
        # event may be a dict (when webhook secret not used) or a Stripe.Event
        obj = None
        if isinstance(event, dict):
            obj = event.get('data', {}).get('object', {})
        else:
            obj = event.data.object

    # For PaymentIntent the object is the intent, for Checkout it's the session
        metadata = (obj.get('metadata') or {}) if isinstance(obj, dict) else (obj.metadata or {})
        user_email = metadata.get('user_email') if isinstance(metadata, dict) else None

        # Determine amount and description depending on object type
        amount_cents = None
        description = ''
        if isinstance(obj, dict):
            # PaymentIntent
            amount_cents = obj.get('amount')
            description = obj.get('description', '')
            # For Checkout session, amount_total may be present
            if not amount_cents and obj.get('amount_total'):
                amount_cents = obj.get('amount_total')
        else:
            amount_cents = getattr(obj, 'amount', None) or getattr(obj, 'amount_total', None)
            description = getattr(obj, 'description', '')

        # Extract failure codes/messages if present
        failure_code = None
        failure_message = None
        try:
            if isinstance(obj, dict):
                # look for last_payment_error on intent
                if obj.get('last_payment_error'):
                    lpe = obj.get('last_payment_error')
                    failure_code = lpe.get('code')
                    failure_message = lpe.get('message')
                # charges list may contain failure info
                charges = obj.get('charges', {}).get('data', [])
                if charges and not failure_code:
                    c = charges[0]
                    failure_code = c.get('failure_code')
                    failure_message = c.get('failure_message')
        except Exception:
            pass

        # Apply server-side changes based on metadata and description
        if user_email:
            user = user_db.get_user_by_email(user_email)
            if user:
                try:
                    if isinstance(description, str) and 'upgrade' in description.lower():
                        try:
                            from datetime import timedelta
                            user_db.update_user_tier(user.id, UserTier.PRO)
                            expires_at = datetime.utcnow() + timedelta(days=30)
                            try:
                                if hasattr(user_db, 'update_user_subscription'):
                                    user_db.update_user_subscription(user.id, expires_at)
                                else:
                                    user.subscription_expires = expires_at
                            except Exception:
                                logger.exception('Failed to persist subscription_expires for %s', user_email)
                        except Exception:
                            logger.exception('Failed to upgrade user to PRO for %s', user_email)
                    else:
                        usd = (float(amount_cents) / 100.0) if amount_cents else 0.0
                        credits = int(round(usd * 10))
                        user_db.update_user_credits(user.id, credits)
                except Exception:
                    pass

        # Persist a transaction record for the user (best-effort)
        try:
            amt = (float(amount_cents) / 100.0) if amount_cents else 0.0
            tx = {
                'user_email': user_email,
                'event_type': evt_type,
                'amount_usd': amt,
                'credits': int(round(amt * 10)),
                'description': description,
                'failure_code': failure_code,
                'failure_message': failure_message,
            }
            transactions.add(tx)
        except Exception:
            # Non-fatal: don't fail webhook because transactions storage failed
            pass

        return JSONResponse({"status": "handled"})

    return JSONResponse({"status": "ignored"})




@router.get('/transactions')
async def list_transactions(request: Request):
    """List transactions for the current authenticated user.

    Returns list of transaction records and a balance (sum of credits).
    """
    # Allow unauthenticated access to this endpoint for finalization flows
    # that return from external checkout redirects (Stripe). If an
    # Authorization header is present, verify it; otherwise proceed and
    # rely on the stored transaction (which includes user_email) to
    # identify and finalize the transaction. If an auth token is present
    # but does not match the transaction owner, reject with 403.
    auth_header = request.headers.get('authorization')
    email = None
    if auth_header and auth_header.lower().startswith('bearer '):
        token = auth_header.split(' ', 1)[1]
        email = verify_token(token)
        if not email:
            # Provided token is invalid
            raise HTTPException(status_code=401, detail='Invalid token')

    # list_transactions requires authentication and will fail if no valid token

    try:
        # Fetch full list from storage (storage may be Mongo-backed or in-memory)
        items = transactions.list_for_user(email)
        if items is None:
            items = []

        # Compute total spent credits (sum of negative credit events) across all items
        total_spent_credits = sum((-(int(i.get('credits', 0) or 0)) if (int(i.get('credits', 0) or 0) < 0) else 0) for i in items)

        # Pagination query parameters: page (1-based) and limit
        qp = request.query_params
        page = None
        limit = None
        try:
            if 'page' in qp:
                page = int(qp.get('page'))
                if page < 1:
                    page = None
        except Exception:
            page = None
        try:
            if 'limit' in qp:
                limit = int(qp.get('limit'))
                if limit <= 0:
                    limit = None
        except Exception:
            limit = None

        total_count = len(items)

        # Normalize any datetime objects to ISO strings so JSONResponse can serialize
        for it in items:
            try:
                ts = it.get('timestamp')
                if isinstance(ts, datetime):
                    it['timestamp'] = ts.isoformat()
            except Exception:
                pass

        # Apply pagination (server-side slicing) if both page and limit are provided
        paged_items = items
        total_pages = 1
        if page is not None and limit is not None:
            start = (page - 1) * limit
            end = start + limit
            paged_items = items[start:end]
            total_pages = max(1, (total_count + limit - 1) // limit)

        total_credits = sum(int(i.get('credits', 0) or 0) for i in items)
        resp = {
            'transactions': paged_items,
            'balance': total_credits,
            'total': total_count,
            'total_pages': total_pages,
            'page': page or 1,
            'limit': limit or total_count,
            'total_spent_credits': total_spent_credits,
        }
        return JSONResponse(resp)
    except Exception as e:
        # Log full traceback for debugging in dev
        logger.error('Failed to list transactions for email=%s: %s', email, e)
        logger.debug(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f'Failed to list transactions: {e}') from e



@router.get('/transactions/{session_or_id}')
async def get_transaction(request: Request, session_or_id: str):
    """Fetch a single transaction by session_id or transaction id for the authenticated user.

    Returns 404 if not found or 401 if not authorized.
    """
    # Allow unauthenticated access to this endpoint for finalization flows
    # that return from external checkout redirects (Stripe). If an
    # Authorization header is present, verify it; otherwise proceed and
    # rely on the stored transaction (which includes user_email) to
    # identify and finalize the transaction. If an auth token is present
    # but does not match the transaction owner, reject with 403.
    auth_header = request.headers.get('authorization')
    email = None
    if auth_header and auth_header.lower().startswith('bearer '):
        token = auth_header.split(' ', 1)[1]
        email = verify_token(token)
        if not email:
            # Provided token is invalid
            raise HTTPException(status_code=401, detail='Invalid token')

    # Diagnostic logging for finalizer requests
    try:
        origin = request.headers.get('origin') or request.headers.get('referer')
        has_auth = bool(auth_header)
        remote = request.client.host if getattr(request, 'client', None) else 'unknown'
        logger.info('Transaction fetch request session=%s origin=%s has_auth=%s remote=%s', session_or_id, origin, has_auth, remote)
        # Optional detailed header diagnostics (masked) when DEBUG_REQUEST_HEADERS=1
        try:
            if os.getenv('DEBUG_REQUEST_HEADERS') == '1':
                hdrs = {}
                for k, v in request.headers.items():
                    lk = k.lower()
                    if lk == 'authorization':
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
                logger.info('Transaction request headers (masked): %s', hdrs)
        except Exception:
            logger.exception('Failed to emit request header diagnostics for transaction request')
    except Exception:
        logger.exception('Failed to log diagnostic info for transaction request %s', session_or_id)

    try:
        # Try to find a transaction matching session_id or id
        # Use the storage helper to locate the transaction
        found = None
        try:
            found = transactions.get_by_session_or_id(session_or_id)
        except Exception:
            found = None

        if not found:
            raise HTTPException(status_code=404, detail='Transaction not found')

        # If an authenticated user is making the request, ensure they own
        # the transaction. If the request is unauthenticated, allow
        # finalization based on the stored transaction (useful after
        # external redirects where local auth state may have been lost).
        tx_user = found.get('user_email')
        if email and tx_user and tx_user != email:
            # Authenticated user attempting to access another user's tx
            raise HTTPException(status_code=403, detail='Forbidden')

        # If the transaction is pending, attempt to retrieve latest status from Stripe
        try:
            if found.get('status') == 'pending' and stripe is not None:
                session_id = found.get('session_id')
                if session_id:
                    try:
                        sess = stripe.checkout.Session.retrieve(session_id)
                        payment_status = getattr(sess, 'payment_status', None) or (sess.get('payment_status') if isinstance(sess, dict) else None)
                        if payment_status == 'paid':
                            # Finalize: compute credits, update user, and mark transaction completed
                            amt = (float(getattr(sess, 'amount_total', None) or (sess.get('amount_total') if isinstance(sess, dict) else 0)) / 100.0)
                            credits = int(round(amt * 10))
                            user_email = (sess.get('metadata') or {}).get('user_email') if isinstance(sess, dict) else (sess.metadata.get('user_email') if sess.metadata else None)
                            # Detect payment_type either from stored transaction or from session metadata
                            stored_type = found.get('payment_type')
                            sess_meta_type = (sess.get('metadata') or {}).get('payment_type') if isinstance(sess, dict) else (sess.metadata.get('payment_type') if sess.metadata else None)
                            payment_type_final = stored_type or sess_meta_type
                            if user_email:
                                u = user_db.get_user_by_email(user_email)
                                if u:
                                    # determine description from session or stored transaction
                                    sess_description = None
                                    try:
                                        if isinstance(sess, dict):
                                            sess_description = sess.get('description')
                                        else:
                                            sess_description = getattr(sess, 'description', None)
                                    except Exception:
                                        sess_description = None
                                    description_local = sess_description or found.get('description')

                                    if payment_type_final == 'subscription' or (isinstance(description_local, str) and 'upgrade' in (description_local or '').lower()):
                                        # upgrade user to PRO and set subscription expiry via DB helper
                                        try:
                                            from datetime import timedelta
                                            user_db.update_user_tier(u.id, UserTier.PRO)
                                            expires_at = datetime.utcnow() + timedelta(days=30)
                                            try:
                                                # Prefer DB helper if available
                                                if hasattr(user_db, 'update_user_subscription'):
                                                    user_db.update_user_subscription(u.id, expires_at)
                                                else:
                                                    # fallback: set attribute on returned object
                                                    u.subscription_expires = expires_at
                                            except Exception:
                                                logger.exception('Failed to persist subscription_expires for %s', user_email)
                                        except Exception:
                                            logger.exception('Failed to upgrade user to PRO for %s', user_email)
                                    else:
                                        user_db.update_user_credits(u.id, credits)

                            # update transaction record
                            updates = {'status': 'completed', 'amount_usd': amt, 'credits': credits, 'payment_type': payment_type_final}
                            try:
                                transactions.update(session_or_id, updates)
                                # refresh found
                                found = transactions.get_by_session_or_id(session_or_id)
                            except Exception:
                                logger.exception('Failed to update transaction status for %s', session_or_id)
                        else:
                            # Payment not paid: capture last payment error if available
                            # Attempt to inspect payment_intent or latest_charge for failure details
                            failure_code = None
                            failure_message = None
                            try:
                                # For Checkout session, there may be a payment_intent attribute
                                pi = None
                                if isinstance(sess, dict):
                                    pi = sess.get('payment_intent')
                                else:
                                    pi = getattr(sess, 'payment_intent', None)

                                if pi:
                                    # retrieve payment intent object if it's an id
                                    if isinstance(pi, str):
                                        try:
                                            intent_obj = stripe.PaymentIntent.retrieve(pi)
                                        except Exception:
                                            intent_obj = None
                                    else:
                                        intent_obj = pi

                                    if intent_obj:
                                        # get last_payment_error if present
                                        lpe = intent_obj.get('last_payment_error') if isinstance(intent_obj, dict) else getattr(intent_obj, 'last_payment_error', None)
                                        if lpe:
                                            failure_code = (lpe.get('code') if isinstance(lpe, dict) else getattr(lpe, 'code', None))
                                            failure_message = (lpe.get('message') if isinstance(lpe, dict) else getattr(lpe, 'message', None))
                                # If not found on payment_intent, try charges
                                if not failure_code:
                                    # attempt to read latest charge on the session
                                    if isinstance(sess, dict):
                                        payment_intent = sess.get('payment_intent')
                                    else:
                                        payment_intent = getattr(sess, 'payment_intent', None)
                                    if payment_intent:
                                        try:
                                            intent_obj = stripe.PaymentIntent.retrieve(payment_intent) if isinstance(payment_intent, str) else payment_intent
                                            charges = intent_obj.get('charges', {}).get('data', []) if isinstance(intent_obj, dict) else getattr(intent_obj, 'charges', None)
                                            if charges:
                                                c = charges[0]
                                                failure_code = c.get('failure_code') if isinstance(c, dict) else getattr(c, 'failure_code', None)
                                                failure_message = c.get('failure_message') if isinstance(c, dict) else getattr(c, 'failure_message', None)
                                        except Exception:
                                            pass
                            except Exception:
                                logger.exception('Failed to extract failure codes for session %s', session_or_id)

                            # persist failure info on transaction so UI can reflect it
                            try:
                                updates = {}
                                if failure_code:
                                    updates['failure_code'] = failure_code
                                if failure_message:
                                    updates['failure_message'] = failure_message
                                if updates:
                                    # leave status as pending or set to 'failed' depending on payment_status
                                    updates['status'] = 'failed' if payment_status in (None, 'unpaid', 'no_payment_required') else 'pending'
                                    transactions.update(session_or_id, updates)
                                    found = transactions.get_by_session_or_id(session_or_id)
                            except Exception:
                                logger.exception('Failed to persist failure info for %s', session_or_id)
                    except Exception:
                        # If Stripe retrieval failed, leave pending as-is
                        logger.exception('Failed to retrieve Stripe session for transaction check %s', session_or_id)
        except Exception:
            logger.exception('Error while attempting to finalize pending transaction %s', session_or_id)

        # Normalize timestamp for response
        try:
            ts = found.get('timestamp')
            if isinstance(ts, datetime):
                found['timestamp'] = ts.isoformat()
        except Exception:
            pass

        # If possible include updated user info so frontend can refresh state
        user_info = None
        try:
            ue = found.get('user_email')
            if ue:
                u = user_db.get_user_by_email(ue)
                if u:
                    user_info = {
                        'email': u.email,
                            'credits': getattr(u, 'credits', None),
                            'subscription_credits': getattr(u, 'subscription_credits', None) or 0,
                            'tier': getattr(u, 'tier', None),
                            'subscription_expires': getattr(u, 'subscription_expires', None).isoformat() if getattr(u, 'subscription_expires', None) else None,
                    }
        except Exception:
            logger.exception('Failed to include user info in transaction response for %s', session_or_id)

        resp = {'transaction': found}
        if user_info:
            resp['user'] = user_info
        return JSONResponse(resp)
    except HTTPException:
        raise
    except Exception as e:
        logger.error('Failed to fetch transaction %s for %s: %s', session_or_id, email, e)
        logger.debug(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f'Failed to fetch transaction: {e}') from e


@router.post('/credit')
async def credit_user(request: Request):
    """Apply credits to authenticated user. Expects {amount_usd: float} in body.

    Converts USD to credits (1 USD -> 10 credits) and updates user in DB.
    """
    auth_header = request.headers.get('authorization')
    if not auth_header or not auth_header.lower().startswith('bearer '):
        raise HTTPException(status_code=401, detail='Missing Authorization')

    token = auth_header.split(' ', 1)[1]
    email = verify_token(token)
    if not email:
        raise HTTPException(status_code=401, detail='Invalid token')

    user_in_db = user_db.get_user_by_email(email)
    if not user_in_db:
        raise HTTPException(status_code=404, detail='User not found')

    data = await request.json()
    amount_usd = float(data.get('amount_usd', 0))
    if amount_usd <= 0:
        raise HTTPException(status_code=400, detail='Invalid amount')

    # conversion rate
    credits = int(round(amount_usd * 10))

    success = user_db.update_user_credits(user_in_db.id, credits)
    if not success:
        raise HTTPException(status_code=500, detail='Failed to add credits')

    updated = user_db.get_user_by_id(user_in_db.id)
    # Persist a transaction record for this credit operation (best-effort)
    try:
        tx = {
            'user_email': email,
            'event_type': 'manual_credit',
            'amount_usd': float(amount_usd),
            'credits': credits,
            'description': 'Manual credit purchase via /credit',
        }
        transactions.add(tx)
    except Exception:
        pass
    return JSONResponse({
        'credits': updated.credits if updated else None,
        'tier': updated.tier if updated else None,
    })
