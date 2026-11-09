import base64
import uuid

import pytest
from httpx import ASGITransport, AsyncClient

from backend.app.auth import create_local_jwt
from backend.app.database import init_db
from backend.app.main import app


@pytest.fixture(autouse=True)
def setup_database():
    init_db()


def get_auth_headers(user_id: str, email: str = "test@example.com") -> dict[str, str]:
    token = create_local_jwt(user_id, email)
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.anyio
async def test_user_preferences_default_and_crud():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        uid = f"user_pref_{uuid.uuid4().hex[:8]}"
        headers = get_auth_headers(uid, f"{uid}@test.com")

        # 1. Fetch preferences for new user -> returns sensible defaults
        res = await client.get("/api/user/preferences", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["user_id"] == uid
        assert data["currency"] == "INR"
        assert data["theme_preference"] == "dark"
        assert data["ui_density"] == "comfortable"
        assert data["timezone"] == "Asia/Kolkata"
        assert data["start_day_of_week"] == "Monday"
        assert data["savings_rate_target"] == 20.0
        assert data["enable_confetti"] is True
        assert data["notifications_enabled"] is True

        # 2. Update preferences
        update_payload = {
            "currency": "USD",
            "theme_preference": "light",
            "accent_color": "emerald",
            "ui_density": "compact",
            "timezone": "America/New_York",
            "start_day_of_week": "Sunday",
            "default_transaction_type": "Income",
            "default_category": "Salary",
            "monthly_income_target": 7500.0,
            "monthly_expense_target": 4200.0,
            "savings_rate_target": 35.0,
            "enable_confetti": False,
            "enable_compact_tables": True,
            "quiet_hours_enabled": True,
            "quiet_hours_start": "23:00",
            "quiet_hours_end": "07:30",
        }
        update_res = await client.put("/api/user/preferences", json=update_payload, headers=headers)
        assert update_res.status_code == 200
        updated = update_res.json()
        assert updated["currency"] == "USD"
        assert updated["theme_preference"] == "light"
        assert updated["accent_color"] == "emerald"
        assert updated["ui_density"] == "compact"
        assert updated["density"] == "compact"
        assert updated["timezone"] == "America/New_York"
        assert updated["start_day_of_week"] == "Sunday"
        assert updated["week_start_day"] == "Sunday"
        assert updated["monthly_income_target"] == 7500.0
        assert updated["savings_rate_target"] == 35.0
        assert updated["enable_confetti"] is False
        assert updated["confetti_enabled"] is False
        assert updated["enable_compact_tables"] is True
        assert updated["quiet_hours_enabled"] is True
        assert updated["quiet_hours_start"] == "23:00"
        assert updated["quiet_hours_end"] == "07:30"


@pytest.mark.anyio
async def test_user_preferences_validation_failures():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        uid = f"user_val_{uuid.uuid4().hex[:8]}"
        headers = get_auth_headers(uid, f"{uid}@test.com")

        # Invalid currency
        res1 = await client.put("/api/user/preferences", json={"currency": "JPY"}, headers=headers)
        assert res1.status_code == 422

        # Invalid timezone
        res2 = await client.put("/api/user/preferences", json={"timezone": "Mars/Phobos"}, headers=headers)
        assert res2.status_code == 422

        # Invalid quiet hours format (25:00 is invalid time of day)
        res3 = await client.put("/api/user/preferences", json={"quiet_hours_start": "25:00"}, headers=headers)
        assert res3.status_code == 422

        # Invalid quiet hours format (text)
        res4 = await client.put("/api/user/preferences", json={"quiet_hours_end": "eight_pm"}, headers=headers)
        assert res4.status_code == 422

        # Invalid savings rate target (>100%)
        res5 = await client.put("/api/user/preferences", json={"savings_rate_target": 125.0}, headers=headers)
        assert res5.status_code == 422


@pytest.mark.anyio
async def test_profile_avatar_validation():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        uid = f"user_avatar_{uuid.uuid4().hex[:8]}"
        headers = get_auth_headers(uid, f"{uid}@test.com")

        # Valid small base64 WEBP avatar
        tiny_webp = "data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAQAcJaACdLoAAP7/2wAA"
        res_ok = await client.put("/api/user/profile", json={"avatar_url": tiny_webp, "full_name": "Test User"}, headers=headers)
        assert res_ok.status_code == 200
        assert res_ok.json()["full_name"] == "Test User"

        # Invalid avatar MIME type (gif / executable)
        res_bad_format = await client.put("/api/user/profile", json={"avatar_url": "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"}, headers=headers)
        assert res_bad_format.status_code == 422

        # Oversized avatar (> 2MB binary)
        huge_bytes = b"0" * (2 * 1024 * 1024 + 100)
        huge_base64 = f"data:image/jpeg;base64,{base64.b64encode(huge_bytes).decode('ascii')}"
        res_too_large = await client.put("/api/user/profile", json={"avatar_url": huge_base64}, headers=headers)
        assert res_too_large.status_code == 422


@pytest.mark.anyio
async def test_csv_export_headers_and_isolation():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        uid_a = f"user_exp_a_{uuid.uuid4().hex[:8]}"
        uid_b = f"user_exp_b_{uuid.uuid4().hex[:8]}"
        headers_a = get_auth_headers(uid_a, f"{uid_a}@test.com")
        headers_b = get_auth_headers(uid_b, f"{uid_b}@test.com")

        # Add transaction for User A
        await client.post(
            "/api/transactions",
            json={
                "date": "2026-11-05",
                "transaction_type": "Expense",
                "category": "Food",
                "amount": 450.0,
                "payment_mode": "UPI",
                "location": "Bangalore",
                "notes": "Secret lunch meeting for User A",
            },
            headers=headers_a,
        )

        # Export User A CSV
        res_a = await client.get("/api/export/transactions/csv", headers=headers_a)
        assert res_a.status_code == 200
        csv_text_a = res_a.text
        lines_a = [line.strip() for line in csv_text_a.strip().split("\n") if line.strip()]
        assert "transaction_id,date,transaction_type,category,amount,payment_mode,location,notes,tags,created_at,updated_at" in lines_a[0]
        assert "Secret lunch meeting for User A" in csv_text_a

        # Export User B CSV -> Multi-tenant isolation: User B must not see User A's data
        res_b = await client.get("/api/export/transactions/csv", headers=headers_b)
        assert res_b.status_code == 200
        assert "Secret lunch meeting for User A" not in res_b.text


@pytest.mark.anyio
async def test_json_export_and_secrets_exclusion():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        uid = f"user_json_{uuid.uuid4().hex[:8]}"
        headers = get_auth_headers(uid, f"{uid}@test.com")

        res = await client.get("/api/export/all/json", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["schema_version"] == "1.0.0"
        assert "generated_at" in data
        assert data["user_id"] == uid
        assert "transactions" in data
        assert "budgets" in data
        assert "goals" in data

        # Ensure no secrets or passwords leaked in export
        raw_text = res.text.lower()
        assert "password" not in raw_text
        assert "jwt_secret" not in raw_text
        assert "service_role" not in raw_text


@pytest.mark.anyio
async def test_csv_template_and_import_with_duplicates():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        uid = f"user_imp_{uuid.uuid4().hex[:8]}"
        headers = get_auth_headers(uid, f"{uid}@test.com")

        # 1. Download sample template
        tmpl_res = await client.get("/api/export/template/transactions-csv")
        assert tmpl_res.status_code == 200
        assert "date,transaction_type,category,amount,payment_mode,location,notes,tags" in tmpl_res.text

        # 2. Import CSV data
        csv_sample = (
            "date,transaction_type,category,amount,payment_mode,location,notes,tags\n"
            "2026-11-01,Expense,Food,300.0,UPI,Bangalore,Coffee with team,coffee\n"
            "2026-11-02,Expense,Groceries,1200.0,Credit Card,Bangalore,Supermarket,groceries\n"
            "2026-11-03,Expense,Travel,invalid_amount,UPI,Bangalore,Auto ride,travel\n"
        )
        import_res = await client.post(
            "/api/import/transactions/csv",
            json={"csv_text": csv_sample},
            headers=headers,
        )
        assert import_res.status_code == 200
        summary = import_res.json()
        assert summary["success"] is True
        assert summary["imported"] == 2
        assert summary["skipped"] >= 1
        assert len(summary["errors"]) >= 1

        # 3. Duplicate detection test: Re-importing same batch should skip duplicates
        reimport_res = await client.post(
            "/api/import/transactions/csv",
            json={"csv_text": csv_sample},
            headers=headers,
        )
        assert reimport_res.status_code == 200
        re_summary = reimport_res.json()
        assert re_summary["duplicates"] == 2
        assert re_summary["imported"] == 0


@pytest.mark.anyio
async def test_reset_demo_data_phrase_requirement():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        uid = f"user_reset_{uuid.uuid4().hex[:8]}"
        headers = get_auth_headers(uid, f"{uid}@test.com")

        # Missing confirmation phrase -> 400
        bad_res = await client.post("/api/user/reset-demo", json={"confirmation": "wrong phrase"}, headers=headers)
        assert bad_res.status_code == 400

        # Valid confirmation phrase -> 200 and reseeds demo
        good_res = await client.post(
            "/api/user/reset-demo?confirmation=RESET DEMO DATA",
            headers=headers,
        )
        assert good_res.status_code == 200
        assert good_res.json()["success"] is True


@pytest.mark.anyio
async def test_account_deletion_two_step_confirmation():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        uid = f"user_del_{uuid.uuid4().hex[:8]}"
        headers = get_auth_headers(uid, f"{uid}@test.com")

        # Create sample data for user
        await client.post(
            "/api/transactions",
            json={
                "date": "2026-11-06",
                "transaction_type": "Income",
                "category": "Salary",
                "amount": 50000.0,
                "payment_mode": "Bank Transfer",
                "location": "Bangalore",
            },
            headers=headers,
        )

        # 1. Deletion without confirmation fails
        fail1 = await client.delete("/api/user/account", headers=headers)
        assert fail1.status_code == 400

        # 2. Deletion with wrong phrase fails
        fail2 = await client.delete(
            "/api/user/account?confirmation=wrong&confirm=true",
            headers=headers,
        )
        assert fail2.status_code == 400

        # 3. Valid two-step confirmation succeeds and cascade-deletes all user data
        success = await client.delete(
            "/api/user/account?confirmation=DELETE MY ACCOUNT&confirm=true",
            headers=headers,
        )
        assert success.status_code == 200
        assert success.json()["success"] is True

        # Verify transactions are completely gone
        tx_check = await client.get("/api/transactions", headers=headers)
        assert tx_check.status_code == 200
        assert tx_check.json()["transactions"] == []


@pytest.mark.anyio
async def test_system_info_and_printable_report():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        uid = f"user_sys_{uuid.uuid4().hex[:8]}"
        headers = get_auth_headers(uid, f"{uid}@test.com")

        # System info check
        sys_res = await client.get("/api/system/info")
        assert sys_res.status_code == 200
        sys_data = sys_res.json()
        assert sys_data["version"] == "2.4.0"
        assert sys_data["status"] == "healthy"
        assert sys_data["held_out_model_accuracy"] == "Held-out test accuracy: 95.83% on 240 unseen rows."
        assert "jwt_secret" not in sys_res.text.lower()

        # Printable report check
        rep_res = await client.get("/api/reports/printable", headers=headers)
        assert rep_res.status_code == 200
        rep_data = rep_res.json()
        assert "report_title" in rep_data
        assert "summary" in rep_data
        assert "category_breakdown" in rep_data
        assert "active_budgets" in rep_data


@pytest.mark.anyio
async def test_user_preferences_multi_user_isolation():
    """Verify that User B cannot access or modify User A's preferences."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        uid_alice = f"user_alice_{uuid.uuid4().hex[:8]}"
        uid_bob = f"user_bob_{uuid.uuid4().hex[:8]}"
        headers_alice = get_auth_headers(uid_alice, "alice@test.com")
        headers_bob = get_auth_headers(uid_bob, "bob@test.com")

        # Alice configures custom preferences: USD, compact, emerald, 35% savings rate
        alice_payload = {
            "currency": "USD",
            "ui_density": "compact",
            "accent_color": "emerald",
            "savings_rate_target": 35.0,
            "monthly_income_target": 95000.0,
        }
        res_alice_put = await client.put("/api/user/preferences", json=alice_payload, headers=headers_alice)
        assert res_alice_put.status_code == 200

        # Bob requests his preferences -> Must return Bob's default preferences, NOT Alice's
        res_bob_get = await client.get("/api/user/preferences", headers=headers_bob)
        assert res_bob_get.status_code == 200
        bob_prefs = res_bob_get.json()
        assert bob_prefs["user_id"] == uid_bob
        assert bob_prefs["currency"] == "INR"  # Bob's default, not Alice's USD
        assert bob_prefs["ui_density"] == "comfortable"
        assert bob_prefs["accent_color"] == "indigo"
        assert bob_prefs["savings_rate_target"] == 20.0

        # Bob updates his preferences to EUR, rose, 50% savings rate
        bob_payload = {
            "currency": "EUR",
            "accent_color": "rose",
            "savings_rate_target": 50.0,
        }
        res_bob_put = await client.put("/api/user/preferences", json=bob_payload, headers=headers_bob)
        assert res_bob_put.status_code == 200

        # Alice requests her preferences again -> Alice's preferences remain completely unaltered
        res_alice_get = await client.get("/api/user/preferences", headers=headers_alice)
        assert res_alice_get.status_code == 200
        alice_prefs = res_alice_get.json()
        assert alice_prefs["user_id"] == uid_alice
        assert alice_prefs["currency"] == "USD"
        assert alice_prefs["accent_color"] == "emerald"
        assert alice_prefs["ui_density"] == "compact"
        assert alice_prefs["savings_rate_target"] == 35.0
        assert alice_prefs["monthly_income_target"] == 95000.0


@pytest.mark.anyio
async def test_user_preferences_persistence_across_sessions():
    """Verify that preferences persist in the database after logout and subsequent login."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        uid = f"user_sess_{uuid.uuid4().hex[:8]}"
        email = f"{uid}@test.com"

        # Session 1: User logs in (issues JWT 1)
        token_session_1 = create_local_jwt(uid, email)
        headers_session_1 = {"Authorization": f"Bearer {token_session_1}"}

        # User customizes multiple preference fields
        prefs_payload = {
            "currency": "GBP",
            "theme_preference": "light",
            "accent_color": "violet",
            "ui_density": "compact",
            "timezone": "Europe/London",
            "start_day_of_week": "Sunday",
            "default_transaction_type": "Income",
            "default_category": "Salary",
            "monthly_income_target": 8000.0,
            "monthly_expense_target": 4500.0,
            "savings_rate_target": 43.75,
            "quiet_hours_enabled": True,
            "quiet_hours_start": "22:15",
            "quiet_hours_end": "06:45",
        }
        put_res = await client.put("/api/user/preferences", json=prefs_payload, headers=headers_session_1)
        assert put_res.status_code == 200

        # Simulate user logout: Session 1 token is discarded
        del headers_session_1
        del token_session_1

        # Session 2: User logs in again later (new distinct JWT issued)
        token_session_2 = create_local_jwt(uid, email)
        headers_session_2 = {"Authorization": f"Bearer {token_session_2}"}

        # User fetches preferences in Session 2
        get_res = await client.get("/api/user/preferences", headers=headers_session_2)
        assert get_res.status_code == 200
        data = get_res.json()

        # All preferences persisted faithfully in the database
        assert data["user_id"] == uid
        assert data["currency"] == "GBP"
        assert data["theme_preference"] == "light"
        assert data["accent_color"] == "violet"
        assert data["ui_density"] == "compact"
        assert data["timezone"] == "Europe/London"
        assert data["start_day_of_week"] == "Sunday"
        assert data["default_transaction_type"] == "Income"
        assert data["default_category"] == "Salary"
        assert data["monthly_income_target"] == 8000.0
        assert data["monthly_expense_target"] == 4500.0
        assert data["savings_rate_target"] == 43.75
        assert data["quiet_hours_enabled"] is True
        assert data["quiet_hours_start"] == "22:15"
        assert data["quiet_hours_end"] == "06:45"
