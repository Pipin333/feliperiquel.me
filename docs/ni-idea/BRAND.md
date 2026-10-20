# BRAND: Ni Idea

## 1. Material y Origen Visual
La paleta proviene de objetos físicos de juego de mesa nocturno: fieltro verde esmeralda de mesa de ruleta, dados marfil pulido, peones y fichas carmesí sobre el chasis oscuro del portafolio feliperiquel.me.

## 2. Tokens de Color (Bloqueados)
- **Canvas / Background**: `#030712` (negro técnico profundo)
- **Surface / Fieltro**: `#061814` (verde bosque profundo)
- **Surface Raised / Card**: `#0B241E` (fieltro elevado)
- **Border Subtle**: `#064E3B` (verde esmeralda oscuro, 20% a 40% opacidad)
- **Border Focus / Glow**: `#10B981` (resplandor esmeralda de ruleta)
- **Accent Primary**: `#10B981` (esmeralda mesa de juego)
- **Text on Accent**: `#022C22` (verde tinta profundo de alto contraste, 11.2:1 WCAG AAA)
- **Accent Secondary / Alerta**: `#F43F5E` (carmesí de naipe y ruleta)
- **Text on Secondary**: `#FFFFFF` (blanco puro)
- **Text Primary**: `#F8FAFC` (blanco marfil de dado)
- **Text Muted**: `#94A3B8` (gris técnico sin deslumbramiento)

Cero sustituciones por paletas genéricas de Tailwind o frameworks.

## 3. Tipografía y Escala
- **Display Font**: Space Grotesk (pesos 700 y 800)
- **Body Font**: Inter (pesos 400, 500 y 600)
- **Mono / Códigos de Sala**: Fira Code (pesos 500 y 700)

### Escala de Tamaños
- **Título de Consola**: 2.5rem a 3.5rem (Space Grotesk, letter-spacing: -0.03em)
- **Código PIN de Sala**: 2rem a 2.75rem (Fira Code, letter-spacing: 0.25em, mayúsculas forzadas)
- **Bajada / Soporte**: 1rem a 1.125rem (Inter, letter-spacing: -0.01em)
- **Etiquetas y Metadatos**: 0.75rem (Fira Code, letter-spacing: 0.05em, uppercase)

## 4. Forma, Composición y Fondo
- **Forma del sitio**: Una sola vista fija sin scroll (one viewport game console).
- **Elemento que carga la página**: La estructura de consola de juego centralizada.
- **Composición en una frase**: Panel central de operaciones suspendido con ranura para código de sala de cuatro caracteres y selector doble anfitrión/invitado flanqueado por marcas de agua técnicas de ruleta y cartas de juego.
- **Márgenes de borde (Gutter)**: 16px en móvil menor a 640px; 32px en escritorio.
- **Tratamiento de Fondo y Superficie Técnica**:
  - **Grid de Papel Milimétrico**: Cuadrícula base de 28px con líneas finas de 0.5px en tono esmeralda/gris técnico (`opacity: 0.05`).
  - **Efecto Linterna / Spotlight Interactivo**: Capa superior de grid reactiva al cursor que sigue las variables `--mouse-x` y `--mouse-y` con una máscara radial (`mask-image: radial-gradient(380px circle at var(--mouse-x) var(--mouse-y), black 20%, rgba(0,0,0,0.3) 65%, transparent 100%)`).
  - **Marcas de Agua Blueprints (1px Stroke)**: Ilustraciones técnicas perimetrales de una ruleta de casino seccionada y dados isométricos en trazo fino (opacidad 0.07 a 0.20 al interactuar), asegurando un fondo denso y poblado sin perjudicar la legibilidad.
- **Pila de capas (Layer Stack)**:
  - Fondo Canvas y Grid Milimétrico Base (`z-0`)
  - Marcas de Agua Técnicas y Spotlight Radial (`z-0`)
  - Consola Central de Interacción (`z-10`)
  - Diálogos y Modales de Error / Espera (`z-50`)

## 5. Elemento Característico (Signature Element)
- **Qué es**: El cajetín de sala con cuatro ranuras de caracteres en monospaciado (`_ _ _ _`), con cursor pulsante y borde esmeralda que se ilumina al completar el código válido.
- **Dónde vive**: Centro de la consola de juego.
- **En móvil (375px)**: El teclado virtual activa solo caracteres mayúsculos alfanuméricos y salta automáticamente de ranura.
- **Con prefers-reduced-motion**: El foco es un borde verde sólido de 2px sin animación pulsante.

## 6. Inventario de Interacción y Movimiento
- **Entrada a la página**: Fundido de opacidad suave de 200ms sobre la consola central.
- **Botón Crear Sala**:
  - Reposo: Fondo gradiente esmeralda a verde azulado con texto verde tinta.
  - Hover: Elevación de -1px y sombra suave `shadow-[0_0_20px_rgba(16,185,129,0.3)]`.
  - Active: Escala 0.98.
- **Botón Unirse**:
  - Reposo: Fondo `#061814` con borde `#064E3B` y texto marfil.
  - Hover: Borde `#10B981` y texto blanco.
- **Curva de transición única**: `cubic-bezier(0.16, 1, 0.3, 1)` con duración de 140ms.
- Cero animaciones con scroll, cero librerías pesadas de motion.

## 7. Reglas de Puntuación
Prohibido el uso de rayas em y rayas en en cualquier texto o etiqueta. Usar puntos, comas o dos puntos.
