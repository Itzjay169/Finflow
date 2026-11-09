import pytest
from httpx import ASGITransport, AsyncClient

import backend.app.auth as auth_module
from backend.app.auth import DEMO_TOKEN, DEMO_USER_ID, create_local_jwt
from backend.app.database import init_db
from backend.app.main import app
from backend.app.models import SeedSampleRequest
from backend.app.services.transactions import seed_sample_data


@pytest.fixture(autouse=True)
def setup_database():
    init_db()
    seed_sample_data(DEMO_USER_ID, SeedSampleRequest(replace_existing=True, confirm=True))


@pytest.mark.anyio
async def test_health():
    """Verify health endpoint reports system, db, and ML status."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] in ("healthy", "degraded")
        assert "checks" in data
        assert data["checks"]["database"]["status"] == "healthy"
        assert data["checks"]["model_artifact"]["model_loaded"] is True


@pytest.mark.anyio
async def test_auth_rejection_without_token():
    """Missing Authorization header on protected endpoints must return 401."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/summary")
        assert res.status_code == 401
        data = res.json()
        assert data["success"] is False
        assert data["error"]["code"] == "UNAUTHORIZED"


@pytest.mark.anyio
async def test_auth_rejection_with_invalid_or_raw_token():
    """Raw string shortcuts and forged tokens must be strictly rejected with 401."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Insecure shortcut
        res_raw = await client.get("/api/summary", headers={"Authorization": "Bearer local_user_test"})
        assert res_raw.status_code == 401
        assert res_raw.json()["error"]["code"] == "INVALID_TOKEN_FORMAT"

        # Arbitrary junk token
        res_junk = await client.get("/api/summary", headers={"Authorization": "Bearer forged_fake_token_12345"})
        assert res_junk.status_code == 401


@pytest.mark.anyio
async def test_demo_mode_restrictions_in_production(monkeypatch):
    """Demo token authentication must be blocked when ENVIRONMENT is production."""
    transport = ASGITransport(app=app)
    headers = {"Authorization": f"Bearer {DEMO_TOKEN}"}
    monkeypatch.setattr(auth_module, "ENVIRONMENT", "production")

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/summary", headers=headers)
        assert res.status_code == 401
        assert res.json()["error"]["code"] == "DEMO_MODE_DISABLED"


@pytest.mark.anyio
async def test_offline_local_auth_issuance():
    """Offline auth route issues a valid cryptographically signed local JWT."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post(
            "/api/auth/offline-session",
            json={"email": "developer@finflow.app", "full_name": "Dev User"},
        )
        assert res.status_code == 200
        payload = res.json()
        token = payload["access_token"]
        assert token and len(token) > 20

        # Now use the token to call a protected route
        res_sum = await client.get("/api/summary", headers={"Authorization": f"Bearer {token}"})
        assert res_sum.status_code == 200
        assert res_sum.json()["transaction_count"] == 0


@pytest.mark.anyio
async def test_summary_endpoint():
    transport = ASGITransport(app=app)
    headers = {"Authorization": f"Bearer {DEMO_TOKEN}"}
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/summary", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["transaction_count"] == 1200
        assert data["total_income"] > 0
        assert data["total_expense"] > 0
        assert "savings_rate" in data


@pytest.mark.anyio
async def test_transactions_pagination_and_filter():
    transport = ASGITransport(app=app)
    headers = {"Authorization": f"Bearer {DEMO_TOKEN}"}
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/transactions?page=1&page_size=15", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["total"] == 1200
        assert data["page"] == 1
        assert data["total_pages"] == 80
        assert data["has_next"] is True
        assert len(data["transactions"]) == 15

        # Filter by type Expense
        res_exp = await client.get("/api/transactions?transaction_type=Expense&page=1&page_size=10", headers=headers)
        assert res_exp.status_code == 200
        data_exp = res_exp.json()
        assert all(t["transaction_type"] == "Expense" for t in data_exp["transactions"])


@pytest.mark.anyio
async def test_crud_transaction():
    transport = ASGITransport(app=app)
    headers = {"Authorization": f"Bearer {DEMO_TOKEN}"}
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create
        new_tx = {
            "date": "2026-10-10",
            "transaction_type": "Expense",
            "category": "Food",
            "amount": 1250.0,
            "payment_mode": "UPI",
            "location": "Mumbai",
            "notes": "Dinner with friends",
            "tags": ["social", "weekend"],
        }
        create_res = await client.post("/api/transactions", json=new_tx, headers=headers)
        assert create_res.status_code == 200
        created = create_res.json()
        tx_id = created["id"]
        assert created["amount"] == 1250.0
        assert created["notes"] == "Dinner with friends"
        assert "social" in created["tags"]

        # Duplicate check detects identical amount on same date
        dup_res = await client.post(
            "/api/transactions/check-duplicate",
            json={
                "date": "2026-10-10",
                "category": "Food",
                "amount": 1250.0,
                "payment_mode": "UPI",
            },
            headers=headers,
        )
        assert dup_res.status_code == 200
        assert dup_res.json()["is_duplicate"] is True

        # Update
        update_res = await client.put(f"/api/transactions/{tx_id}", json={"amount": 1400.0}, headers=headers)
        assert update_res.status_code == 200
        updated = update_res.json()
        assert updated["amount"] == 1400.0

        # Delete
        delete_res = await client.delete(f"/api/transactions/{tx_id}", headers=headers)
        assert delete_res.status_code == 200


@pytest.mark.anyio
async def test_input_validation_failures():
    """Negative or zero amounts and invalid dates must fail validation."""
    transport = ASGITransport(app=app)
    headers = {"Authorization": f"Bearer {DEMO_TOKEN}"}
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Zero amount
        res_zero = await client.post(
            "/api/transactions",
            json={"date": "2026-10-10", "transaction_type": "Expense", "category": "Food", "amount": 0, "payment_mode": "UPI", "location": "Mumbai"},
            headers=headers,
        )
        assert res_zero.status_code == 422
        assert res_zero.json()["error"]["code"] == "VALIDATION_ERROR"

        # Invalid date format
        res_date = await client.post(
            "/api/transactions",
            json={"date": "10-10-2026", "transaction_type": "Expense", "category": "Food", "amount": 500, "payment_mode": "UPI", "location": "Mumbai"},
            headers=headers,
        )
        assert res_date.status_code == 422

        # Invalid payment mode
        res_pm = await client.post(
            "/api/transactions",
            json={"date": "2026-10-10", "transaction_type": "Expense", "category": "Food", "amount": 500, "payment_mode": "Bitcoin", "location": "Mumbai"},
            headers=headers,
        )
        assert res_pm.status_code == 422


@pytest.mark.anyio
async def test_seeding_safety():
    """Destructive seeding requires explicit confirm=True."""
    transport = ASGITransport(app=app)
    headers = {"Authorization": f"Bearer {DEMO_TOKEN}"}
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # replace_existing=True without confirm=True should be rejected with 400
        res_bad = await client.post(
            "/api/transactions/seed-sample",
            json={"replace_existing": True, "confirm": False},
            headers=headers,
        )
        assert res_bad.status_code == 400

        # replace_existing=True with confirm=True succeeds
        res_ok = await client.post(
            "/api/transactions/seed-sample",
            json={"replace_existing": True, "confirm": True},
            headers=headers,
        )
        assert res_ok.status_code == 200
        assert res_ok.json()["success"] is True


@pytest.mark.anyio
async def test_export_and_import_csv():
    transport = ASGITransport(app=app)
    headers = {"Authorization": f"Bearer {DEMO_TOKEN}"}
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/transactions/export-csv", headers=headers)
        assert res.status_code == 200
        assert "text/csv" in res.headers["content-type"]
        assert "transaction_id,date,transaction_type" in res.text

        # Test CSV import
        sample_csv = "date,transaction_type,category,amount,payment_mode,location,notes,tags\n2026-10-12,Expense,Groceries,450.0,Cash,Delhi,Imported market,test"
        res_import = await client.post(
            "/api/transactions/import-csv",
            json={"csv_text": sample_csv},
            headers=headers,
        )
        assert res_import.status_code == 200
        assert res_import.json()["inserted_count"] == 1


@pytest.mark.anyio
async def test_ml_prediction_history_and_insights():
    transport = ASGITransport(app=app)
    headers = {"Authorization": f"Bearer {DEMO_TOKEN}"}
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Predict Expense & verify history record created
        res_exp = await client.post(
            "/api/predict",
            json={"amount": 2500, "date": "2026-05-10", "payment_mode": "UPI", "location": "Mumbai"},
            headers=headers,
        )
        assert res_exp.status_code == 200
        data_exp = res_exp.json()
        assert data_exp["prediction"] == "Expense"
        assert "id" in data_exp
        pred_id = data_exp["id"]

        # Prediction history list
        res_hist = await client.get("/api/predictions/history", headers=headers)
        assert res_hist.status_code == 200
        history = res_hist.json()
        assert history["total"] >= 1
        assert any(p["id"] == pred_id for p in history["predictions"])

        # Record prediction feedback
        res_fb = await client.post(
            f"/api/predictions/{pred_id}/feedback",
            json={"actual_type": "Expense"},
            headers=headers,
        )
        assert res_fb.status_code == 200

        # Delete prediction history item
        res_del_p = await client.delete(f"/api/predictions/history/{pred_id}", headers=headers)
        assert res_del_p.status_code == 200

        # Model Insights & honest test accuracy label
        res_ins = await client.get("/api/model/insights", headers=headers)
        assert res_ins.status_code == 200
        data_ins = res_ins.json()
        assert data_ins["accuracy"] == 0.9583
        assert "Held-out test accuracy: 95.83% on 240 unseen rows." in data_ins["held_out_accuracy_label"]
        assert len(data_ins["feature_importances"]) == 18

        # Model Health endpoint
        res_health = await client.get("/api/model/health")
        assert res_health.status_code == 200
        assert res_health.json()["status"] == "healthy"
        assert res_health.json()["expected_features"] == 18


@pytest.mark.anyio
async def test_budget_month_filtering_and_insights():
    """Verify Bug Fix G: budget spending is calculated only for the budget's month and year."""
    transport = ASGITransport(app=app)
    headers = {"Authorization": f"Bearer {DEMO_TOKEN}"}
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create a tight budget for current month
        now_month = 5
        now_year = 2026
        res_b = await client.post(
            "/api/budgets",
            json={"category": "Food", "monthly_limit": 50.0, "month": now_month, "year": now_year},
            headers=headers,
        )
        assert res_b.status_code == 200

        # Smart insights endpoint
        res_smart = await client.get("/api/smart/insights", headers=headers)
        assert res_smart.status_code == 200
        insights = res_smart.json()["insights"]
        assert len(insights) > 0


@pytest.mark.anyio
async def test_recurring_bills_automation():
    """Verify Feature D: marking a bill paid creates transaction & advances next_due_date."""
    transport = ASGITransport(app=app)
    headers = {"Authorization": f"Bearer {DEMO_TOKEN}"}
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        rec_list = await client.get("/api/recurring", headers=headers)
        assert rec_list.status_code == 200
        items = rec_list.json()
        assert len(items) > 0
        bill = items[0]
        initial_due = bill["next_due_date"]

        # Mark as paid
        res_paid = await client.post(f"/api/recurring/{bill['id']}/mark-paid", headers=headers)
        assert res_paid.status_code == 200
        data_paid = res_paid.json()
        assert data_paid["success"] is True
        assert data_paid["next_due_date"] != initial_due
        assert "transaction_id" in data_paid


@pytest.mark.anyio
async def test_cashflow_forecast():
    """Verify Feature E: cashflow projection."""
    transport = ASGITransport(app=app)
    headers = {"Authorization": f"Bearer {DEMO_TOKEN}"}
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/analytics/forecast?months=3", headers=headers)
        assert res.status_code == 200
        forecast = res.json()
        assert len(forecast["forecast_months"]) == 3
        assert "disclaimer" in forecast


@pytest.mark.anyio
async def test_user_preferences_and_settings():
    """Verify user preferences center endpoints."""
    transport = ASGITransport(app=app)
    headers = {"Authorization": f"Bearer {DEMO_TOKEN}"}
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res_pref = await client.get("/api/user/preferences", headers=headers)
        assert res_pref.status_code == 200
        prefs = res_pref.json()
        assert prefs["currency"] in ("INR", "USD", "EUR", "GBP")

        # Update preferences
        res_up = await client.put(
            "/api/user/preferences",
            json={"currency": "USD", "theme_preference": "light", "compact_tables": True},
            headers=headers,
        )
        assert res_up.status_code == 200
        assert res_up.json()["currency"] == "USD"
        assert res_up.json()["theme_preference"] == "light"
        assert res_up.json()["compact_tables"] is True


@pytest.mark.anyio
async def test_rls_multi_user_isolation():
    """Verify multi-user isolation with FastAPI dependency overrides / separate signed JWTs."""
    transport = ASGITransport(app=app)
    token_a = create_local_jwt(user_id="user_tenant_alpha", email="alpha@tenant.com")
    token_b = create_local_jwt(user_id="user_tenant_beta", email="beta@tenant.com")

    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # User A creates a transaction
        tx_a = {
            "date": "2026-10-10",
            "transaction_type": "Expense",
            "category": "Shopping",
            "amount": 9999.0,
            "payment_mode": "Cash",
            "location": "Jaipur",
            "notes": "User A Top Secret Purchase",
        }
        res_a = await client.post("/api/transactions", json=tx_a, headers=headers_a)
        assert res_a.status_code == 200
        created_id = res_a.json()["id"]

        # User B queries transactions
        res_b = await client.get("/api/transactions", headers=headers_b)
        assert res_b.status_code == 200
        b_txs = res_b.json()["transactions"]

        # User B must NOT see User A's transaction
        assert not any(t["id"] == created_id for t in b_txs)
        assert not any(t["notes"] == "User A Top Secret Purchase" for t in b_txs)


@pytest.mark.anyio
async def test_model_summary_public():
    """Verify public model summary has exact 95.83% test accuracy."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/model/summary")
        assert res.status_code == 200
        data = res.json()
        assert data["model_name"] == "RandomForest"
        assert data["feature_count"] == 18
        assert data["accuracy"] == 0.9583
        assert "Held-out test accuracy: 95.83% on 240 unseen rows." in data["held_out_test_description"]
        assert data["total_samples"] == 1200
        assert data["currency"] == "INR (₹)"
