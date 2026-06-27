"""End-to-end backend tests for Limitless Home Workout API."""
import os
import uuid
import time
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://gym-at-home-10.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def auth(session):
    """Create a fresh user and yield (token, user, headers)."""
    email = f"test_{uuid.uuid4().hex[:8]}@limitless.app"
    password = "Test1234!"
    r = session.post(f"{API}/auth/signup", json={"email": email, "password": password, "name": "TEST User"})
    assert r.status_code == 200, r.text
    data = r.json()
    token = data["token"]
    return {
        "token": token,
        "email": email,
        "password": password,
        "user": data["user"],
        "headers": {"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    }


# --------- Health ---------
class TestHealth:
    def test_root(self, session):
        r = session.get(f"{API}/")
        assert r.status_code == 200
        assert r.json().get("status") == "ok"


# --------- Auth ---------
class TestAuth:
    def test_signup_returns_token_and_user(self, auth):
        assert auth["token"]
        assert auth["user"]["email"] == auth["email"]
        assert auth["user"]["user_id"].startswith("user_")
        assert auth["user"]["is_premium"] is False

    def test_signup_duplicate_email(self, session, auth):
        r = session.post(f"{API}/auth/signup", json={"email": auth["email"], "password": "x", "name": "x"})
        assert r.status_code == 400

    def test_login_success(self, session, auth):
        r = session.post(f"{API}/auth/login", json={"email": auth["email"], "password": auth["password"]})
        assert r.status_code == 200
        body = r.json()
        assert "token" in body
        assert body["user"]["email"] == auth["email"]

    def test_login_wrong_password(self, session, auth):
        r = session.post(f"{API}/auth/login", json={"email": auth["email"], "password": "WRONG"})
        assert r.status_code == 401

    def test_login_unknown_email(self, session):
        r = session.post(f"{API}/auth/login", json={"email": f"nope_{uuid.uuid4().hex[:6]}@x.com", "password": "x"})
        assert r.status_code == 401

    def test_me_with_token(self, session, auth):
        r = session.get(f"{API}/auth/me", headers=auth["headers"])
        assert r.status_code == 200
        body = r.json()
        assert body["email"] == auth["email"]

    def test_me_without_token(self, session):
        r = session.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_me_invalid_token(self, session):
        r = session.get(f"{API}/auth/me", headers={"Authorization": "Bearer invalid.token.here"})
        assert r.status_code == 401


# --------- Catalog ---------
class TestCatalog:
    EXPECTED_CATS = {"abs", "arms", "chest", "legs", "shoulders", "full_body", "warm_up", "stretching"}

    def test_categories(self, session):
        r = session.get(f"{API}/categories")
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        ids = {c["id"] for c in items}
        assert self.EXPECTED_CATS.issubset(ids)
        # Spot-check required fields
        for c in items:
            assert "name" in c and "image" in c and "color" in c

    def test_plans_list(self, session):
        r = session.get(f"{API}/plans")
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        assert len(items) == 5
        ids = {p["id"] for p in items}
        assert {"beginner_full", "intermediate_abs", "advanced_strength", "leg_day", "hiit_blast"}.issubset(ids)

    def test_plan_beginner_full_has_exercises(self, session):
        r = session.get(f"{API}/plans/beginner_full")
        assert r.status_code == 200
        plan = r.json()
        assert plan["id"] == "beginner_full"
        assert isinstance(plan.get("exercises"), list)
        assert len(plan["exercises"]) > 0
        ex0 = plan["exercises"][0]
        for k in ("name", "duration", "rest", "lottie", "instructions"):
            assert k in ex0, f"missing {k} on exercise"

    def test_plan_not_found(self, session):
        r = session.get(f"{API}/plans/does_not_exist")
        assert r.status_code == 404

    def test_abs_exercises(self, session):
        r = session.get(f"{API}/categories/abs/exercises")
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 4
        for ex in items:
            assert ex["category_id"] == "abs"
            for k in ("name", "duration", "rest", "lottie", "instructions"):
                assert k in ex


# --------- Workouts ---------
class TestWorkouts:
    def test_log_workout_requires_auth(self, session):
        r = session.post(f"{API}/workouts/log", json={"duration_sec": 600})
        assert r.status_code == 401

    def test_log_workout_and_streak(self, session, auth):
        r = session.post(
            f"{API}/workouts/log",
            json={"plan_id": "beginner_full", "duration_sec": 900, "calories": 120, "exercises_completed": 8},
            headers=auth["headers"],
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["ok"] is True
        assert body["streak"] >= 1

    def test_history(self, session, auth):
        r = session.get(f"{API}/workouts/history", headers=auth["headers"])
        assert r.status_code == 200
        logs = r.json()
        assert isinstance(logs, list)
        assert len(logs) >= 1
        assert logs[0]["user_id"] == auth["user"]["user_id"]

    def test_stats(self, session, auth):
        r = session.get(f"{API}/workouts/stats", headers=auth["headers"])
        assert r.status_code == 200
        s = r.json()
        for k in ("streak", "total_workouts", "total_minutes", "total_calories"):
            assert k in s
        assert s["total_workouts"] >= 1
        assert s["total_minutes"] >= 15  # 900s = 15 min


# --------- Stripe ---------
class TestStripe:
    def test_create_payment_sheet_requires_auth(self, session):
        r = session.post(f"{API}/stripe/create-payment-sheet")
        assert r.status_code == 401

    def test_create_payment_sheet(self, session, auth):
        r = session.post(f"{API}/stripe/create-payment-sheet", headers=auth["headers"])
        # If stripe key is invalid in env, would return 500 — capture explicit failure
        if r.status_code != 200:
            pytest.fail(f"Stripe payment sheet failed: {r.status_code} {r.text}")
        body = r.json()
        for k in ("paymentIntent", "ephemeralKey", "customer", "publishableKey", "amount"):
            assert k in body, f"missing {k}"
        assert body["amount"] == 9.99
