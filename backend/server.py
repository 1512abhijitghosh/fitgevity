"""Limitless Home Workout - FastAPI backend."""
import os
import uuid
import logging
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import List, Optional

import bcrypt
import httpx
import jwt
import stripe
from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter, HTTPException, Request, Header, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field
from starlette.middleware.cors import CORSMiddleware

from seed_data import CATEGORIES, EXERCISES, PLANS

# ============================================================================
# Setup
# ============================================================================
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

JWT_SECRET = os.environ.get("JWT_SECRET", "limitless-secret")
JWT_ALG = "HS256"
JWT_EXP_DAYS = 30

stripe.api_key = os.environ.get("STRIPE_API_KEY", "")
# Route the Stripe SDK through the Emergent integrations proxy (pod-internal Stripe mock).
_proxy_base = os.environ.get("INTEGRATION_PROXY_URL", "https://integrations.emergentagent.com")
stripe.api_base = f"{_proxy_base.rstrip('/')}/stripe"
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
PREMIUM_PRICE_USD = 9.99  # one-time premium unlock for MVP

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="Limitless Home Workout API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
log = logging.getLogger("limitless")


# ============================================================================
# Models
# ============================================================================
class SignupBody(BaseModel):
    email: EmailStr
    password: str
    name: str


class LoginBody(BaseModel):
    email: EmailStr
    password: str


class GoogleSessionBody(BaseModel):
    session_id: str


class WorkoutLogBody(BaseModel):
    plan_id: Optional[str] = None
    category_id: Optional[str] = None
    duration_sec: int
    calories: int = 0
    exercises_completed: int = 0


class UserOut(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    is_premium: bool = False
    streak: int = 0
    total_workouts: int = 0


class TokenOut(BaseModel):
    token: str
    user: UserOut


# ============================================================================
# Helpers
# ============================================================================
def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def make_jwt(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "iat": int(now_utc().timestamp()),
        "exp": int((now_utc() + timedelta(days=JWT_EXP_DAYS)).timestamp()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def to_user_out(user: dict) -> UserOut:
    return UserOut(
        user_id=user["user_id"],
        email=user["email"],
        name=user.get("name", ""),
        picture=user.get("picture"),
        is_premium=user.get("is_premium", False),
        streak=user.get("streak", 0),
        total_workouts=user.get("total_workouts", 0),
    )


async def current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.split(" ", 1)[1].strip()

    # Try JWT first (email/password users)
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        uid = payload.get("sub")
        if uid:
            user = await db.users.find_one({"user_id": uid}, {"_id": 0})
            if user:
                return user
    except jwt.PyJWTError:
        pass

    # Then Google session token
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if session:
        exp = session.get("expires_at")
        if exp and exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if exp and exp > now_utc():
            user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
            if user:
                return user

    raise HTTPException(status_code=401, detail="Invalid or expired token")


# ============================================================================
# Startup: indexes + seed
# ============================================================================
@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id", unique=True)
    await db.user_sessions.create_index("session_token", unique=True)
    await db.user_sessions.create_index("expires_at", expireAfterSeconds=0)
    await db.workout_logs.create_index([("user_id", 1), ("created_at", -1)])

    # Seed catalog (idempotent)
    if await db.categories.count_documents({}) == 0:
        await db.categories.insert_many([{**c} for c in CATEGORIES])
        log.info("Seeded categories")
    if await db.exercises.count_documents({}) == 0:
        docs = []
        for cat_id, items in EXERCISES.items():
            for idx, ex in enumerate(items):
                docs.append({
                    "exercise_id": f"{cat_id}_{idx}",
                    "category_id": cat_id,
                    **ex,
                })
        await db.exercises.insert_many(docs)
        log.info("Seeded exercises")
    if await db.plans.count_documents({}) == 0:
        await db.plans.insert_many([{**p} for p in PLANS])
        log.info("Seeded plans")


@app.on_event("shutdown")
async def shutdown():
    client.close()


# ============================================================================
# Auth - Email/Password
# ============================================================================
@api.post("/auth/signup", response_model=TokenOut)
async def signup(body: SignupBody):
    existing = await db.users.find_one({"email": body.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user = {
        "user_id": user_id,
        "email": body.email.lower(),
        "name": body.name,
        "password_hash": hash_password(body.password),
        "auth_provider": "password",
        "is_premium": False,
        "streak": 0,
        "total_workouts": 0,
        "last_workout_date": None,
        "created_at": now_utc(),
    }
    await db.users.insert_one(user)
    return TokenOut(token=make_jwt(user_id), user=to_user_out(user))


@api.post("/auth/login", response_model=TokenOut)
async def login(body: LoginBody):
    user = await db.users.find_one({"email": body.email.lower()}, {"_id": 0})
    if not user or not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return TokenOut(token=make_jwt(user["user_id"]), user=to_user_out(user))


# ============================================================================
# Auth - Google (Emergent session)
# ============================================================================
@api.post("/auth/google", response_model=TokenOut)
async def google_session(body: GoogleSessionBody):
    async with httpx.AsyncClient(timeout=15.0) as http:
        r = await http.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": body.session_id},
        )
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session id")
    data = r.json()
    email = data["email"].lower()
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        user = existing
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user = {
            "user_id": user_id,
            "email": email,
            "name": data.get("name", ""),
            "picture": data.get("picture"),
            "auth_provider": "google",
            "is_premium": False,
            "streak": 0,
            "total_workouts": 0,
            "last_workout_date": None,
            "created_at": now_utc(),
        }
        await db.users.insert_one(user)

    session_token = data["session_token"]
    await db.user_sessions.update_one(
        {"session_token": session_token},
        {"$set": {
            "session_token": session_token,
            "user_id": user_id,
            "expires_at": now_utc() + timedelta(days=7),
            "created_at": now_utc(),
        }},
        upsert=True,
    )
    return TokenOut(token=session_token, user=to_user_out(user))


@api.get("/auth/me", response_model=UserOut)
async def me(user: dict = Depends(current_user)):
    return to_user_out(user)


@api.post("/auth/logout")
async def logout(authorization: Optional[str] = Header(None)):
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
        await db.user_sessions.delete_one({"session_token": token})
    return {"ok": True}


# ============================================================================
# Catalog
# ============================================================================
@api.get("/categories")
async def list_categories():
    items = await db.categories.find({}, {"_id": 0}).to_list(100)
    return items


@api.get("/plans")
async def list_plans():
    items = await db.plans.find({}, {"_id": 0}).to_list(100)
    return items


@api.get("/categories/{category_id}/exercises")
async def list_exercises(category_id: str):
    items = await db.exercises.find({"category_id": category_id}, {"_id": 0}).to_list(100)
    return items


@api.get("/plans/{plan_id}")
async def get_plan(plan_id: str):
    plan = await db.plans.find_one({"id": plan_id}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    # Build the actual exercise list for this plan from its categories
    exercise_list = []
    target_count = plan.get("exercise_count", 8)
    for cat_id in plan.get("categories", []):
        cat_exercises = await db.exercises.find({"category_id": cat_id}, {"_id": 0}).to_list(100)
        exercise_list.extend(cat_exercises)
        if len(exercise_list) >= target_count:
            break
    plan["exercises"] = exercise_list[:target_count]
    return plan


# ============================================================================
# Progress
# ============================================================================
@api.post("/workouts/log")
async def log_workout(body: WorkoutLogBody, user: dict = Depends(current_user)):
    today = now_utc().date()
    last_date_raw = user.get("last_workout_date")
    if isinstance(last_date_raw, datetime):
        last_date = last_date_raw.date()
    else:
        last_date = None

    streak = user.get("streak", 0)
    if last_date is None:
        streak = 1
    elif last_date == today:
        pass  # same day, no streak change
    elif (today - last_date).days == 1:
        streak += 1
    else:
        streak = 1

    log_entry = {
        "log_id": f"log_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        "plan_id": body.plan_id,
        "category_id": body.category_id,
        "duration_sec": body.duration_sec,
        "calories": body.calories,
        "exercises_completed": body.exercises_completed,
        "created_at": now_utc(),
    }
    await db.workout_logs.insert_one(log_entry)
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {
            "$set": {"streak": streak, "last_workout_date": datetime.combine(today, datetime.min.time(), tzinfo=timezone.utc)},
            "$inc": {"total_workouts": 1},
        },
    )
    return {"ok": True, "streak": streak}


@api.get("/workouts/history")
async def workout_history(user: dict = Depends(current_user)):
    logs = await db.workout_logs.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(200)
    # Serialize datetimes
    for l in logs:
        if isinstance(l.get("created_at"), datetime):
            l["created_at"] = l["created_at"].isoformat()
    return logs


@api.get("/workouts/stats")
async def workout_stats(user: dict = Depends(current_user)):
    total_logs = await db.workout_logs.count_documents({"user_id": user["user_id"]})
    pipeline = [
        {"$match": {"user_id": user["user_id"]}},
        {"$group": {
            "_id": None,
            "total_minutes": {"$sum": {"$divide": ["$duration_sec", 60]}},
            "total_calories": {"$sum": "$calories"},
        }},
    ]
    agg = await db.workout_logs.aggregate(pipeline).to_list(1)
    minutes = int(agg[0]["total_minutes"]) if agg else 0
    calories = int(agg[0]["total_calories"]) if agg else 0
    return {
        "streak": user.get("streak", 0),
        "total_workouts": total_logs,
        "total_minutes": minutes,
        "total_calories": calories,
    }


# ============================================================================
# Stripe Premium
# ============================================================================
@api.post("/stripe/create-payment-sheet")
async def create_payment_sheet(user: dict = Depends(current_user)):
    if not stripe.api_key:
        raise HTTPException(status_code=500, detail="Stripe not configured")

    customer_id = user.get("stripe_customer_id")
    if not customer_id:
        customer = stripe.Customer.create(
            email=user["email"],
            metadata={"user_id": user["user_id"]},
        )
        customer_id = customer.id
        await db.users.update_one(
            {"user_id": user["user_id"]},
            {"$set": {"stripe_customer_id": customer_id}},
        )

    ephemeral_key = stripe.EphemeralKey.create(
        customer=customer_id,
        stripe_version="2023-10-16",
    )

    intent = stripe.PaymentIntent.create(
        amount=int(PREMIUM_PRICE_USD * 100),
        currency="usd",
        customer=customer_id,
        metadata={"user_id": user["user_id"], "product": "lifetime_premium"},
        automatic_payment_methods={"enabled": True},
    )

    return {
        "paymentIntent": intent.client_secret,
        "ephemeralKey": ephemeral_key.secret,
        "customer": customer_id,
        "publishableKey": os.environ.get("EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY", "pk_test_emergent"),
        "amount": PREMIUM_PRICE_USD,
    }


@api.post("/stripe/confirm-premium")
async def confirm_premium(user: dict = Depends(current_user)):
    """Client-side confirmation fallback: mark user premium after successful payment.
    In production, webhook is the source of truth."""
    if not stripe.api_key:
        raise HTTPException(status_code=500, detail="Stripe not configured")

    customer_id = user.get("stripe_customer_id")
    if not customer_id:
        raise HTTPException(status_code=400, detail="No stripe customer for user")

    intents = stripe.PaymentIntent.list(customer=customer_id, limit=5)
    for pi in intents.data:
        if pi.status == "succeeded":
            await db.users.update_one(
                {"user_id": user["user_id"]},
                {"$set": {"is_premium": True}},
            )
            return {"is_premium": True}
    raise HTTPException(status_code=400, detail="No successful payment found")


@app.post("/api/stripe/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        if STRIPE_WEBHOOK_SECRET:
            event = stripe.Webhook.construct_event(payload, sig, STRIPE_WEBHOOK_SECRET)
        else:
            event = stripe.Event.construct_from(__import__("json").loads(payload), stripe.api_key)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Bad webhook: {e}")

    if event["type"] in ("payment_intent.succeeded", "invoice.payment_succeeded"):
        obj = event["data"]["object"]
        customer_id = obj.get("customer")
        if customer_id:
            await db.users.update_one(
                {"stripe_customer_id": customer_id},
                {"$set": {"is_premium": True}},
            )
    return {"received": True}


@api.get("/")
async def root():
    return {"status": "ok", "service": "limitless-home-workout"}


# ============================================================================
# Mount
# ============================================================================
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
