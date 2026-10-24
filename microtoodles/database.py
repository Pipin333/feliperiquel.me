"""Capa de persistencia asíncrona en SQLite para MicroToodles.

Gestiona el almacenamiento de canciones, caché de URLs resueltas de audio
y el estado en tiempo real de la reproducción continua bajo modo WAL.
"""

import time
import aiosqlite
from spotify import Track


class Database:
    """Administra las conexiones y consultas asíncronas a SQLite."""

    def __init__(self, db_path: str = "toodles_stream.db") -> None:
        """Inicializa la referencia a la base de datos.

        Args:
            db_path: Ruta del archivo SQLite en disco.
        """
        self.db_path = db_path

    async def init_db(self) -> None:
        """Crea las tablas requeridas y habilita el modo WAL de alto rendimiento."""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("PRAGMA journal_mode=WAL;")
            await db.execute("PRAGMA synchronous=NORMAL;")
            await db.execute("PRAGMA foreign_keys=ON;")

            await db.execute(
                """
                CREATE TABLE IF NOT EXISTS tracks (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    artist TEXT NOT NULL,
                    album TEXT,
                    cover_url TEXT,
                    duration_ms INTEGER NOT NULL,
                    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                """
            )

            await db.execute(
                """
                CREATE TABLE IF NOT EXISTS stream_cache (
                    track_id TEXT PRIMARY KEY,
                    resolved_url TEXT NOT NULL,
                    format_id TEXT,
                    expires_at REAL NOT NULL,
                    resolved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
                );
                """
            )

            await db.execute(
                """
                CREATE TABLE IF NOT EXISTS playback_state (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    current_track_id TEXT,
                    started_at REAL NOT NULL,
                    is_playing INTEGER DEFAULT 1,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                """
            )

            await db.commit()

    async def upsert_tracks(self, tracks: list[Track]) -> int:
        """Inserta o actualiza una lista de canciones en la base de datos.

        Args:
            tracks: Lista de instancias Track obtenidas de Spotify.

        Returns:
            int: Cantidad de pistas procesadas.
        """
        if not tracks:
            return 0

        async with aiosqlite.connect(self.db_path) as db:
            for track in tracks:
                await db.execute(
                    """
                    INSERT INTO tracks (id, title, artist, album, cover_url, duration_ms)
                    VALUES (?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                        title = excluded.title,
                        artist = excluded.artist,
                        album = excluded.album,
                        cover_url = excluded.cover_url,
                        duration_ms = excluded.duration_ms;
                    """,
                    (
                        track.id,
                        track.title,
                        track.artist,
                        track.album,
                        track.cover_url,
                        track.duration_ms,
                    ),
                )
            await db.commit()
        return len(tracks)

    async def get_all_tracks(self) -> list[Track]:
        """Obtiene todas las canciones almacenadas ordenadas por inserción.

        Returns:
            list[Track]: Lista completa de pistas disponibles.
        """
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute("SELECT id, title, artist, album, cover_url, duration_ms FROM tracks ORDER BY rowid ASC")
            rows = await cursor.fetchall()
            return [
                Track(
                    id=row["id"],
                    title=row["title"],
                    artist=row["artist"],
                    album=row["album"] or "",
                    cover_url=row["cover_url"] or "",
                    duration_ms=row["duration_ms"],
                )
                for row in rows
            ]

    async def get_track(self, track_id: str) -> Track | None:
        """Busca una pista por su identificador único.

        Args:
            track_id: ID de Spotify de la canción.

        Returns:
            Track | None: Instancia de Track si existe, de lo contrario None.
        """
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute(
                "SELECT id, title, artist, album, cover_url, duration_ms FROM tracks WHERE id = ?",
                (track_id,),
            )
            row = await cursor.fetchone()
            if not row:
                return None
            return Track(
                id=row["id"],
                title=row["title"],
                artist=row["artist"],
                album=row["album"] or "",
                cover_url=row["cover_url"] or "",
                duration_ms=row["duration_ms"],
            )

    async def get_cached_url(self, track_id: str) -> str | None:
        """Devuelve la URL de stream directa si aún no ha expirado.

        Args:
            track_id: ID de Spotify de la pista.

        Returns:
            str | None: URL de audio válida o None si no existe o expiró.
        """
        now = time.time()
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute(
                "SELECT resolved_url, expires_at FROM stream_cache WHERE track_id = ?",
                (track_id,),
            )
            row = await cursor.fetchone()
            if row and row[1] > now:
                return row[0]
        return None

    async def set_cached_url(
        self,
        track_id: str,
        resolved_url: str,
        format_id: str = "",
        ttl_seconds: int = 14400,
    ) -> None:
        """Registra o actualiza una URL resuelta de streaming con TTL.

        Args:
            track_id: ID de Spotify de la pista.
            resolved_url: Enlace directo al stream HTTP de audio.
            format_id: Identificador de codec/formato extraído por yt-dlp.
            ttl_seconds: Tiempo de vida en segundos (por defecto 4 horas).
        """
        expires_at = time.time() + ttl_seconds
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                """
                INSERT INTO stream_cache (track_id, resolved_url, format_id, expires_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(track_id) DO UPDATE SET
                    resolved_url = excluded.resolved_url,
                    format_id = excluded.format_id,
                    expires_at = excluded.expires_at,
                    resolved_at = CURRENT_TIMESTAMP;
                """,
                (track_id, resolved_url, format_id, expires_at),
            )
            await db.commit()

    async def get_playback_state(self) -> dict | None:
        """Obtiene el estado actual de reproducción desde la base de datos.

        Returns:
            dict | None: Diccionario con track_id, started_at e is_playing.
        """
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute(
                "SELECT current_track_id, started_at, is_playing FROM playback_state WHERE id = 1"
            )
            row = await cursor.fetchone()
            if not row:
                return None
            return {
                "current_track_id": row["current_track_id"],
                "started_at": row["started_at"],
                "is_playing": bool(row["is_playing"]),
            }

    async def set_playback_state(
        self,
        current_track_id: str,
        started_at: float,
        is_playing: bool = True,
    ) -> None:
        """Guarda o actualiza el estado actual de reproducción.

        Args:
            current_track_id: ID de la pista en curso.
            started_at: Marca de tiempo UNIX de inicio de la pista.
            is_playing: Indicador booleano de reproducción activa.
        """
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                """
                INSERT INTO playback_state (id, current_track_id, started_at, is_playing)
                VALUES (1, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    current_track_id = excluded.current_track_id,
                    started_at = excluded.started_at,
                    is_playing = excluded.is_playing,
                    updated_at = CURRENT_TIMESTAMP;
                """,
                (current_track_id, started_at, 1 if is_playing else 0),
            )
            await db.commit()

    async def get_next_track(self, current_track_id: str | None = None) -> Track | None:
        """Devuelve la siguiente pista en la secuencia cíclica de la playlist.

        Args:
            current_track_id: ID de la pista actual para determinar la siguiente.

        Returns:
            Track | None: Siguiente objeto Track o None si no hay pistas disponibles.
        """
        tracks = await self.get_all_tracks()
        if not tracks:
            return None

        if not current_track_id:
            return tracks[0]

        for index, track in enumerate(tracks):
            if track.id == current_track_id:
                next_index = (index + 1) % len(tracks)
                return tracks[next_index]

        return tracks[0]

    async def get_queue(self, current_track_id: str | None = None, limit: int = 10) -> list[Track]:
        """Devuelve la cola de las próximas canciones a reproducir.

        Args:
            current_track_id: ID de la pista en curso.
            limit: Número máximo de canciones en cola a devolver.

        Returns:
            list[Track]: Lista de próximas pistas.
        """
        tracks = await self.get_all_tracks()
        if not tracks:
            return []

        if not current_track_id:
            return tracks[:limit]

        current_idx = 0
        for index, track in enumerate(tracks):
            if track.id == current_track_id:
                current_idx = index
                break

        queue: list[Track] = []
        for i in range(1, min(len(tracks), limit + 1)):
            queue.append(tracks[(current_idx + i) % len(tracks)])

        return queue
