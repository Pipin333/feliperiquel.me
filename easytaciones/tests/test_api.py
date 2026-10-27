from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_get_licitaciones_activas():
    response = client.get("/api/v1/licitaciones/activas")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0


def test_match_endpoint():
    payload = {
        "query": "Auditoría de ciberseguridad, ethical hacking y pentesting",
        "min_score_percentage": 50.0,
        "top_k": 3
    }
    response = client.post("/api/v1/licitaciones/match", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["query"] == payload["query"]
    assert data["total_coincidentes"] >= 1
    # La licitación de ciberseguridad debe ser el top match
    top = data["resultados"][0]
    assert top["licitacion"]["codigo_externo"] == "834-45-LQ24"
    assert top["score_percentage"] >= 50.0
