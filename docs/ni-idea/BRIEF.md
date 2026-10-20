# BUILD BRIEF: Ni Idea

## 1. Proyecto
- **Nombre**: Ni Idea
- **Creador**: Felipe Riquelme
- **Audiencia**: Grupos de amigos en reuniones presenciales, virtuales (Discord o videollamadas) y carretes que buscan jugar sin fricciones.
- **Registro de voz**: Informal pero sobrio. Directo, rápido, sin rodeos corporativos ni humor forzado.
- **Acción única del usuario**: El anfitrión crea la sala y proyecta el código en pantalla grande; los invitados ingresan el código de cuatro letras desde su celular o navegador de escritorio.

## 2. Stack Tecnológico
- **Frontend**: Astro / TypeScript / Tailwind CSS (cliente ultraliviano sin descargas).
- **Tiempo Real y WebSockets**: PartyKit (Cloudflare Workers + Durable Objects) para latencia baja y escalabilidad a cero costo.
- **Persistencia Temporal**: Memoria en Durable Objects por sala de juego (sin base de datos pesada para el MVP).
- **Despliegue**: Vercel (cliente estático web integrado en el portafolio o subdominio) + PartyKit Cloudflare (servidor WebSocket).

## 3. Contenido (Asignado por Ranuras)
- **Título**: Ni Idea
- **Bajada de soporte**: Trivia rápida, dibujos dudosos y votaciones para delatar a tus amigos.
- **Acción principal anfitrión**: Crear Sala (proyecta código de cuatro caracteres y abre el lobby).
- **Acción principal invitado**: Unirse a Sala (pide apodo y código de cuatro letras).
- **Bajo el pliegue**: Ninguno. Esta aplicación es una consola de una sola vista fija sin scroll.
- **Regla estricta de copia**: Usar este texto palabra por palabra. Cero rayas em y cero rayas en en todo el código y metadatos.

## 4. Forma y Diseño
Ver especificación completa y valores hexadecimales en `BRAND.md`.
- **Forma**: Consola de juego fija en una sola pantalla (one viewport, no scroll).
- **Paleta**: Fieltro nocturno. Esmeralda (#10B981), carmesí (#F43F5E) y negro técnico (#030712).
- **Tipografías**: Space Grotesk (títulos), Inter (cuerpo), Fira Code (códigos de sala).
- **Textura de Fondo y Efectos**:
  - Grid de papel milimétrico o cuadriculado técnico de 28px con opacidad sutil (0.05).
  - Linterna interactiva (spotlight) que revela el cuadrante técnico bajo el cursor usando variables `--mouse-x` y `--mouse-y` con máscara radial.
  - Background poblado con planos técnicos y marcas de agua de 1px (ruleta isométrica, dados y cartas) que dan densidad visual sin invadir la lectura.

## 5. Alcance Funcional del MVP (v1)
### Incluye
1. Generación de sala con código de cuatro letras mayúsculas.
2. Entrada inmediata por código y apodo temporal (hasta 16 jugadores), tanto desde móviles como desde escritorio.
3. Lobby con lista de jugadores conectados en vivo.
4. **Ciclo de Partida con Ruleta de Modos**: En cada ronda, los jugadores van rotando quién tira de la rueda para decidir el desafío:
   - **Modo Trivia**: Rondas de 4 opciones con temporizador decreciente y bonus de velocidad.
   - **Modo That's You (Preguntas para arruinar amistades)**: Premisas sociales del grupo donde las opciones son los nombres de los jugadores en la sala y todos votan en secreto.
   - **Modo Pinturillo (alcance acotado para MVP)**: Al jugador de turno le toca una palabra y un lienzo canvas táctil para dibujar trazos básicos; los demás ven el trazo en tiempo real y adivinan escribiendo.
5. Puntuación en vivo al terminar cada ronda y podio final de sesión.
6. Botón de revancha inmediata en la misma sala sin necesidad de reconectar a los jugadores.

### Queda Explícitamente Fuera (Non-Goals)
- Cuentas de usuario o inicios de sesión permanentes (prohibidos en todas las versiones).
- Ranking global persistente.
- Editor de preguntas personalizadas en esta versión inicial.
- Paywalls, anuncios publicitarios o sistemas de energía/espera.

## 6. Salvaguardas Mandatorias de Arquitectura (MAGI Shield)
1. **Watchdog Anti-AFK con Alarma en el DO**: Si el jugador al que le toca girar la ruleta o dibujar no emite acción en 15 segundos (o se desconecta), el Durable Object ejecuta un `auto-skip` / `auto-spin` forzado mediante `storage.setAlarm()`. Jamás delegar el avance de estado al cliente.
2. **Reconexión Transparente por `sessionToken`**: El cliente guarda un UUID efímero en `sessionStorage`. Al recargar o reconectar el WebSocket, el DO reasocia la conexión al slot existente, preservando puntaje y apodo sin clonar jugadores fantasma.
3. **Serialización Asimétrica Anti-Trampas**:
   - La palabra secreta de Pinturillo solo viaja al socket del dibujante activo.
   - En Trivia Rush y That's You, el servidor solo emite banderas `ha_respondido: true` para evitar que alguien abra las DevTools del navegador e inspeccione las respuestas antes de tiempo.
4. **Batching Vectorial en Pinturillo**: El canvas móvil acumula trazos y los despacha en lotes compactos cada 33 ms (30 Hz) con coordenadas normalizadas de 0 a 1000.

## 7. Piso de Calidad (Quality Floor)
- Responsive absoluto desde 375px (pantalla de smartphone común) hasta televisores 4K y pantallas de escritorio.
- Foco de teclado visible en todas las entradas y botones interactivos.
- Contraste WCAG AAA (11.2:1 entre verde esmeralda y texto profundo).
- Cero saltos de diseño (CLS = 0).
- Todos los controles funcionan: prohibidos enlaces muertos, botones sin acción o estados decorativos falsos.

## 8. Criterio de Aceptación del MVP
La versión 1 está lista cuando cuatro personas (en la misma habitación o conectadas virtualmente desde sus teléfonos o desde el navegador de escritorio en `feliperiquel.me/lab/ni-idea`) puedan conectarse a una sala, rotar el tiro de la ruleta por ronda, jugar desafíos de Trivia, That's You y Pinturillo con puntuación en vivo, ver al ganador en el podio proyectado y pulsar revancha sin recargar la página.
