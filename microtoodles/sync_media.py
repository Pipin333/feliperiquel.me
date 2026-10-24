"""Script de sincronización y descarga local de canciones para MicroToodles.

Descarga y convierte a MP3 todas las pistas de la playlist de Spotify que aún no
estén almacenadas en disco local, asegurando versiones oficiales de estudio.
"""

import asyncio
import difflib
import logging
import os
import re
import shutil
import sqlite3
import sys
from typing import Any
from yt_dlp import YoutubeDL

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("sync_media")

# Rutas predeterminadas
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "toodles_stream.db")
MEDIA_DIR = os.path.join(BASE_DIR, "media")

# Detectar binario FFmpeg
FFMPEG_CANDIDATES = [
    shutil.which("ffmpeg"),
    r"C:\Users\Petiso\AppData\Local\Programs\Ultimate Vocal Remover\ffmpeg.exe",
    "/usr/bin/ffmpeg",
]
FFMPEG_PATH = next((p for p in FFMPEG_CANDIDATES if p and os.path.exists(p)), None)


def score_candidate(candidate: dict[str, Any], title: str, artist: str, duration_ms: int) -> float:
    """Calcula la idoneidad de un resultado de búsqueda."""
    cand_title = str(candidate.get("title", "")).lower()
    uploader = str(candidate.get("uploader", "")).lower()
    channel = str(candidate.get("channel", "")).lower()
    duration = float(candidate.get("duration") or 0)
    target_dur = duration_ms / 1000.0

    target_title_lower = title.lower()
    target_artist_lower = artist.lower()

    # Filtro de términos prohibidos
    forbidden = [
        "live", "en vivo", "concert", "concierto", "cover", "tributo",
        "tribute", "full album", "album completo", "remix", "karaoke",
        "slowed", "reverb", "acapella", "instrumental", "acoustic", "acustico"
    ]
    for word in forbidden:
        if word in cand_title and word not in target_title_lower:
            return -1000.0

    dur_diff = abs(duration - target_dur) if duration > 0 else 50.0
    if dur_diff > 35.0:
        return -500.0 - dur_diff

    clean_title = re.sub(r'from\s+.*|\(.*?\)|\[.*?\]', '', cand_title.replace(target_artist_lower, '')).replace('-', ' ').strip()
    title_similarity = difflib.SequenceMatcher(None, target_title_lower, clean_title).ratio()

    if title_similarity < 0.35 and target_title_lower not in cand_title:
        return -800.0

    score = 80.0 - (dur_diff * 4.0) + (title_similarity * 50.0)

    if target_artist_lower in cand_title or target_artist_lower in uploader or target_artist_lower in channel:
        score += 30.0

    if "topic" in uploader or "topic" in channel or "official audio" in cand_title:
        score += 35.0

    return score


def download_track(track_id: str, title: str, artist: str, duration_ms: int) -> bool:
    """Busca y descarga una canción como MP3 en el directorio media."""
    target_file = os.path.join(MEDIA_DIR, f"{track_id}.mp3")
    if os.path.exists(target_file) and os.path.getsize(target_file) > 50_000:
        logger.info(f"Pista ya descargada: '{artist} - {title}' ({os.path.getsize(target_file) // 1024} KB)")
        return True

    os.makedirs(MEDIA_DIR, exist_ok=True)
    temp_template = os.path.join(MEDIA_DIR, f"{track_id}.%(ext)s")

    queries = [
        f"ytsearch5:{artist} - {title} audio",
        f"scsearch5:{artist} - {title}",
    ]

    extract_opts = {
        "quiet": True,
        "no_warnings": True,
        "extract_flat": True,
        "nocheckcertificate": True,
    }

    candidates = []
    with YoutubeDL(extract_opts) as ydl:
        for q in queries:
            try:
                info = ydl.extract_info(q, download=False)
                if info and "entries" in info:
                    candidates.extend([e for e in info["entries"] if e and e.get("url")])
            except Exception as exc:
                logger.warning(f"Error en búsqueda '{q}': {exc}")
            if candidates:
                break

    if not candidates:
        logger.error(f"No se hallaron candidatos para '{artist} - {title}'")
        return False

    scored = [(score_candidate(c, title, artist, duration_ms), c) for c in candidates]
    scored.sort(key=lambda x: x[0], reverse=True)
    best_score, best_cand = scored[0]

    cand_url = best_cand.get("url")
    cand_title = best_cand.get("title")
    cand_dur = best_cand.get("duration")

    logger.info(
        f"Descargando '{artist} - {title}' <- '{cand_title}' "
        f"(dur={cand_dur}s, score={best_score:.1f}, url={cand_url})"
    )

    ydl_download_opts = {
        "format": "bestaudio/best",
        "outtmpl": temp_template,
        "quiet": True,
        "no_warnings": True,
        "nocheckcertificate": True,
        "ffmpeg_location": FFMPEG_PATH,
        "postprocessors": [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "mp3",
            "preferredquality": "192",
        }],
    }

    try:
        with YoutubeDL(ydl_download_opts) as ydl:
            ydl.download([cand_url])
        if os.path.exists(target_file) and os.path.getsize(target_file) > 50_000:
            logger.info(f"Descarga exitosa: '{target_file}' ({os.path.getsize(target_file) // 1024} KB)")
            return True
        else:
            logger.error(f"El archivo final no se generó correctamente: {target_file}")
            return False
    except Exception as exc:
        logger.error(f"Error descargando {cand_url}: {exc}")
        return False


def main() -> None:
    """Punto de entrada concurrente para sincronizar todas las pistas."""
    from concurrent.futures import ThreadPoolExecutor, as_completed

    logger.info(f"Iniciando sincronización de medios. Base de datos: {DB_PATH}")
    logger.info(f"Directorio de destino: {MEDIA_DIR}")
    logger.info(f"FFmpeg detectado: {FFMPEG_PATH}")

    if not os.path.exists(DB_PATH):
        logger.error(f"No se encontró la base de datos en {DB_PATH}")
        sys.exit(1)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, artist, duration_ms FROM tracks ORDER BY added_at ASC")
    tracks = cursor.fetchall()
    conn.close()

    total = len(tracks)
    logger.info(f"Total de pistas a procesar: {total}")

    success_count = 0
    fail_count = 0

    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = {
            executor.submit(download_track, track_id, title, artist, duration_ms): (artist, title)
            for track_id, title, artist, duration_ms in tracks
        }
        for future in as_completed(futures):
            artist, title = futures[future]
            try:
                ok = future.result()
                if ok:
                    success_count += 1
                else:
                    fail_count += 1
            except Exception as exc:
                logger.error(f"Excepción descargando {artist} - {title}: {exc}")
                fail_count += 1

    logger.info(f"Sincronización finalizada: {success_count} exitosas, {fail_count} fallidas de {total} totales.")


if __name__ == "__main__":
    main()
