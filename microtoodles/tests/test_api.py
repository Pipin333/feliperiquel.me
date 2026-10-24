"""Pruebas de integración para los endpoints HTTP de FastAPI."""

import pytest
from httpx import ASGITransport, AsyncClient

from main import app, db, radio_engine
from spotify import Track


@pytest.fixture(autouse=True)
async def setup_test_db():
    """Inicializa la base de datos antes de cada prueba."""
    await db.init_db()
    # Insertar canciones de prueba
    tracks = [
        Track(id="trk_1", title="Hit Song", artist="Artist One", album="Album A", cover_url="", duration_ms=180000),
        Track(id="trk_2", title="Next Song", artist="Artist Two", album="Album B", cover_url="", duration_ms=200000),
    ]
    await db.upsert_tracks(tracks)
    radio_engine.current_track = tracks[0]
    radio_engine.is_running = True
    yield


@pytest.mark.asyncio
async def test_health_endpoint():
    """Valida que /health retorne el estado 200 y métricas correctas."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "MicroToodles"
        assert data["total_tracks"] >= 2
        assert data["is_playing"] is True
        assert data["current_track"]["title"] == "Hit Song"


@pytest.mark.asyncio
async def test_now_playing_endpoint():
    """Valida el endpoint de telemetría /api/now-playing."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/now-playing")
        assert response.status_code == 200
        data = response.json()
        assert data["is_playing"] is True
        assert data["track"]["id"] == "trk_1"
        assert data["track"]["artist"] == "Artist One"


@pytest.mark.asyncio
async def test_queue_endpoint():
    """Valida el endpoint /api/queue."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/queue?limit=5")
        assert response.status_code == 200
        data = response.json()
        assert data["count"] >= 1
        assert data["queue"][0]["id"] == "trk_2"


@pytest.mark.asyncio
async def test_skip_track_endpoint():
    """Valida el endpoint /api/next-track."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/api/next-track?token=microtoodles_secret_token")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["action"] == "skip"
        assert data["next_track"]["id"] == "trk_2"


@pytest.mark.asyncio
async def test_cors_headers():
    """Valida que las cabeceras CORS estén presentes para feliperiquel.me y previews de Vercel."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Origen de producción
        response = await client.options(
            "/api/now-playing",
            headers={
                "Origin": "https://feliperiquel.me",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert response.status_code == 200
        assert response.headers.get("access-control-allow-origin") == "https://feliperiquel.me"

        # 2. Origen de preview en Vercel
        preview_origin = "https://feliperiquel-me-git-feat-microtoodles-audio-streamer.vercel.app"
        response_preview = await client.options(
            "/api/now-playing",
            headers={
                "Origin": preview_origin,
                "Access-Control-Request-Method": "GET",
            },
        )
        assert response_preview.status_code == 200
        assert response_preview.headers.get("access-control-allow-origin") == preview_origin


@pytest.mark.asyncio
async def test_previous_track_endpoint():
    """Valida el endpoint /api/previous-track."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/api/previous-track")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["action"] == "previous"
        assert data["prev_track"] is not None


@pytest.mark.asyncio
async def test_shuffle_endpoint():
    """Valida el endpoint /api/shuffle."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/api/shuffle")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["action"] == "shuffle"
        assert isinstance(data["is_shuffle"], bool)


@pytest.mark.asyncio
async def test_seek_endpoint():
    """Valida el endpoint /api/seek para scrubbing."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/api/seek?seconds=45.5")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["action"] == "seek"
        assert data["position_seconds"] == 45.5
