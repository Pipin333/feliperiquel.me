# PROJECT BRIEF: MicroToodles 📻🎶

## 1. Visión y Propósito
**MicroToodles** es un microservicio de streaming de audio de alta eficiencia diseñado específicamente para actuar como el motor sonoro de fondo de `feliperiquel.me`. 

El objetivo es sincronizar automáticamente una playlist curada de Spotify, resolver el audio en segundo plano mediante la arquitectura probada de `Tooodles` (yt-dlp + FFmpeg con passthrough Opus) y emitir un stream continuo y ligero junto a una API de metadatos en tiempo real (`Now Playing`), permitiendo que el portafolio y su laboratorio DSP (`SonicRip Studio`) cobren vida sonora sin fricción ni dependencias de iframes externos.

---

## 2. Requerimientos Funcionales (FR)
- **FR-01 (Sincronización Spotify):** Conectar con Spotify Web API vía `SPOTIFY_CLIENT_ID` y `SPOTIFY_CLIENT_SECRET` para leer los temas de una playlist pública (`SPOTIFY_PLAYLIST_ID`), extrayendo título, artista, álbum, cover art URL y duración.
- **FR-02 (Resolución y Streaming de Audio):** Resolver la fuente de audio óptima sin transcodificación pesada de CPU, transmitiendo paquetes Opus nativos en contenedor Ogg/WebM (`audio/ogg` o `audio/webm`).
- **FR-03 (API de Telemetría y Metadatos):**
  - `GET /api/now-playing`: Devuelve el JSON con la pista en curso, posición actual, duración, metadatos y estado del buffer.
  - `GET /api/stream`: Emite el flujo de audio continuo (HTTP Chunked Streaming).
  - `GET /api/queue`: Lista las próximas pistas en cola.
  - `GET /api/next-track`: Endpoint protegido con token de admin para saltar pista manualmente.
- **FR-04 (Persistencia y Colas):** Base de datos SQLite local en modo WAL para guardar pistas, caché de IDs de streaming y evitar consultas duplicadas.
- **FR-05 (Resiliencia de CDN):** Mecanismo de pre-resolución atómica y passthrough de cabeceras HTTP para eludir bloqueos 403 de CDNs.

---

## 3. Requerimientos No Funcionales (NFR)
- **NFR-01 (Eficiencia ARM64):** El uso de CPU no debe superar el 1.5% en instancias ARM64 (Oracle Cloud / Raspberry Pi / Docker Host).
- **NFR-02 (Latencia de API):** `/api/now-playing` debe responder en $< 15\text{ ms}$.
- **NFR-03 (CORS Abierto y Seguro):** Cabeceras CORS configurables (`Access-Control-Allow-Origin: https://feliperiquel.me`) con soporte para `Range` requests y `<audio crossOrigin="anonymous">` para Web Audio API.
- **NFR-04 (Zero Downtime / Auto-recovery):** Si una pista falla en resolverse, el motor debe descartarla de inmediato y avanzar a la siguiente sin interrumpir el stream HTTP.

---

## 4. Stack Tecnológico
- **Lenguaje:** Python 3.12+ (tipado estático estricto, `asyncio`).
- **Framework Web:** FastAPI + Uvicorn (ASGI).
- **Extracción de Audio:** `yt-dlp` (modo headless con extractores optimizados).
- **Procesamiento de Audio:** `FFmpeg` (binario estático con codecs Opus y Ogg).
- **Base de Datos:** SQLite3 (modo WAL, SQLAlchemy asíncrono o aiosqlite).
- **Despliegue:** Docker multi-stage optimizado para `linux/amd64` y `linux/arm64`.
