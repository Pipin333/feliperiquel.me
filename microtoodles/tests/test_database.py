"""Pruebas unitarias para la capa de persistencia Database en SQLite."""

import os
import tempfile
import pytest
import aiosqlite

from database import Database
from spotify import Track


@pytest.mark.asyncio
async def test_database_init_and_wal():
    """Verifica que la base de datos se inicialice correctamente en modo WAL."""
    with tempfile.TemporaryDirectory() as tmp_dir:
        db_path = os.path.join(tmp_dir, "test.db")
        db = Database(db_path)
        await db.init_db()

        assert os.path.exists(db_path)

        async with aiosqlite.connect(db_path) as conn:
            cursor = await conn.execute("PRAGMA journal_mode;")
            row = await cursor.fetchone()
            assert row[0].lower() == "wal"


@pytest.mark.asyncio
async def test_upsert_and_get_tracks():
    """Valida la inserción, actualización y consulta de pistas."""
    with tempfile.TemporaryDirectory() as tmp_dir:
        db_path = os.path.join(tmp_dir, "test.db")
        db = Database(db_path)
        await db.init_db()

        sample_tracks = [
            Track(
                id="t1",
                title="Song One",
                artist="Artist A",
                album="Album 1",
                cover_url="https://example.com/cover1.jpg",
                duration_ms=180000,
            ),
            Track(
                id="t2",
                title="Song Two",
                artist="Artist B",
                album="Album 2",
                cover_url="https://example.com/cover2.jpg",
                duration_ms=210000,
            ),
        ]

        count = await db.upsert_tracks(sample_tracks)
        assert count == 2

        all_tracks = await db.get_all_tracks()
        assert len(all_tracks) == 2
        assert all_tracks[0].title == "Song One"
        assert all_tracks[1].artist == "Artist B"

        # Test get single track
        track1 = await db.get_track("t1")
        assert track1 is not None
        assert track1.id == "t1"
        assert track1.title == "Song One"

        # Non-existent track
        none_track = await db.get_track("non_existent")
        assert none_track is None


@pytest.mark.asyncio
async def test_stream_cache_ttl():
    """Verifica el guardado y expiración en stream_cache."""
    with tempfile.TemporaryDirectory() as tmp_dir:
        db_path = os.path.join(tmp_dir, "test.db")
        db = Database(db_path)
        await db.init_db()

        track = Track(
            id="t1",
            title="Song One",
            artist="Artist A",
            album="Album",
            cover_url="",
            duration_ms=1000,
        )
        await db.upsert_tracks([track])

        # Cache con TTL válido
        await db.set_cached_url("t1", "https://audio.stream/valid", format_id="webm", ttl_seconds=3600)
        cached = await db.get_cached_url("t1")
        assert cached == "https://audio.stream/valid"

        # Cache expirado (TTL negativo)
        await db.set_cached_url("t1", "https://audio.stream/expired", format_id="webm", ttl_seconds=-10)
        expired = await db.get_cached_url("t1")
        assert expired is None


@pytest.mark.asyncio
async def test_cyclic_next_track_and_queue():
    """Valida el cálculo cíclico de la siguiente pista y la cola."""
    with tempfile.TemporaryDirectory() as tmp_dir:
        db_path = os.path.join(tmp_dir, "test.db")
        db = Database(db_path)
        await db.init_db()

        tracks = [
            Track(id=f"t{i}", title=f"Track {i}", artist="Artist", album="", cover_url="", duration_ms=1000)
            for i in range(1, 4)
        ]
        await db.upsert_tracks(tracks)

        # Siguiente de t1 debe ser t2
        next_track = await db.get_next_track("t1")
        assert next_track.id == "t2"

        # Siguiente del último (t3) debe volver a t1
        loop_track = await db.get_next_track("t3")
        assert loop_track.id == "t1"

        # Cola a partir de t1 con límite 2
        queue = await db.get_queue("t1", limit=2)
        assert len(queue) == 2
        assert queue[0].id == "t2"
        assert queue[1].id == "t3"
