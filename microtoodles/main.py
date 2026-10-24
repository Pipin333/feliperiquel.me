"""Punto de entrada principal del microservicio MicroToodles (FastAPI).

Expone los endpoints HTTP para transmisión de audio continuo en formato Opus,
telemetría en tiempo real de reproducción (Now Playing) y administración de colas.
"""

from contextlib import asynccontextmanager
import logging
from typing import AsyncGenerator
from fastapi import FastAPI, Header, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from config import get_settings
from database import Database
from engine import AudioResolver, RadioEngine
from spotify import SpotifyClient

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("microtoodles.main")

settings = get_settings()
db = Database(settings.DATABASE_PATH)
resolver = AudioResolver(db, settings)
radio_engine = RadioEngine(settings, db, resolver)
spotify_client = SpotifyClient(settings.SPOTIFY_CLIENT_ID, settings.SPOTIFY_CLIENT_SECRET)
scheduler = AsyncIOScheduler()


async def sync_spotify_task() -> None:
    """Tarea periódica que actualiza las canciones desde la playlist de Spotify."""
    if not (settings.SPOTIFY_CLIENT_ID and settings.SPOTIFY_CLIENT_SECRET and settings.SPOTIFY_PLAYLIST_ID):
        logger.warning("Sincronización omitida: Credenciales o Playlist ID de Spotify no configurados.")
        return

    logger.info("Iniciando sincronización de playlist de Spotify...")
    try:
        tracks = await spotify_client.fetch_playlist_tracks(settings.SPOTIFY_PLAYLIST_ID)
        saved = await db.upsert_tracks(tracks)
        logger.info(f"Sincronización exitosa: {saved} canciones actualizadas en base de datos.")
    except Exception as exc:
        logger.error(f"Error durante sincronización con Spotify: {exc}")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Gestiona el ciclo de vida de la aplicación, bases de datos y workers."""
    logger.info("Iniciando MicroToodles Engine...")
    await db.init_db()

    # Ejecutar primera sincronización en segundo plano
    if settings.SPOTIFY_PLAYLIST_ID:
        scheduler.add_job(
            sync_spotify_task,
            "interval",
            hours=settings.SYNC_INTERVAL_HOURS,
            id="spotify_sync_job",
            replace_existing=True,
        )
        scheduler.start()
        # Disparo inicial sin bloquear el arranque
        import asyncio
        asyncio.create_task(sync_spotify_task())

    # Iniciar motor de radio continua
    await radio_engine.start()

    yield

    # Apagado ordenado
    logger.info("Deteniendo MicroToodles Engine...")
    if scheduler.running:
        scheduler.shutdown(wait=False)
    await radio_engine.stop()


app = FastAPI(
    title="MicroToodles Audio Streamer",
    description="Microservicio de streaming continuo Opus y metadatos de audio para feliperiquel.me",
    version="1.0.0",
    lifespan=lifespan,
)

# Configuración de CORS para feliperiquel.me y desarrollo local
allowed_origins = [
    origin.strip()
    for origin in [settings.CORS_ORIGIN, "http://localhost:4321", "http://localhost:3000", "http://127.0.0.1:4321"]
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else ["*"],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|.*\.vercel\.app|.*\.feliperiquel\.me)(:\d+)?",
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Content-Type", "Accept-Ranges", "Content-Range"],
)


@app.get("/health", summary="Chequeo de salud del servicio")
async def health_check() -> dict:
    """Devuelve el estado de operatividad del servicio y métricas clave."""
    tracks = await db.get_all_tracks()
    now_playing = radio_engine.get_now_playing()
    return {
        "status": "ok",
        "service": "MicroToodles",
        "environment": settings.ENV,
        "total_tracks": len(tracks),
        "is_playing": radio_engine.is_running,
        "listeners": now_playing["listeners_count"],
        "current_track": now_playing["track"],
    }


@app.get("/api/now-playing", summary="Metadatos en tiempo real de la pista actual")
async def get_now_playing() -> dict:
    """Retorna información detallada de la pista en curso, posición y duración."""
    return radio_engine.get_now_playing()


@app.get("/api/stream", summary="Transmisión continua de audio en chunks")
async def stream_audio() -> StreamingResponse:
    """Emite un flujo continuo de paquetes de audio MP3 para el reproductor web."""
    return StreamingResponse(
        radio_engine.stream_audio_generator(),
        media_type="audio/mpeg",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
            "X-Content-Type-Options": "nosniff",
        },
    )


@app.get("/api/queue", summary="Lista de próximas canciones encoladas")
async def get_queue(limit: int = Query(default=10, ge=1, le=50)) -> dict:
    """Devuelve las próximas pistas encoladas para reproducción."""
    current_id = radio_engine.current_track.id if radio_engine.current_track else None
    queue = await db.get_queue(current_track_id=current_id, limit=limit)
    return {
        "count": len(queue),
        "queue": [track.model_dump() for track in queue],
    }


@app.api_route("/api/next-track", methods=["GET", "POST"], summary="Saltar a la siguiente canción")
async def next_track(
    token: str | None = Query(default=None),
    authorization: str | None = Header(default=None),
) -> dict:
    """Fuerza el avance inmediato a la siguiente pista de la cola.

    Puede requerir autenticación mediante ADMIN_TOKEN si está configurado en producción.
    """
    if settings.ENV == "production" and settings.ADMIN_TOKEN:
        auth_header = authorization.replace("Bearer ", "") if authorization else ""
        provided_token = token or auth_header
        if provided_token != settings.ADMIN_TOKEN:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token de administración inválido o no provisto.",
            )

    new_track = await radio_engine.skip_track()
    return {
        "status": "success",
        "action": "skip",
        "next_track": new_track.model_dump() if new_track else None,
    }
