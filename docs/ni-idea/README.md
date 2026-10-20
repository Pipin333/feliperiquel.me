# Ni Idea (Quiz & Party In-House)

Aplicación party-game y trivia multijugador para reuniones presenciales, virtuales y carretes. Juego **100% gratis**, **sin paywalls**, **sin anuncios** y **sin esperas**.

> **Estado**: Especificación congelada con Foreman (Step 4 Locked). Lista para construcción.
> 
> Documentos de diseño bloqueados:
> - [`BRIEF.md`](./BRIEF.md): Definición funcional, ciclo de juego y alcance del MVP.
> - [`BRAND.md`](./BRAND.md): Tokens visuales de Dirección B (Fieltro y Ruleta), escala tipográfica y comportamiento interactivo.

---

## 1. Objetivo del Proyecto

Construir una consola de juego web en tiempo real, accesible desde móviles o navegadores de escritorio (`feliperiquel.me/lab/ni-idea`), enfocada en:

- Diversión instantánea para amigos sin fricción de entrada (apodo temporal por sesión).
- Cero instalaciones: se entra por navegador escaneando QR o ingresando un código de cuatro letras.
- Costo operativo \$0 mediante arquitectura serverless en tiempo real.

### Principios No Negociables
- Sin cuentas de usuario ni inicios de sesión permanentes.
- Sin paywalls ni compras dentro de la app.
- Sin anuncios publicitarios.
- Sin sistemas de vidas, energía o tiempos de espera.

---

## 2. Alcance Funcional del MVP (v1)

### Incluye
1. **Creación de Sala (Host)**: Genera código alfanumérico de cuatro caracteres para proyectar en pantalla grande.
2. **Entrada de Jugadores**: Ingreso instantáneo por código y apodo temporal desde cualquier móvil o navegador web (hasta 16 jugadores concurrentes).
3. **Lobby en Vivo**: Lista interactiva de jugadores conectados en tiempo real.
4. **Ciclo de Partida con Ruleta de Modos**: Los jugadores rotan turno para hacer girar la ruleta y definir el desafío de la ronda:
   - **Trivia Rush**: Preguntas de cuatro opciones con temporizador decreciente y bonus de velocidad.
   - **Ese Eres Tú (That's You)**: Preguntas para arruinar amistades donde las opciones son los nombres de los jugadores en la sala y todos votan en secreto.
   - **Pinturillo (Garabato)**: Alcance acotado para MVP donde el jugador de turno dibuja trazos en un lienzo canvas táctil y el resto adivina en tiempo real.
5. **Puntuación y Podio**: Marcador dinámico tras cada ronda y podio final de sesión.
6. **Revancha Inmediata**: Reinicio de partida en la misma sala sin necesidad de reconectar.

### No Incluye (Non-Goals)
- Cuentas permanentes o perfiles sociales.
- Ranking global persistente entre diferentes días.
- Editor de preguntas personalizadas (UGC).
- Torneos o ligas complejas.

---

## 3. Arquitectura y Stack Tecnológico

- **Frontend Cliente**: Astro / TypeScript / Tailwind CSS. Consola en una sola vista sin scroll (`one viewport, no scroll`).
- **Tiempo Real y WebSockets**: PartyKit (Cloudflare Workers + Durable Objects en nodo Santiago `SCL` para latencia ultra-baja y cero costo).
- **Persistencia de Sesión**: Memoria en Durable Objects por sala activa.
- **Despliegue**: Vercel (cliente estático web) + PartyKit (servidor WebSocket).

---

## 4. Flujo de Partida

1. El anfitrión abre la web y pulsa **Crear Sala** (se genera el código, ej: `K9X2`).
2. Los amigos entran con su teléfono o laptop, ponen su apodo y el código `K9X2`.
3. El anfitrión inicia la partida desde el lobby.
4. Ronda por ronda:
   - Gira la ruleta y cae en Trivia, Ese Eres Tú o Pinturillo.
   - Los jugadores interactúan desde sus mandos en el móvil.
   - La pantalla principal muestra los resultados, trazos y puntos ganados.
5. Al término de las rondas, se proyecta el podio con el ganador y la opción de revancha inmediata.
