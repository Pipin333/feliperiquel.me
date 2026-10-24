"""Pruebas unitarias para AudioResolver y RadioEngine."""

import os
import tempfile
import pytest

from config import Settings
from database import Database
from engine import AudioResolver, RadioEngine
from spotify import Track


@pytest.mark.asyncio
async def test_audio_resolver_cache_hit():
    """Valida que AudioResolver devuelva la URL en caché sin consultar yt-dlp."""
    with tempfile.TemporaryDirectory() as tmp_dir:
        db_path = os.path.join(tmp_dir, "test.db")
        db = Database(db_path)
        await db.init_db()

        track = Track(
            id="t1",
            title="Song 1",
            artist="Artist 1",
            album="Album",
            cover_url="",
            duration_ms=180000,
        )
        await db.upsert_tracks([track])
        await db.set_cached_url("t1", "https://cached.audio/stream.webm", format_id="webm")

        resolver = AudioResolver(db)
        resolved_url = await resolver.resolve_audio_url(track)
        assert resolved_url == "https://cached.audio/stream.webm"


@pytest.mark.asyncio
async def test_radio_engine_listeners_and_broadcast():
    """Valida suscripción de oyentes y distribución de paquetes de audio."""
    with tempfile.TemporaryDirectory() as tmp_dir:
        db_path = os.path.join(tmp_dir, "test.db")
        db = Database(db_path)
        await db.init_db()

        settings = Settings(DATABASE_PATH=db_path)
        resolver = AudioResolver(db)
        engine = RadioEngine(settings, db, resolver)

        q1 = engine.subscribe()
        q2 = engine.subscribe()
        assert len(engine._listeners) == 2

        # Transmitir un chunk
        test_chunk = b"OGG_HEADER_DATA_123"
        engine.broadcast(test_chunk)

        res1 = await q1.get()
        res2 = await q2.get()
        assert res1 == test_chunk
        assert res2 == test_chunk

        # Desuscribir
        engine.unsubscribe(q1)
        assert len(engine._listeners) == 1
        engine.unsubscribe(q2)
        assert len(engine._listeners) == 0


@pytest.mark.asyncio
async def test_radio_engine_now_playing():
    """Valida la estructura de telemetría de now-playing."""
    with tempfile.TemporaryDirectory() as tmp_dir:
        db_path = os.path.join(tmp_dir, "test.db")
        db = Database(db_path)
        await db.init_db()

        settings = Settings(DATABASE_PATH=db_path)
        resolver = AudioResolver(db)
        engine = RadioEngine(settings, db, resolver)

        # Sin pista en reproducción
        empty_state = engine.get_now_playing()
        assert empty_state["is_playing"] is False
        assert empty_state["track"] is None

        # Asignando pista simulada
        track = Track(
            id="t_active",
            title="Active Track",
            artist="Producer",
            album="LP",
            cover_url="https://example.com/cover.jpg",
            duration_ms=120000,
        )
        engine.current_track = track
        engine.started_at = 1000.0
        engine.is_running = True

        state = engine.get_now_playing()
        assert state["is_playing"] is True
        assert state["track"]["title"] == "Active Track"
        assert state["duration_seconds"] == 120.0
