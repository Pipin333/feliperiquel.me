# Architecture Decision Record: MicroToodles Web Audio Streamer
Status: APPROVED
Date: 2026-10-24
Decision Makers: Felipe Riquelme (@Pipin333) & Antigravity (Architect-Guardian)

## 1. Contexto y Problemática
`feliperiquel.me` requiere ambientación sonora continua (música de fondo curada por Felipe vía Spotify) sin recurrir al widget oficial de Spotify (el cual exige login, agrega cookies pesadas de tracking, corta las canciones a 30s para usuarios no premium y no permite interactuar con la Web Audio API nativa).

Se necesita un servicio desacoplado ("MicroToodles") que:
1. Sincronice periódicamente una playlist pública/privada de Spotify vía Spotify Web API.
2. Resuelva el audio en vivo sin sobrecarga de CPU utilizando la arquitectura probada de `Tooodles` (extracción yt-dlp, passthrough directo Opus/WebM a través de FFmpeg, evitando transcodificaciones innecesarias).
3. Entregue un endpoint de streaming de audio (`/stream`) y un endpoint de metadatos en tiempo real (`/now-playing`) apto para integrarse con los visualizadores VFD y ecualizadores biquad de `SonicRip Studio` en Astro.

## 2. Decisiones de Arquitectura

### 2.1 Backend: FastAPI Asíncrono en Python (ARM64 Ready)
- **Por qué FastAPI:** Concurrencia nativa con `asyncio`, compatibilidad con generadores de streaming HTTP (chunked transfer encoding) y tipado estricto con Pydantic.
- **Sin transcodificación pesada:** Utilizar `-c:a copy` o transcodificación ligera a Opus encapsulado en Ogg/WebM (`audio/ogg; codecs=opus` o `audio/webm; codecs=opus`), consumiendo $< 0.5\%$ CPU en instancias ARM64 (Oracle Cloud / Docker casero).

### 2.2 Sincronización Spotify (Client Credentials Flow)
- Worker asíncrono con `apscheduler` o tarea periódica que refresca los ítems de la playlist cada 6 horas.
- Almacenamiento local en SQLite con modo WAL (`toodles_stream.db`) para persistir la cola de reproducción, caché de URLs resueltas y metadatos de pistas (artista, título, cover art, duración).

### 2.3 Buffer Atómico de 3 Niveles (Herencia de Tooodles)
1. **Nivel 1 (Pista Activa):** Pipe directo a FFmpeg que alimenta a los clientes conectados.
2. **Nivel 2 (Pista Siguiente):** Pre-resolución de URL de streaming y descarga atómica en `/tmp/microtoodles/` 30 segundos antes de finalizar la pista actual.
3. **Nivel 3 (Deflexión de Errores):** Passthrough de cabeceras HTTP y user-agents de yt-dlp hacia FFmpeg para prevenir errores 403 Forbidden por parte de los CDN de streaming.

### 2.4 Integración Cliente (Astro / feliperiquel.me)
- **Isla React/Vanilla en Astro:** Componente `AudioPlayer.astro` persistente en el layout (usando View Transitions de Astro para que la música no se corte al navegar entre `/`, `/lab`, `/proyectos` y `/sobre-mi`).
- **Conexión con SonicRip:** El elemento `<audio crossOrigin="anonymous">` se conecta como nodo fuente (`createMediaElementSource`) al `AudioContext` de la web, alimentando los vúmetros y analizadores de frecuencia.

## 3. Consecuencias y Trade-offs
- **Positivo:** Cero dependencia de widgets de terceros, control total de la señal de audio, interoperabilidad con el laboratorio DSP de la web, bajo consumo de recursos en ARM64.
- **Mitigación:** En caso de que el backend esté offline, el cliente en Astro implementará un fallback silencioso que oculta el reproductor o muestra un estado "Radio Offline" sin romper la navegación.
