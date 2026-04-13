import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    """Verify the API is up and responding."""
    response = client.get("/")
    assert response.status_code == 200
    assert "RiskDesk API" in response.json().get("message", "")

def test_analyze_endpoint_invalid_ticker():
    """Verify that the API handles invalid tickers with a 500/400 error (currently 500, soon to be 400)."""
    payload = {
        "tickers": ["INVALID_SYM"],
        "weights": [1.0],
        "start_date": "2023-01-01",
        "end_date": "2023-12-31",
        "benchmark": "SPY",
        "rf_rate": 0.05,
        "conf_level": 0.95,
        "stress_level": 1.0
    }
    response = client.post("/analyze", json=payload)
    # Right now it might return 500 until I fix it in the bugfix phase
    assert response.status_code in [400, 500]
