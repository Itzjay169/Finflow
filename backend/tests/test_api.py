import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.database import init_db
from backend.app.services.transactions import seed_sample_data
from backend.app.auth import DEMO_USER_ID

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
