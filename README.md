# feliperiquel.me

Portafolio de ingeniería de software y laboratorio interactivo de **Felipe Riquelme**. Construido sobre **Astro**, **Tailwind CSS** y configurado con `@astrojs/vercel` para despliegue estático de alto rendimiento, accesibilidad WCAG 2.2 AA y 100/100 en Core Web Vitals.

---

## 🧪 El Laboratorio (`/lab`)

El sitio integra un playground de micro-aplicaciones y experimentos que se ejecutan directamente en el navegador:

1. **SonicRip Studio (`/lab/sonicrip`):**
   - Procesador de audio en vivo con **Ecualizador Paramétrico de 8 Bandas** (`BiquadFilterNode`), distorsión digital Lo-Fi Bitcrusher, analizador de espectro FFT con `requestAnimationFrame` y generador de comandos por lotes para `yt-dlp`.
2. **Retórica y Descalabro (`/lab/retorica`):**
   - Transmutador ontológico de lenguaje cotidiano hacia prosa decimonónica, cancillería diplomática y culteranismo barroco, con motor dual: heurísticas locales instantáneas y motor neuronal LLM (**BYOK** con Groq / Llama 3.3 70B, OpenRouter y Ollama) respaldado por un proxy serverless seguro anti-SSRF.
3. **Cuánto Rinde (`/lab/copete` - Repo: `calculadoracopete`):**
   - Optimizador logístico y presupuestario para eventos y juntas en Chile. Cálculo de destilados, cerveza, mixers y hielo con cuota por persona en \$ CLP y exportación formateada a WhatsApp.
4. **Ni Idea (`/lab/quiz`):**
   - Motor de trivia interactiva en tiempo real sin anuncios ni paywalls con temporizador de cuenta regresiva, racha de puntos y generador de retos.

---

## ⚙️ Proyectos de Software & Homelab

El portafolio expone herramientas reales y proyectos de código abierto:

- **Toodles:** Bot de Discord para streaming de audio desde YouTube y sistema de recomendación musical inteligente con ML (similitud del coseno sobre features de audio).
- **Whatsarr:** Interfaz conversacional en WhatsApp para solicitudes y monitoreo multimedia integrado a la suite Sonarr, Radarr y qBittorrent.
- **UniCalendar AI:** Aplicación web integral para ingesta curricular multiformato (PDF, Word, Canvas LMS), protección de recesos institucionales y sincronización con Google Calendar.
- **JD Watch Controller:** Captura de telemetría inercial (acelerómetro y giroscopio a 50Hz) y hápticos en Wear OS para emulación de controles de videojuegos.
- **AD-BSA:** Metaheurística continua de optimización exploratoria (IEEE CEC 2020) con barreras cosecantes y auditoría mecanicista.
- **Ni Idea:** Consola de party game multijugador en tiempo real sobre Cloudflare Durable Objects, WebSockets y Canvas.

---

## 🐳 Ejecución con Docker (1-Click Run)

El proyecto está 100% containerizado con Docker multi-stage y usuario no privilegiado:

```bash
# 1. Clonar el repositorio
git clone https://github.com/Pipin333/feliperiquel.me.git
cd feliperiquel.me

# 2. Copiar variables de entorno
cp .env.example .env

# 3. Construir y levantar el contenedor
docker compose up --build
```

Abre tu navegador en: [http://localhost:4321](http://localhost:4321)

---

## 💻 Desarrollo Local (Nativo)

### Requisitos previos
- Node.js 22.x o superior
- npm 10.x o superior

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo en vivo
npm run dev

# Compilar para producción (Vercel Ready)
npm run build

# Ejecutar validación y sitemap diff (QA Gate)
npm test

# Previsualizar el build estático
npm run preview

# Instalar Git hooks locales (pre-push y commit-msg)
npm run setup:hooks
```

---

## 🌿 Arquitectura Git y Flujo de Ramas

El repositorio utiliza una topología de ramas estructurada con integración en `dev` y producción protegida en `main`:

```text
[main] (Producción / Vercel Live)
  ▲
  │ (Releases probadas)
[dev]  (Integración y staging continuo)
  ▲
  ├── feat/<nombre-en-kebab-case>      (Nuevas páginas o funcionalidades)
  ├── fix/<nombre-en-kebab-case>       (Corrección de errores)
  ├── chore/<nombre-en-kebab-case>     (Dependencias, tooling, scripts)
  ├── refactor/<nombre-en-kebab-case>  (Mejoras de código)
  ├── docs/<nombre-en-kebab-case>      (Documentación y guías)
  └── test/<nombre-en-kebab-case>      (Pruebas y fixtures)
```

### Reglas obligatorias:
1. **Ramas troncales**: `main` (solo releases) y `dev` (desarrollo activo).
2. **Feature branches**: Ramas creadas desde `dev` con prefijo explícito (`feat/`, `fix/`, `chore/`, etc.) y nombre en minúsculas separado por guiones.
3. **Conventional Commits**: `<tipo>(<alcance>): <descripción>` con un máximo de 72 caracteres en el encabezado.
4. **Hooks automáticos**: Ejecuta `npm run setup:hooks` para activar la validación de `pre-push` (rechaza ramas fuera de estándar) y `commit-msg` (valida Conventional Commits).
5. Consulta la guía completa en [docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md).

---

## 🛠️ Estructura del Proyecto

```text
├── src/
│   ├── components/
│   │   ├── Header.astro          # Navegación accesible y estado de disponibilidad
│   │   ├── Hero.astro            # Perfil Software Engineer & Builder y pilares técnicos
│   │   ├── LabShowcase.astro     # Destacado interactivo de las herramientas del /lab
│   │   ├── WorkShowcase.astro    # Casos de estudio y repositorios de código abierto
│   │   ├── DynamicDock.astro     # Isla dinámica y consola interactiva flotante (CLI)
│   │   ├── ContactGateway.astro  # Canales directos y formulario conectado a /api/contact
│   │   ├── Footer.astro          # Navegación, políticas y enlaces de pie de página
│   │   └── Icon.astro            # Renderizador en build-time de íconos SVG (Bootstrap Icons)
│   ├── pages/
│   │   ├── index.astro           # Portafolio principal orientado a software y lab
│   │   ├── sobre-mi.astro        # Perfil editorial, trayectoria real, templanza y música
│   │   ├── proyectos.astro       # Catálogo completo con desglose de tres por qué
│   │   ├── cv.astro              # Currículum interactivo bilingüe (ES/EN) listo para imprimir
│   │   ├── mantencion.astro      # Estado 503 / Recalibración técnica y telemetría (alias /mantenimiento)
│   │   ├── ni-idea.astro         # Alias y redirección canónica hacia /lab/quiz
│   │   ├── 404.astro             # Terminal interactiva de recuperación ante errores 404
│   │   ├── privacidad.astro      # Política de privacidad y tratamiento de datos
│   │   ├── terminos.astro        # Términos y condiciones de uso del software
│   │   ├── api/
│   │   │   ├── contact.ts        # Endpoint serverless: rate limiting, Supabase, Resend y tickets VIP
│   │   │   └── lab/
│   │   │       └── retorica.ts   # Proxy serverless anti-SSRF para inferencia BYOK LLM
│   │   └── lab/
│   │       ├── index.astro       # Hub central del Laboratorio & Playground
│   │       ├── retorica.astro    # Transmutador ontológico de prosa técnica (Heurístico + BYOK)
│   │       ├── copete.astro      # Cuánto Rinde (optimizador de insumos, repo: calculadoracopete)
│   │       ├── quiz.astro        # Ni Idea Party Game (Teaser interactivo, blueprint y lista de espera VIP)
│   │       ├── ni-idea.astro     # Alias y redirección canónica hacia /lab/quiz
│   │       └── sonicrip.astro    # SonicRip Studio (8-band EQ & batch yt-dlp)
│   ├── layouts/
│   │   └── Layout.astro          # SEO, OpenGraph, JSON-LD (Person + WebSite) y enlace a llms.txt
│   └── styles/
│       └── global.css            # Tokens de diseño, tipografía fluida y animaciones
├── docs/
│   ├── adr/                      # Architecture Decision Records (ADRs)
│   └── ni-idea/                  # Documentos directores congelados (BRIEF, BRAND y README)
├── scripts/
│   └── supabase-schema.sql       # Esquema PostgreSQL con tabla contact_messages y RLS
├── public/
│   ├── og-image.png              # Tarjeta social de previsualización 1200x630
│   ├── apple-touch-icon.png      # Ícono 180x180 para iOS
│   ├── manifest.webmanifest      # Manifest web (nombre, colores, íconos)
│   ├── sitemap.xml               # Mapa canónico del sitio
│   ├── robots.txt                # Directivas de rastreo con exclusiones de seguridad
│   └── llms.txt                  # Manifiesto estructurado para agentes de inteligencia artificial
├── astro.config.mjs              # Configuración de Astro con @astrojs/vercel
├── vercel.json                   # Cabeceras de seguridad HTTP globales
├── Dockerfile                    # Multi-stage production container
├── docker-compose.yml            # Orquestación lista para correr
└── package.json                  # Dependencias y scripts
```

---

## 🔐 Variables de Entorno

Copia el archivo `.env.example` a `.env` para desarrollo local o configúralas en tu panel de Vercel:

| Variable | Propósito | Requerido |
| :--- | :--- | :--- |
| `PUBLIC_SITE_URL` | URL pública canónica (`https://feliperiquel.me`) | Sí |
| `SUPABASE_URL` | URL de tu proyecto PostgreSQL en Supabase | Opcional (persistencias) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio para inserción segura en Supabase | Opcional (persistencias) |
| `RESEND_API_KEY` | Clave API de Resend para notificaciones y auto-mailer | Opcional (correos) |
| `RESEND_FROM_EMAIL` | Remitente verificado en Resend | Opcional (default provisto) |
| `CONTACT_NOTIFICATION_EMAIL` | Correo donde recibirás alertas de nuevos mensajes | Opcional (default institucional) |
| `PUBLIC_WHATSAPP_NUMBER` | Número para el enlace directo de chat en WhatsApp | Opcional |
