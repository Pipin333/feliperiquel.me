# ESPECIFICACIÓN DE FRONTEND & UI/UX: Integración en DynamicDock 🎛️✨
> **Destinatario:** Desarrollador Frontend / Próximo Agente  
> **Integración:** `feliperiquel.me` (`DynamicDock.astro` + Astro View Transitions)  
> **Fecha:** 2026-10-24

---

## 1. Decisión de Diseño: Integración Nativa en `DynamicDock`
El reproductor de **MicroToodles** se integra directamente dentro del dock flotante existente (`DynamicDock.astro`), manteniendo la simetría y coherencia de controles de la web.

```
┌─────────────────────────────────────────────────────────────────┐
│ DynamicDock:   [ >_ Terminal ]   [ 📻 Radio Toodles ]   [ ↑ Top ]│
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Los Dos Modos de Interacción

### A. Modo Compacto (Directo en el Dock)
- **Estado Reposo (Off):** Icono de ondas/radio sutil en gris `text-slate-400 hover:text-domain-audio`. Tooltip: `"Música de fondo (Toodles Radio)"`.
- **Estado Activo (Playing):**
  - El botón se ilumina en color ámbar de dominio de audio (`text-amber-400` / `ring-1 ring-amber-400/50`).
  - Un mini-vúmetro de 3 barras CSS animadas oscila dentro del mismo botón.
  - Al hacer click simple: **Play / Pause instantáneo**.

### B. Modo Expandido (Flyout Drawer sobre el Dock)
Al pulsar el botón o desplegar la tarjeta de controles completos:

```
┌─────────────────────────────────────────────────────────────┐
│ ♫ [Cover]  Post Mortem - Dillom                             │
│            01:45 ━━━━━━━━━━━━●──────────── 03:20            │
│            [ ⏮ -10s ]  [ ⏸ Pause ]  [ ⏭ Skip ]              │
│            [ 🔉 ─────●───── ]           [ ⤢ Lab DSP ]      │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Controles de Reproducción: Skip, Rewind & Scrubbing ⏯️

Para soportar **adelantar/retroceder (Rewind/Fast-Forward)** y **Scrubbing interactivo (arrastrar la barra de tiempo)**, existen dos modelos técnicos posibles dependiendo de la experiencia deseada:

### Opción 1: Modelo "Radio Comunitaria en Vivo" (Live Continuous Stream)
- El servidor emite un único flujo continuo (`/api/stream`) común para todos los visitantes simultáneos (como una emisora de radio online).
- **Limitación técnica:** En una radio en vivo no existe el scrubbing hacia el futuro porque el stream es tiempo real.
- **Controles soportados:**
  - **Skip (`⏭`):** Llama a `GET /api/next-track` (on-demand) para forzar al servidor a pasar al siguiente tema de la playlist.
  - **Mute / Volumen / Pausa local:** El cliente puede silenciar o pausar su recepción del stream.

### Opción 2: Modelo "Jukebox Bajo Demanda / On-Demand Session" (Recomendado) ⭐
- Cada visitante tiene el control total de su sesión de escucha mediante streaming con soporte de cabeceras HTTP `Range` (`bytes=0-`):
  - **Scrubbing Completo:** La barra de progreso `<input type="range">` permite hacer click o arrastrar a cualquier punto de la canción. El navegador envía la petición con `Range: bytes=X-` y el servidor sirve los datos desde esa marca de tiempo (`seek`).
  - **Botones de Rewind / Forward (`⏮` / `⏭`):**
    - `⏮ -10s`: Retrocede 10 segundos instantáneamente en el cliente: `audioEl.currentTime = Math.max(0, audioEl.currentTime - 10)`.
    - `⏭ Skip`: Pide la siguiente pista de la cola al servidor `GET /api/next-track`, actualiza metadatos y reproduce de inmediato.
    - `⏭ +10s`: Adelanta 10 segundos: `audioEl.currentTime += 10`.

---

## 4. Persistencia de Audio entre Rutas (Astro View Transitions)
Para garantizar que la música y la posición del scrub no se corten al navegar:

```astro
<!-- En Layout.astro o DynamicDock.astro -->
<div id="microtoodles-audio-container" transition:persist>
  <audio
    id="microtoodles-stream"
    preload="metadata"
    crossorigin="anonymous"
  ></audio>
</div>
```

---

## 5. Conexión con Web Audio API (SonicRip Bridge)
```javascript
// Permite que SonicRip Studio o el vúmetro lean el stream sin violar CORS
const audioEl = document.getElementById('microtoodles-stream');
audioEl.crossOrigin = 'anonymous';
```

---

## 6. Resiliencia y Fallback Silencioso
Si el backend de MicroToodles no responde o se encuentra offline:
- El botón `dock-toggle-radio` se muestra en estado disabled o con tooltip `"Radio Offline"`.
- Cero alertas intrusivas ni caídas en cascada de los scripts de la página.
