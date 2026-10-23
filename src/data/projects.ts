// src/data/projects.ts

export interface ArchitectureRationale {
  origin: string;
  decisions: string;
  whyShown: string;
}

export interface Project {
  id: string;
  title: string;
  category: string;
  tldr: string;
  description: string;
  tags: string[];
  githubUrl?: string;
  license?: string;
  statusBadge: string;
  accentBadgeColor: string;
  rationale: ArchitectureRationale;
}

export const projects: Project[] = [
  {
    id: "toodles",
    title: "Toodles",
    category: "Audio Streaming & Machine Learning",
    tldr: "Bot de audio para Discord con streaming directo Opus (< 0.5% CPU en ARM64) y motor de recomendación musical híbrido (ALS + Item2Vec).",
    description: "Motor de streaming de audio para Discord de alto rendimiento y baja latencia desplegado en contenedores Docker sobre arquitectura ARM64 (Oracle Cloud). Integra extracción nativa con yt-dlp, streaming WebM/Opus directo vía FFmpeg sin transcodificación pesada (< 0.5% CPU) y un motor de recomendación musical híbrido (Implicit ALS + Item2Vec + vectores acústicos) con persistencia de colas ante reinicios.",
    tags: ["Discord Bot", "Python (asyncio)", "RecSys (ALS + Item2Vec)", "FFmpeg Opus", "yt-dlp", "Docker / ARM64", "SQLAlchemy"],
    githubUrl: "https://github.com/Pipin333/Toodles",
    statusBadge: "Open Source",
    accentBadgeColor: "text-domain-audio border-domain-audio/30 bg-domain-audio/10",
    rationale: {
      origin: "Los bots de música convencionales en Discord colapsaban frecuentemente por bloqueos de CDN de YouTube (HTTP 403/429), saturaban la CPU por re-codificaciones innecesarias y carecían de recomendación inteligente al agotarse la cola de reproducción.",
      decisions: "Se estructuró una arquitectura en Python asíncrono con buffer híbrido de 3 niveles (reproducción activa, descarga en caché atómica de la siguiente pista en /tmp y pre-resolución en segundo plano). El passthrough de cabeceras HTTP de yt-dlp hacia FFmpeg elimina los bloqueos 403 sin sobrecargar la CPU. El motor RecSys entrena modelos ALS e Item2Vec cada 6 horas limitando hilos con threadpoolctl y serializa la cola en SQLite con WAL para cero pérdida de canciones ante reinicios (graceful drain).",
      whyShown: "Demuestra ingeniería de audio en tiempo real, modelado matemático de recomendación (Machine Learning embebido con inferencia en < 10 ms), orquestación en contenedores ARM64 y despliegues sin tiempo de inactividad con GitHub Actions CI/CD."
    }
  },
  {
    id: "whatsarr",
    title: "Whatsarr",
    category: "Bots Conversacionales & Media Server",
    tldr: "Gestor multimedia para WhatsApp: solicita series y películas en lenguaje natural, prioriza el episodio 1 y lo envía al home server en minutos.",
    description: "Puente automatizado en WhatsApp basado en Node.js y Baileys para solicitar películas y series en lenguaje natural. Integra extracción de metadatos (TMDB), un motor de priorización progresiva que descarga el Episodio 1 con máxima prioridad en qBittorrent para comenzar a ver en minutos, coordinación con Radarr, Sonarr y Prowlarr, y un Dashboard Web en tiempo real para monitoreo de descargas y salud del sistema.",
    tags: ["Node.js", "Baileys (WhatsApp)", "Radarr / Sonarr", "qBittorrent", "Plex Server", "Docker Compose", "Web Dashboard"],
    githubUrl: "https://github.com/Pipin333/Whatsarr",
    license: "MIT",
    statusBadge: "Open Source",
    accentBadgeColor: "text-telemetry border-telemetry/30 bg-telemetry/10",
    rationale: {
      origin: "Familiares y usuarios no técnicos en el hogar encuentran frustrante o inaccesible entrar por VPN a paneles de gestión como Radarr o Sonarr para pedir contenidos. WhatsApp es la aplicación donde ya conviven diariamente.",
      decisions: "Se empaquetó un microservicio en Docker usando Baileys v6.7 (conexión multi-dispositivo sin la sobrecarga de navegadores Chromium). Se implementó un evaluador de lanzamientos con Fuzzball para filtrar versiones CAM o archivos inflados, y un Progressive Streamer que prioriza el Episodio 1 en qBittorrent (filePrio: 7) para alertar al chat apenas Plex lo indexa mientras el resto de la temporada sigue descargando en segundo plano.",
      whyShown: "Refleja capacidad para diseñar pasarelas conversacionales con i18n (inglés/español), orquestar stacks complejos con Docker Compose y construir interfaces web de monitoreo reactivas sin fricción para el usuario final."
    }
  },
  {
    id: "unicalendar",
    title: "UniCalendar AI",
    category: "EdTech & Planificación Inteligente",
    tldr: "Plataforma web que ingiere programas académicos (PDF/Canvas LMS), extrae evaluaciones con LLMs y las sincroniza en Google Calendar.",
    description: "Aplicación web integral en Next.js para estudiantes y docentes universitarios. Ingiere cronogramas y sílabos en PDF, Word, texto o directamente desde Canvas LMS vía API. Analiza las fechas mediante LLMs con failover multi-proveedor (Google Gemini, Groq, OpenRouter), protege la planificación inyectando el calendario institucional (feriados, recesos y marcha blanca), incluye un simulador de calificaciones y sincroniza eventos con código de colores en Google Calendar.",
    tags: ["Next.js", "TypeScript", "Google Calendar API", "LLMs (Gemini / Groq)", "OAuth 2.0", "SheetJS"],
    githubUrl: "https://github.com/Pipin333/UniCalendar",
    statusBadge: "Publicado / Open Source",
    accentBadgeColor: "text-domain-ai border-domain-ai/30 bg-domain-ai/10",
    rationale: {
      origin: "La dispersión de fechas de certámenes y entregas entre sílabos estáticos en PDF y plataformas como Canvas LMS, lo que provoca olvidos, desorganización y choques imprevistos con semanas de receso institucional o feriados.",
      decisions: "Se construyó una arquitectura en Next.js con soporte multi-proveedor de IA (Google Gemini, Groq y OpenRouter) con failover automático ante cuotas 429. Las fechas inhábiles institucionales se inyectan en el prompt del LLM para blindar los días de descanso. Se incorporó un simulador de notas ponderadas con SheetJS para planillas Excel y sincronización OAuth 2.0 hacia Google Calendar con clasificación por criticidad.",
      whyShown: "Evidencia desarrollo de producto completo de grado de producción, orquestación de LLMs tolerante a fallos, autenticación segura con terceros y diseño de interfaces con cero deuda visual bajo los principios de Impeccable."
    }
  },
  {
    id: "jd-watch",
    title: "JD Watch Controller",
    category: "IoT & Wearables (Wear OS + Android)",
    tldr: "Controlador de movimiento para relojes inteligentes Wear OS: captura inercial a 50 Hz por Bluetooth/Wi-Fi con emulación precisa de puntuación.",
    description: "Controlador de movimiento de código abierto para smartwatches Wear OS (Samsung Galaxy Watch 4, 5, 6, 7 / Pixel Watch) y smartphones Android para Just Dance (PC y mods comunitarios). Captura datos inerciales a 50 Hz exactos con fusión de sensores de 6 ejes (acelerómetro y giroscopio), transmite paquetes binarios Little-Endian por Bluetooth/Wi-Fi y emula el protocolo oficial con la curva de puntuación ponderada auténtica.",
    tags: ["Wear OS", "Android (Kotlin)", "6-Axis IMU Sensors", "Bluetooth ChannelClient", "WebSockets", "Haptics"],
    githubUrl: "https://github.com/Pipin333/jd-watch-controller",
    license: "MIT",
    statusBadge: "Open Source",
    accentBadgeColor: "text-telemetry border-telemetry/30 bg-telemetry/10",
    rationale: {
      origin: "Sostener un teléfono móvil pesado al bailar es peligroso para el dispositivo, incómodo y antinatural. Además, la aplicación móvil oficial carecía de soporte para relojes Wear OS y para servidores comunitarios de PC.",
      decisions: "Se desarrolló en Kotlin nativo para Wear OS y Android. Implementa un protector de batería (Battery Shield) que apaga los sensores IMU y los LEDs PPG en menús reduciendo el gasto de batería hasta en un 80%, navegación por el carrusel de canciones con el bisel rotativo del reloj y calibración matemática de umbrales G-force según la fórmula oficial de Ubisoft para un registro de puntuación fidedigno.",
      whyShown: "Acredita dominio de desarrollo móvil nativo de bajo nivel, sincronización inercial a alta frecuencia (50 Hz), ingeniería de protocolos de red binarios en tiempo real y optimización rigurosa de energía en hardware restringido."
    }
  },
  {
    id: "ad-bsa",
    title: "AD-BSA",
    category: "Computación Científica & Optimización",
    tldr: "Investigación exploratoria en optimización continua: evaluación de aprendizaje negativo explícito, telemetría mecanicista y auditoría rigurosa sobre IEEE CEC 2020.",
    description: "Adaptive Differential Boogeyman Search Algorithm: investigación exploratoria en metaheurísticas continuas que evalúa dinámicas de anti-atractores y escape repulsivo cosecante sobre bases de L-SHADE y jSO. Documenta mediante telemetría mecanicista la latencia del operador por concentración de medida en altas dimensiones (D >= 20), un protocolo PoC pareado con tests de Wilcoxon (n=15) y el hallazgo de un defecto crítico de inversión de signo en la librería científica opfunu (Schwefel).",
    tags: ["Python", "Metaheurísticas", "Auditoría Científica", "L-SHADE / jSO", "NumPy / SciPy", "IEEE CEC 2020"],
    githubUrl: "https://github.com/Pipin333/AD-BSA",
    license: "Apache 2.0",
    statusBadge: "Investigación & Auditoría",
    accentBadgeColor: "text-domain-algo border-domain-algo/30 bg-domain-algo/10",
    rationale: {
      origin: "En paisajes de optimización multimodal, los algoritmos evolutivos canónicos (DE, L-SHADE, CMA-ES) sufren convergencia prematura al guiarse exclusivamente por atracción positiva hacia los mejores individuos. La hipótesis original planteó evacuar valles de engaño mediante aprendizaje negativo explícito, modelando repulsión activa desde baricentros de las peores soluciones.",
      decisions: "Se formuló un operador de mutación tripartito (Atracción Elite + Escape Cosecante + Perturbación Diferencial) con memorias de Lehmer y LPSR. Tras una auditoría exhaustiva de reproducibilidad, la telemetría reveló que en D >= 20 la distancia euclidiana escala como O(sqrt(D) * sigma), manteniendo al operador inactivo en el 99.5% de generaciones. Además, se detectó un defecto matemático en la librería opfunu (Schwefel modificado) que creaba mínimos globales ficticios (-553.79), invalidando métricas previas y motivando un protocolo PoC pareado estricto (360 corridas, Wilcoxon y corrección de Holm-Bonferroni).",
      whyShown: "Acredita honestidad intelectual y rigor analítico en computación científica: no solo diseñar metaheurísticas, sino auditar matemáticamente su formulación, instrumentar telemetría paso a paso para explicar causas raíz en vez de suponer ventajas teóricas, descubrir fallos críticos en librerías científicas upstream y reportar hallazgos con transparencia metodológica."
    }
  },
  {
    id: "niidea",
    title: "Ni Idea",
    category: "Sistemas Distribuidos & Party Game Edge",
    tldr: "Consola de party game en tiempo real para 16 jugadores sobre Cloudflare Durable Objects, WebSockets y Canvas.",
    description: "Consola multijugador interactiva en tiempo real sobre la red Edge de Cloudflare con PartyServer (Durable Objects), WebSockets y Astro. Permite a hasta 16 jugadores conectarse al instante mediante PIN de 4 caracteres desde su navegador móvil para rondas de Trivia Rush, votación social 'Ese Eres Tú' y lienzo táctil colaborativo 'Pinturillo' con coordenadas vectoriales muestreadas a 30 Hz.",
    tags: ["Cloudflare Durable Objects", "PartyServer", "WebSockets", "TypeScript", "Astro 5", "HTML5 Canvas", "Tailwind CSS"],
    githubUrl: "https://github.com/Pipin333/niideaapp",
    license: "MIT",
    statusBadge: "En Vivo / Edge",
    accentBadgeColor: "text-emerald-400 border-emerald-500/30 bg-emerald-950/40",
    rationale: {
      origin: "Los party games tradicionales exigen descargar aplicaciones pesadas, crear cuentas de usuario o tolerar publicidad intrusiva, fragmentando reuniones sociales y dinámicas grupales.",
      decisions: "Se implementó el patrón de actores distribuidos mediante Cloudflare Durable Objects y WebSockets, manteniendo el estado de sala en memoria en el borde más cercano con latencia mínima. Integra proyección asimétrica de estado anti-trampas (la palabra o respuesta correcta no viaja a adivinadores), watchdog anti-AFK de 15 segundos y reconexión transparente sin pérdida de puntuación mediante sessionToken.",
      whyShown: "Evidencia dominio de arquitecturas reactivas en tiempo real con WebSockets, consistencia de estado distribuido en el edge con Cloudflare Durable Objects y desarrollo de experiencias web colaborativas con cero fricción de adopción."
    }
  }
];
