# Build Brief: feliperiquel.me

## PROJECT
- Propietario: Felipe Riquelme.
- Audiencia principal: Líder técnico y reclutador de ingeniería con capacidad de decisión técnica.
- Registro de voz: Técnico y lúdico (playground interactivo con rigor ingenieril).
- Acción principal tras 90 segundos: Probar las herramientas interactivas del laboratorio y abrir canal de contacto directo por WhatsApp o correo institucional.

## STACK
- Framework: Astro 5 con Tailwind CSS.
- Modo de build: 100% estático (Static Site Generation), con adaptador oficial `@astrojs/vercel`.
- Despliegue: Vercel continuo desde el repositorio en GitHub (`Pipin333/feliperiquel.me`).
- Dependencias cliente: Cero dependencias pesadas en tiempo de ejecución. Uso nativo de Web Audio API, Canvas y Clipboard API.

## CONTENT

### Portada y Hero
- Frase de apertura (Opening): "Ideo soluciones sólidas hasta para el problema más mundano."
- Oración de apoyo (Support): "En este sitio encontrarás mis proyectos destacados y mi laboratorio de pruebas. Soy Felipe Riquelme: desarrollador detallista, con foco ingenieril y recién entrando al mercado."
- Acciones principales (Actions):
  - Botón primario: "Explorar el Laboratorio" (enlace a `/lab`).
  - Botón secundario: "Ver Proyectos" (ancla a `#proyectos`).
- Consola interactiva: Terminal compacta en la portada con comandos interactivos en vivo (`help`, `lab`, `whoami`, `contact`, `clear`).

### Módulo del Laboratorio (/lab)
Cuatro herramientas ejecutables directamente en el cliente:
1. SonicRip Studio: Procesador de audio y ecualizador paramétrico de 8 bandas con filtros biquad, bitcrusher digital y analizador FFT.
2. Retórica y Descalabro: Transmutador ontológico de lenguaje cotidiano a prosa decimonónica y diplomática con simulación de teléfono descompuesto.
3. Calculadora de Copete: Optimizador logístico y presupuestario en pesos chilenos ($ CLP) con exportación a WhatsApp.
4. Quiz In-House: Trivia interactiva cronometrada de 10 preguntas sin anuncios ni pantallas de espera.

### Proyectos de Ingeniería y Repositorios (#proyectos)
Cinco proyectos reales con pestaña interactiva "Por qué":
1. Toodles: Bot de Telegram para orquestación de descargas multimedia hacia Plex.
2. Whatsarr: Conversational bridge en WhatsApp para solicitudes de series y películas con Sonarr, Radarr y Plex.
3. UniCalendar AI: Aplicación web de ingesta curricular multiformato y sincronización inteligente con Google Calendar.
4. JD Watch Controller: Captura de telemetría inercial y hápticos en Wear OS para videojuegos de ritmo.
5. AD-BSA: Metaheurística bioinspirada de optimización continua evaluada sobre el benchmark IEEE CEC 2020.

Cada tarjeta incluye el desglose de tres preguntas:
- Origen: ¿Por qué nació esta solución?
- Arquitectura: ¿Por qué se tomaron estas decisiones técnicas?
- Presencia: ¿Por qué se exhibe en este portafolio?

### Canales de Contacto (#contacto)
- WhatsApp directo con mensaje precargado.
- Correo institucional `f.riquelmesalvo@uandresbello.edu` con botón de copia en un clic.
- Enlace directo al perfil y repositorios de GitHub (`@Pipin333`).
- Formulario directo de mensaje accesible para quienes prefieran escribir desde la web.

### Lo que queda fuera (Cut / Non-goals)
- Prohibidas las métricas, descargas o porcentajes inventados.
- Prohibidas las tablas de precios, paquetes de servicios o estimadores de consultoría.
- Prohibidos los testimonios ficticios de clientes.
- Prohibido el texto inflado con clichés de inteligencia artificial.
- Prohibidos los em dashes y los en dashes en cualquier texto o metadato.

## SHAPE & COMPOSITION
- Estructura: Una página principal continua y accesible (`/`) con navegación por anclas, complementada por la suite del laboratorio en subrutas (`/lab`, `/lab/sonicrip`, etc.).
- Composición: Cuadrícula asimétrica y limpia con bordes técnicos de 6px, inspirada en consolas de sistemas como PaperMC Velocity y Spotify.
- Gutter: 16px en pantallas menores a 640px, 32px en pantallas medianas, 48px en escritorio.
- Fondo: Obsidiana `#07090E` con superficies en `#0F1420` y bordes en `#1B2338`.
- Acento: Cian eléctrico `#00D2FF` con toques funcionales en menta `#10B981` y violeta `#6366F1`.

## SIGNATURE ELEMENTS
1. Consola interactiva en el Hero: Permite interacción inmediata mediante teclado o botones de sugerencias. En pantallas móviles de 375px se simplifica a botones rápidos sin perder funcionalidad.
2. Desplegable "Por qué": Acordeón de baja latencia en cada proyecto que revela el criterio de ingeniería sin saturar la vista inicial.
3. Resplandor de cursor (Spotlight Glow): Efecto reactivo al puntero sobre tarjetas y títulos que ilumina sutilmente superficies y bordes técnicos vía variables CSS locales, con desactivación limpia en pantallas táctiles y bajo preferencias de movimiento reducido.

## QUALITY FLOOR
- 100/100 en Google Lighthouse para rendimiento, accesibilidad, mejores prácticas y SEO.
- WCAG 2.2 AA cumplido: ratios de contraste de al menos 4.5:1, etiquetas de formulario explícitas y navegación completa por teclado con `:focus-visible` marcado en cian.
- Cero saltos de diseño (CLS = 0).
- Tiempo de compilación inferior a 4 segundos en entorno local y Vercel.
