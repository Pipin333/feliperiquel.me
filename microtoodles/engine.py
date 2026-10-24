"""Motor de resolución de audio y streaming continuo para MicroToodles.

Gestiona la extracción de audio mediante yt-dlp, el buffer atómico de reproducción,
la tubería de streaming con FFmpeg y la distribución en tiempo real a clientes web.
"""

import asyncio
import difflib
import logging
import os
import re
import shutil
import time
from typing import AsyncGenerator
from yt_dlp import YoutubeDL

from config import Settings
from database import Database
from spotify import Track

logger = logging.getLogger("microtoodles.engine")


class AudioResolver:
    """Resuelve URLs directas de streaming de audio a partir de metadatos de canciones."""

    def __init__(self, db: Database, settings: Settings | None = None) -> None:
        """Inicializa el resolvedor de audio.

        Args:
            db: Instancia de la base de datos para consulta y almacenamiento en caché.
            settings: Configuración opcional con lista de proxies y directorios de medios.
        """
        self.db = db
        self.settings = settings
        self.media_dir = getattr(settings, "MEDIA_DIR", "/app/data/media") if settings else "/app/data/media"
        try:
            os.makedirs(self.media_dir, exist_ok=True)
        except Exception:
            pass

    def _score_candidate(self, candidate: dict, target_track: Track) -> float:
        """Calcula una puntuación de precisión para un resultado de búsqueda de audio.

        Descarta versiones en vivo, bootlegs y recopilaciones de álbum completo,
        priorizando la duración exacta del master de Spotify y coincidencia de artista.

        Args:
            candidate: Metadatos devueltos por yt-dlp.
            target_track: Pista de Spotify original con título, artista y duración.

        Returns:
            float: Puntuación de fidelidad. Valores negativos altos indican versiones descartadas.
        """
        title = str(candidate.get("title", "")).lower()
        uploader = str(candidate.get("uploader", "")).lower()
        channel = str(candidate.get("channel", "")).lower()
        duration = float(candidate.get("duration") or 0)
        target_dur = target_track.duration_ms / 1000.0

        target_title_lower = target_track.title.lower()
        target_artist_lower = target_track.artist.lower()

        # Palabras prohibidas que arruinan la experiencia (conciertos, covers, bootlegs, etc.)
        forbidden = [
            "live", "en vivo", "concert", "concierto", "cover", "tributo",
            "tribute", "full album", "album completo", "remix", "karaoke",
            "slowed", "reverb", "acapella", "instrumental", "acoustic", "acustico"
        ]
        for word in forbidden:
            if word in title and word not in target_title_lower:
                return -1000.0

        # Si la duración difiere por más de 30 segundos, es muy probable que sea una versión extendida o errónea
        dur_diff = abs(duration - target_dur) if duration > 0 else 50.0
        if dur_diff > 30.0:
            return -500.0 - dur_diff

        # Limpiar el título del candidato para comparar similitud de pista
        clean_title = re.sub(r'from\s+.*|\(.*?\)|\[.*?\]', '', title.replace(target_artist_lower, '')).replace('-', ' ').strip()
        title_similarity = difflib.SequenceMatcher(None, target_title_lower, clean_title).ratio()

        # Si el título del candidato no coincide en lo absoluto con la canción buscada (ej. otra canción del mismo álbum)
        if title_similarity < 0.35 and target_title_lower not in title:
            return -800.0

        # Puntuación base en función de cercanía de duración y similitud de título
        score = 80.0 - (dur_diff * 4.0) + (title_similarity * 50.0)

        # Bonificación si el artista exacto aparece en el título o uploader
        if target_artist_lower in title or target_artist_lower in uploader or target_artist_lower in channel:
            score += 30.0

        # Bonificación para canales oficiales de la disquera o Topic
        if "topic" in uploader or "topic" in channel or "official audio" in title:
            score += 35.0

        return score

    async def resolve_audio_url(self, track: Track) -> str | None:
        """Obtiene la URL directa de streaming para una pista, consultando disco, caché o yt-dlp.

        Args:
            track: Pista con título y artista a resolver.

        Returns:
            str | None: Ruta local del archivo o URL de streaming, o None si falló.
        """
        # 1. Comprobar si existe la pista descargada localmente en disco
        for ext in (".mp3", ".opus", ".m4a", ".webm", ".ogg"):
            local_file = os.path.join(self.media_dir, f"{track.id}{ext}")
            if os.path.exists(local_file) and os.path.getsize(local_file) > 50_000:
                logger.info(
                    f"Reproduciendo desde archivo local: '{track.artist} - {track.title}' ({local_file})"
                )
                return local_file

        # 2. Consultar URL en caché en memoria/SQLite
        cached_url = await self.db.get_cached_url(track.id)
        if cached_url:
            return cached_url

        search_queries = [
            f"scsearch10:{track.artist} - {track.title}",
            f"ytsearch5:{track.artist} - {track.title} audio",
        ]
        logger.info(f"Resolviendo audio para '{track.artist} - {track.title}' vía yt-dlp...")

        proxies = [
            p.strip() for p in self.settings.PROXY_LIST.split(",") if p.strip()
        ] if (self.settings and self.settings.PROXY_LIST) else []
        candidates = [None] + proxies

        def _extract(target_query: str, proxy_url: str | None = None) -> list[dict]:
            cookie_path = "cookies.txt" if os.path.exists("cookies.txt") else None
            ydl_opts = {
                "format": "bestaudio[ext=webm]/bestaudio[ext=m4a]/bestaudio/best",
                "extract_flat": False,
                "skip_download": True,
                "quiet": True,
                "no_warnings": True,
                "nocheckcertificate": True,
                "noplaylist": True,
                "cookiefile": cookie_path,
                "proxy": proxy_url,
                "extractor_args": {
                    "youtube": {
                        "player_client": ["android", "ios", "mweb", "web"]
                    }
                },
            }
            try:
                with YoutubeDL(ydl_opts) as ydl:
                    info = ydl.extract_info(target_query, download=False)
                    if not info:
                        return []
                    if "entries" in info and info["entries"]:
                        return [e for e in info["entries"] if e and e.get("url")]
                    if info.get("url"):
                        return [info]
                    return []
            except Exception as exc:
                logger.warning(f"Fallo en extracción yt-dlp con '{target_query}' (proxy={bool(proxy_url)}): {exc}")
                return []

        all_candidates: list[dict] = []
        for q in search_queries:
            for candidate_proxy in candidates:
                entries = await asyncio.to_thread(_extract, q, candidate_proxy)
                if entries:
                    all_candidates.extend(entries)
                    break
            if all_candidates:
                break

        if not all_candidates:
            logger.warning(f"No se encontró flujo de audio para '{track.title}'")
            return None

        # Ordenar candidatos por puntuación de fidelidad de audio
        scored = [(self._score_candidate(c, track), c) for c in all_candidates]
        scored.sort(key=lambda x: x[0], reverse=True)

        best_score, best_entry = scored[0]
        logger.info(
            f"Pista seleccionada para '{track.artist} - {track.title}': "
            f"'{best_entry.get('title')}' (dur={best_entry.get('duration')}s, score={best_score:.1f})"
        )

        stream_url = str(best_entry["url"])
        format_id = str(best_entry.get("format_id", ""))

        # Guardar en caché con TTL de 4 horas
        await self.db.set_cached_url(
            track_id=track.id,
            resolved_url=stream_url,
            format_id=format_id,
            ttl_seconds=14400,
        )

        return stream_url


class RadioEngine:
    """Motor central de transmisión de radio continua en tiempo real."""

    def __init__(self, settings: Settings, db: Database, resolver: AudioResolver) -> None:
        """Inicializa el motor de radio y estructuras de suscripción.

        Args:
            settings: Configuración general de la aplicación.
            db: Capa de persistencia.
            resolver: Resolvedor de enlaces directos de audio.
        """
        self.settings = settings
        self.db = db
        self.resolver = resolver
        self.current_track: Track | None = None
        self.started_at: float = 0.0
        self.is_running: bool = False
        self._listeners: set[asyncio.Queue[bytes]] = set()
        self._skip_event: asyncio.Event = asyncio.Event()
        self._worker_task: asyncio.Task | None = None
        self.is_shuffle: bool = False
        self._target_track: Track | None = None
        self._seek_seconds: float | None = None

    def subscribe(self) -> asyncio.Queue[bytes]:
        """Registra un nuevo oyente HTTP y le asigna una cola de chunks de audio.

        Returns:
            asyncio.Queue[bytes]: Cola asíncrona donde se depositan los bloques de audio.
        """
        queue: asyncio.Queue[bytes] = asyncio.Queue(maxsize=100)
        self._listeners.add(queue)
        logger.info(f"Nuevo oyente conectado. Total oyentes: {len(self._listeners)}")
        return queue

    def unsubscribe(self, queue: asyncio.Queue[bytes]) -> None:
        """Elimina un oyente al cerrar la conexión HTTP.

        Args:
            queue: Cola del oyente a desvincular.
        """
        self._listeners.discard(queue)
        logger.info(f"Oyente desconectado. Total oyentes: {len(self._listeners)}")

    def broadcast(self, chunk: bytes) -> None:
        """Distribuye un fragmento de audio a todos los oyentes activos.

        Args:
            chunk: Bloque binario de datos de audio Ogg/Opus.
        """
        dead_queues: list[asyncio.Queue[bytes]] = []
        for queue in list(self._listeners):
            try:
                queue.put_nowait(chunk)
            except asyncio.QueueFull:
                # Si el oyente tiene saturada la cola, descartamos paquetes viejos para evitar lag
                try:
                    queue.get_nowait()
                    queue.put_nowait(chunk)
                except Exception:
                    dead_queues.append(queue)
            except Exception:
                dead_queues.append(queue)

        for queue in dead_queues:
            self._listeners.discard(queue)

    async def skip_track(self) -> Track | None:
        """Fuerza el salto inmediato de la canción en curso hacia la siguiente o aleatoria.

        Returns:
            Track | None: Nueva canción en reproducción o None si no hay tracks.
        """
        logger.info("Comando de salto de pista recibido (Skip).")
        current_id = self.current_track.id if self.current_track else None
        if self.is_shuffle:
            next_track = await self.db.get_random_track(exclude_track_id=current_id)
        else:
            next_track = await self.db.get_next_track(current_id)
        self._target_track = next_track
        self._seek_seconds = 0.0
        self._skip_event.set()
        return next_track

    async def previous_track(self) -> Track | None:
        """Fuerza el regreso inmediato a la canción anterior.

        Returns:
            Track | None: Canción anterior en reproducción o None si no hay tracks.
        """
        logger.info("Comando de canción anterior recibido (Previous).")
        current_id = self.current_track.id if self.current_track else None
        prev_track = await self.db.get_previous_track(current_id)
        self._target_track = prev_track
        self._seek_seconds = 0.0
        self._skip_event.set()
        return prev_track

    def toggle_shuffle(self) -> bool:
        """Alterna el modo aleatorio de reproducción.

        Returns:
            bool: Estado resultante del modo aleatorio (True = activado).
        """
        self.is_shuffle = not self.is_shuffle
        logger.info(f"Modo aleatorio (Shuffle) cambiado a: {self.is_shuffle}")
        return self.is_shuffle

    async def seek(self, seconds: float) -> float:
        """Adelanta o retrocede la reproducción actual a una posición temporal específica.

        Args:
            seconds: Posición en segundos donde reanudar la reproducción.

        Returns:
            float: Posición normalizada y aplicada.
        """
        if not self.current_track:
            return 0.0
        max_duration = self.current_track.duration_ms / 1000.0
        target = max(0.0, min(max_duration - 1.0, seconds))
        logger.info(f"Scrubbing solicitado a {target:.1f}s para '{self.current_track.title}'")
        self._target_track = self.current_track
        self._seek_seconds = target
        self._skip_event.set()
        return target

    def get_now_playing(self) -> dict:
        """Calcula el estado y posición temporal actual de la canción en emisión.

        Returns:
            dict: Metadatos completos de la pista y estado del reproductor.
        """
        if not self.current_track:
            return {
                "is_playing": False,
                "is_shuffle": self.is_shuffle,
                "track": None,
                "elapsed_seconds": 0,
                "duration_seconds": 0,
                "listeners_count": len(self._listeners),
            }

        duration_sec = self.current_track.duration_ms / 1000.0
        elapsed = min(duration_sec, max(0.0, time.time() - self.started_at))

        return {
            "is_playing": self.is_running,
            "is_shuffle": self.is_shuffle,
            "track": {
                "id": self.current_track.id,
                "title": self.current_track.title,
                "artist": self.current_track.artist,
                "album": self.current_track.album,
                "cover_url": self.current_track.cover_url,
                "duration_ms": self.current_track.duration_ms,
            },
            "elapsed_seconds": round(elapsed, 1),
            "duration_seconds": round(duration_sec, 1),
            "listeners_count": len(self._listeners),
        }

    async def stream_audio_generator(self) -> AsyncGenerator[bytes, None]:
        """Generador asíncrono que alimenta el StreamingResponse de FastAPI.

        Yields:
            bytes: Bloques binarios continuos del stream de audio.
        """
        queue = self.subscribe()
        try:
            while self.is_running:
                chunk = await queue.get()
                yield chunk
        finally:
            self.unsubscribe(queue)

    async def start(self) -> None:
        """Inicia el ciclo principal de la radio en segundo plano."""
        if self.is_running:
            return
        self.is_running = True
        self._worker_task = asyncio.create_task(self._radio_loop())
        logger.info("Motor de Radio MicroToodles iniciado.")

    async def stop(self) -> None:
        """Detiene la reproducción y cancela las tareas activas."""
        self.is_running = False
        self._skip_event.set()
        if self._worker_task and not self._worker_task.done():
            self._worker_task.cancel()
            try:
                await self._worker_task
            except asyncio.CancelledError:
                pass
        logger.info("Motor de Radio MicroToodles detenido.")

    async def _radio_loop(self) -> None:
        """Ciclo continuo que reproduce canciones en secuencia."""
        ffmpeg_bin = shutil.which(self.settings.FFMPEG_BIN) or self.settings.FFMPEG_BIN

        while self.is_running:
            try:
                # Obtener la siguiente canción (o target_track si se forzó skip/prev/seek)
                if self._target_track:
                    track = self._target_track
                    self._target_track = None
                elif self.is_shuffle:
                    current_id = self.current_track.id if self.current_track else None
                    track = await self.db.get_random_track(exclude_track_id=current_id)
                else:
                    current_id = self.current_track.id if self.current_track else None
                    track = await self.db.get_next_track(current_id)

                if not track:
                    logger.warning("No hay pistas disponibles en la base de datos. Esperando 10s...")
                    await asyncio.sleep(10)
                    continue

                start_offset = self._seek_seconds or 0.0
                self._seek_seconds = None

                self.current_track = track
                self.started_at = time.time() - start_offset
                self._skip_event.clear()
                await self.db.set_playback_state(track.id, self.started_at, is_playing=True)

                logger.info(f"Iniciando reproducción: '{track.artist} - {track.title}' (offset={start_offset:.1f}s)")

                # Resolver enlace directo de audio
                audio_url = await self.resolver.resolve_audio_url(track)
                if not audio_url:
                    logger.warning(f"Omitiendo '{track.title}' por fallo de resolución.")
                    await asyncio.sleep(1)
                    continue

                # Validar existencia de FFmpeg
                if not shutil.which(ffmpeg_bin):
                    logger.warning(f"Binario FFmpeg '{ffmpeg_bin}' no disponible en el sistema.")
                    # Si no hay FFmpeg en el host local, esperar la duración o el evento de skip
                    try:
                        duration_s = max(5.0, (track.duration_ms / 1000.0) - start_offset)
                        await asyncio.wait_for(self._skip_event.wait(), timeout=duration_s)
                    except asyncio.TimeoutError:
                        pass
                    continue

                # Comando FFmpeg con offset opcional para scrubbing
                ffmpeg_cmd = [
                    ffmpeg_bin,
                    "-re",
                    "-nostats",
                    "-loglevel",
                    "warning",
                ]
                if start_offset > 0.5:
                    ffmpeg_cmd.extend(["-ss", f"{start_offset:.2f}"])

                ffmpeg_cmd.extend([
                    "-i",
                    audio_url,
                    "-vn",
                    "-c:a",
                    "libmp3lame",
                    "-b:a",
                    "128k",
                    "-f",
                    "mp3",
                    "-",
                ])

                proc = await asyncio.create_subprocess_exec(
                    *ffmpeg_cmd,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.DEVNULL,
                )

                max_track_duration = ((track.duration_ms / 1000.0) - start_offset) + 4.0

                try:
                    while self.is_running and proc.returncode is None:
                        if self._skip_event.is_set():
                            break

                        # Watchdog de duración: prevenir bloqueos si la fuente no cierra el socket
                        if time.time() - self.started_at > max_track_duration:
                            logger.info(f"Duración límite alcanzada para '{track.title}'. Pasando a siguiente pista...")
                            break

                        if proc.stdout is None:
                            break

                        chunk = await proc.stdout.read(8192)
                        if not chunk:
                            break

                        self.broadcast(chunk)
                finally:
                    if proc.returncode is None:
                        try:
                            proc.terminate()
                            await proc.wait()
                        except Exception:
                            pass

                logger.info(f"Pista finalizada o saltada: '{track.title}'")
                await asyncio.sleep(0.5)

            except asyncio.CancelledError:
                break
            except Exception as err:
                logger.error(f"Error inesperado en ciclo de radio: {err}", exc_info=True)
                await asyncio.sleep(3)
