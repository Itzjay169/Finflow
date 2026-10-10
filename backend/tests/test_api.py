import pytest
from httpx import ASGITransport, AsyncClient

from backend.app.auth import DEMO_USER_ID
from backend.app.database import init_db
from backend.app.main import app
from backend.app.services.transactions import seed_sample_data


@pytest.fixture(autouse=True)
def setup_database():
    init_db()
    seed_sample_data(DEMO_USER_ID)

@pytest.mark.anyio
async def test_health():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "healthy"
        assert data["model_available"] is True

@pytest.mark.anyio
async def test_summary_endpoint():
    transport = ASGITransport(app=app)
    headers = {"Authorization": "Bearer finflow_demo_jwt_token_2026"}
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
    headers = {"Authorization": "Bearer finflow_demo_jwt_token_2026"}
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Default page
        res = await client.get("/api/transactions?page=1&page_size=15", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["total"] == 1200
        assert len(data["transactions"]) == 15

        # Filter by type Expense
        res_exp = await client.get("/api/transactions?transaction_type=Expense&page=1&page_size=10", headers=headers)
        assert res_exp.status_code == 200
        data_exp = res_exp.json()
        assert all(t["transaction_type"] == "Expense" for t in data_exp["transactions"])

@pytest.mark.anyio
async def test_crud_transaction():
    transport = ASGITransport(app=app)
    headers = {"Authorization": "Bearer finflow_demo_jwt_token_2026"}
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
        }
        create_res = await client.post("/api/transactions", json=new_tx, headers=headers)
        assert create_res.status_code == 200
        created = create_res.json()
        tx_id = created["id"]
        assert created["amount"] == 1250.0
        assert created["notes"] == "Dinner with friends"

        # Update
        update_res = await client.put(f"/api/transactions/{tx_id}", json={"amount": 1400.0}, headers=headers)
        assert update_res.status_code == 200
        updated = update_res.json()
        assert updated["amount"] == 1400.0

        # Delete
        delete_res = await client.delete(f"/api/transactions/{tx_id}", headers=headers)
        assert delete_res.status_code == 200

@pytest.mark.anyio
async def test_analytics_endpoints():
    transport = ASGITransport(app=app)
    headers = {"Authorization": "Bearer finflow_demo_jwt_token_2026"}
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res_monthly = await client.get("/api/analytics/monthly", headers=headers)
        assert res_monthly.status_code == 200
        assert len(res_monthly.json()) > 0

        res_cat = await client.get("/api/analytics/category", headers=headers)
        assert res_cat.status_code == 200
        assert len(res_cat.json()) > 0

        res_pm = await client.get("/api/analytics/payment-mode", headers=headers)
        assert res_pm.status_code == 200
        assert len(res_pm.json()) > 0

        res_loc = await client.get("/api/analytics/location", headers=headers)
        assert res_loc.status_code == 200
        assert len(res_loc.json()) > 0

        res_trends = await client.get("/api/analytics/trends", headers=headers)
        assert res_trends.status_code == 200
        assert "income_mom_pct" in res_trends.json()

@pytest.mark.anyio
async def test_export_csv():
    transport = ASGITransport(app=app)
    headers = {"Authorization": "Bearer finflow_demo_jwt_token_2026"}
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/transactions/export-csv", headers=headers)
        assert res.status_code == 200
        assert "text/csv" in res.headers["content-type"]
        assert "transaction_id,date,transaction_type" in res.text

@pytest.mark.anyio
async def test_ml_prediction_and_insights():
    transport = ASGITransport(app=app)
    headers = {"Authorization": "Bearer finflow_demo_jwt_token_2026"}
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Predict Expense
        res_exp = await client.post(
            "/api/predict",
            json={"amount": 2500, "date": "2026-05-10", "payment_mode": "UPI", "location": "Mumbai"},
            headers=headers,
        )
        assert res_exp.status_code == 200
        data_exp = res_exp.json()
        assert data_exp["prediction"] == "Expense"
        assert data_exp["confidence"] >= 0.8
        assert data_exp["expense_probability"] >= 0.8

        # 2. Predict Income
        res_inc = await client.post(
            "/api/predict",
            json={"amount": 80000, "date": "2026-05-01", "payment_mode": "Net Banking", "location": "Bangalore"},
            headers=headers,
        )
        assert res_inc.status_code == 200
        data_inc = res_inc.json()
        assert data_inc["prediction"] == "Income"
        assert data_inc["confidence"] >= 0.8

        # 3. Model Insights
        res_ins = await client.get("/api/model/insights", headers=headers)
        assert res_ins.status_code == 200
        data_ins = res_ins.json()
        assert data_ins["accuracy"] >= 0.95
        assert len(data_ins["feature_importances"]) > 0
        assert len(data_ins["confusion_matrix"]) == 2

@pytest.mark.anyio
async def test_budgets_goals_and_recurring():
    transport = ASGITransport(app=app)
    headers = {"Authorization": "Bearer finflow_demo_jwt_token_2026"}
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Budgets
        res_b = await client.get("/api/budgets", headers=headers)
        assert res_b.status_code == 200
        assert len(res_b.json()) > 0

        # Goals
        res_g = await client.get("/api/goals", headers=headers)
        assert res_g.status_code == 200
        goals = res_g.json()
        assert len(goals) > 0
        g_id = goals[0]["id"]

        # Contribute to goal
        res_c = await client.post(f"/api/goals/{g_id}/contribute", json={"amount": 2000}, headers=headers)
        assert res_c.status_code == 200
        assert res_c.json()["current_amount"] > goals[0]["current_amount"]

        # Recurring
        res_r = await client.get("/api/recurring", headers=headers)
        assert res_r.status_code == 200
        assert len(res_r.json()) > 0

@pytest.mark.anyio
async def test_rls_user_isolation():
    """Verify strict tenant isolation between two distinct users."""
    transport = ASGITransport(app=app)
    # User A (demo user)
    headers_a = {"Authorization": "Bearer finflow_demo_jwt_token_2026"}
    # User B (separate token)
    headers_b = {"Authorization": "Bearer local_user_b_isolation_test"}

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create a private transaction for User A
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

        # User B fetches transactions
        res_b_list = await client.get("/api/transactions?page=1&page_size=50", headers=headers_b)
        assert res_b_list.status_code == 200
        b_txs = res_b_list.json()["transactions"]

        # User B should NOT see User A's transaction
        assert not any(t["id"] == created_id for t in b_txs)
        assert not any(t["notes"] == "User A Top Secret Purchase" for t in b_txs)

@pytest.mark.anyio
async def test_model_summary_public():
    """Verify that public /api/model/summary answers with no auth header."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/model/summary")
        assert res.status_code == 200
        data = res.json()
        assert data["model_name"] == "RandomForest"
        assert data["feature_count"] == 18
        assert data["accuracy"] == 0.958
        assert "RandomForest · 18 features · 95.8% accuracy" in data["badge_text"]
        assert data["total_samples"] == 1200
        assert data["currency"] == "INR (₹)"


