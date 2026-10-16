# feliperiquel.me

Sitio web personal y puerta de entrada comercial (*gateway*) para servicios de desarrollo y renovación web de **Felipe Riquelme**. Construido sobre **Astro**, **Tailwind CSS** y optimizado para una puntuación de 100/100 en Google Lighthouse, accesibilidad WCAG 2.2 AA y costo \$0 de mantenimiento de servidor.

---

## 🎁 Integraciones del GitHub Student Developer Pack

Este proyecto aprovecha beneficios clave incluidos en el **GitHub Student Developer Pack**:

1. **Dominio `.me` Gratuito (Namecheap):**
   - 1 año de registro gratuito para `feliperiquel.me` + protección de privacidad WhoisGuard y SSL.
2. **Hosting Estático Global (GitHub Pages):**
   - Alojamiento en servidores CDN globales de GitHub con HTTPS automático y despliegue continuo mediante GitHub Actions.
3. **Stripe (Pasarela de Pagos Segura):**
   - Exención de comisiones en los primeros \$1,000 USD procesados para cobro de señas, proyectos o catálogos sin recargos.
4. **Testmail.app (Testing Transaccional):**
   - Entorno de pruebas automatizado para garantizar la entregabilidad de correos y formularios sin caer en carpetas de spam.

---

## 🐳 Ejecución con Docker (1-Click Run)

El proyecto está 100% containerizado con Docker multi-stage y usuario no privilegiado:

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/feliperiquel.me.git
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

# Compilar para producción
npm run build

# Previsualizar el build de producción
npm run preview
```

---

## 🌐 Configuración del Dominio en Namecheap para GitHub Pages

Para vincular tu dominio `feliperiquel.me` canjeado en Namecheap con este repositorio:

1. En tu repositorio de GitHub, ve a **Settings > Pages**.
2. En **Custom domain**, escribe `feliperiquel.me` y activa **Enforce HTTPS**.
3. En el panel de control de **Namecheap** (Advanced DNS), crea los siguientes registros:

| Tipo | Host | Valor / Destino | TTL |
| :--- | :--- | :--- | :--- |
| **A Record** | `@` | `185.199.108.153` | Automático |
| **A Record** | `@` | `185.199.109.153` | Automático |
| **A Record** | `@` | `185.199.110.153` | Automático |
| **A Record** | `@` | `185.199.111.153` | Automático |
| **CNAME** | `www` | `tu-usuario.github.io` | Automático |

*(El archivo [`public/CNAME`](./public/CNAME) ya está incluido en el repositorio para que GitHub Pages mantenga tu dominio en cada despliegue).*

---

## 🛠️ Estructura del Proyecto

```text
├── .github/workflows/deploy.yml   # Despliegue automático a GitHub Pages
├── public/
│   ├── CNAME                     # Dominio personalizado para GitHub Pages
│   └── favicon.svg               # Identidad visual e icono SVG
├── src/
│   ├── components/
│   │   ├── Header.astro          # Navegación accesible, estado de disponibilidad
│   │   ├── Hero.astro            # Propuesta de valor, métricas y CTAs
│   │   ├── PainPoints.astro      # Diagnóstico comparativo (problemas vs soluciones)
│   │   ├── Services.astro        # 3 paquetes de servicios detallados
│   │   ├── WorkShowcase.astro    # Casos de estudio y resultados verificados
│   │   ├── StudentPackPerks.astro # Infraestructura Stripe, Testmail y Edge
│   │   ├── Process.astro         # Metodología de trabajo en 4 pasos
│   │   ├── InteractiveEstimator.astro # Simulador en tiempo real con WhatsApp
│   │   ├── ContactGateway.astro  # Formulario accesible y botón flotante
│   │   └── Footer.astro          # Créditos, enlaces y derechos
│   ├── layouts/
│   │   └── Layout.astro          # SEO, OpenGraph, JSON-LD Schema
│   └── styles/
│       └── global.css            # Tokens Tailwind, fluid typography, motion
├── Dockerfile                    # Multi-stage production container
├── docker-compose.yml            # Orquestación lista para correr
└── package.json                  # Dependencias y scripts
```
