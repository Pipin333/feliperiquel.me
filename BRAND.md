# Sistema Visual y Tokens de Marca: feliperiquel.me

## Frase Material
"Terminal obsidiana de alto rendimiento, carbón de servidor homelab y cian eléctrico de telemetría de red, con acentos funcionales en menta de audio y violeta de IA."

## Tokens Bloqueados

### Paleta Principal
- `--bg`: `#07090E` (Obsidiana profunda)
- `--surface`: `#0F1420` (Superficie de consola)
- `--surface-raised`: `#161D2E` (Superficie elevada / hover)
- `--border`: `#1B2338` (Línea técnica de estructura)
- `--border-subtle`: `#131929` (Separador tenue)
- `--text`: `#EBF1F5` (Texto de alto contraste)
- `--muted`: `#7A889B` (Texto secundario y metadatos)
- `--accent`: `#00D2FF` (Cian eléctrico de telemetría)
- `--on-accent`: `#021824` (Texto oscuro sobre cian)

### Acentos Funcionales de Dominio
- `--accent-audio`: `#10B981` (Menta eléctrica para herramientas de audio y DSP)
- `--accent-ai`: `#6366F1` (Violeta para inteligencia artificial y EdTech)
- `--accent-algo`: `#F43F5E` (Rosa coral para optimización algorítmica y research)

### Geometría y Bordes
- `--radius`: `6px` (Bordes técnicos y precisos, no píldoras genéricas)
- `--radius-inner`: `4px`
- `--focus-ring`: `0 0 0 2px #07090E, 0 0 0 4px #00D2FF`

### Tipografía
- Headings y Display: `Space Grotesk`, sans-serif (pesos 700 y 800)
- Lectura y Cuerpo: `Inter`, system-ui, sans-serif (pesos 400 y 500)
- Código, Comandos y Tags: `Fira Code` o `JetBrains Mono`, monospace (pesos 500 y 600)

### Escala Tipográfica y Tracking
- Hero Display: `clamp(2rem, 4.5vw, 3.25rem)`, interlineado 1.15, tracking `-0.03em`.
- Título de Sección: `clamp(1.5rem, 3vw, 2rem)`, interlineado 1.25, tracking `-0.02em`.
- Subtítulos: `1.125rem` (18px), interlineado 1.5, tracking `-0.01em`.
- Cuerpo: `0.9375rem` (15px) a `1rem` (16px), interlineado 1.6, tracking normal.
- Monospace / Metadatos: `0.8125rem` (13px), interlineado 1.4, tracking normal.

### Coreografía y Transiciones
- Duración base: `140ms`
- Curva de aceleración: `cubic-bezier(0.16, 1, 0.3, 1)`
- Propiedades animables: únicamente `transform`, `opacity`, `border-color` y `background-color`. Cero reflow de layout.
- Modo de movimiento reducido (`prefers-reduced-motion: reduce`): transiciones en 0ms, todas las vistas se presentan completas en su estado de reposo.

### Elementos Insignia (Signature Moves)
1. **Consola Interactiva en el Hero:** Terminal compacta y funcional en el primer pliegue que permite tipear o hacer clic en comandos rápidos (`help`, `lab`, `whoami`, `contact`, `clear`) para navegar o disparar acciones directas.
2. **Pestaña Arquitectónica "Por qué":** Cada tarjeta de proyecto incluye un conmutador accesible que despliega el razonamiento técnico:
   - Origen del problema real que motivó la solución.
   - Decisiones y trade-offs de arquitectura seleccionados.
   - Por qué amerita estar publicado en el portafolio.
3. **Foco Interactivo de Cursor (Spotlight Glow):** En tarjetas y títulos seleccionados, un resplandor sutil sigue la posición del puntero mediante variables CSS (`--mouse-x`, `--mouse-y`), iluminando bordes técnicos y superficies sin alterar el rendimiento ni disparar reflows. En modo de movimiento reducido o dispositivos táctiles permanece fijo y atenuado.

### Reglas Estrictas
- Cero em dashes y cero en dashes en cualquier texto o código generado.
- Cero métricas o estadísticas inventadas.
- Cero testimonios o cotizaciones de consultoría.
- Todo elemento interactivo debe responder en hover, focus visible y active.
