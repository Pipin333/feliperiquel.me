# ADR-0001: Migración a Astro 7, Tailwind 4 y Externalización de Estilos

- **Estado**: Aceptado
- **Fecha**: 2026-10-23
- **Decisores**: Felipe Riquelme, Agente Antigravity

---

## 1. Contexto y Problema

El proyecto operaba sobre Astro 5.3 con la integración oficial `@astrojs/tailwind` y configuraciones heredadas donde los estilos CSS de Tailwind se inyectaban como bloques `<style>` inline en cada documento HTML prerenderizado.

Al evaluar la modernización hacia el motor de Astro 7 y Tailwind CSS v4 para aprovechar el compilador de alto rendimiento basado en Rust/Vite, surgieron tres restricciones críticas:
1. **Incompatibilidad de la integración `@astrojs/tailwind`**: En Astro 7, la integración histórica `@astrojs/tailwind` fue completamente discontinuada en favor de la integración directa vía plugin de Vite (`@tailwindcss/vite`).
2. **Requisitos de versión de Node.js**: Astro >= 7.4.0 introdujo una restricción estricta de entorno que exige Node.js >= 22.23.4. El entorno de desarrollo del host ejecuta Node.js v22.13.1. Intentar instalar Astro 7.4+ producía fallos de compatibilidad en el motor de ejecución.
3. **Inyección de estilos inline vs. Cacheabilidad**: Inyectar estilos inline en cada página duplicaba el peso del HTML transferido y aumentaba el tiempo de parseo en el cliente.

---

## 2. Decisión

1. **Migrar a Astro 7.3.8**: Fijar `astro: "7.3.8"`, versión que soporta Node.js >= 22.12.0 y permite ejecución nativa perfecta en el entorno local (Node 22.13.1) y en los contenedores de CI/Vercel.
2. **Desacoplar `@astrojs/tailwind` y adoptar `@tailwindcss/vite`**: Configurar Tailwind v4 directamente a través del pipeline de Vite en `astro.config.mjs`:
   ```javascript
   import tailwindcss from '@tailwindcss/vite';

   export default defineConfig({
     vite: {
       plugins: [tailwindcss()],
     },
   });
   ```
3. **Externalización obligatoria de estilos**: Configurar `build.inlineStylesheets: 'never'` en `astro.config.mjs` para compilar todo el CSS a un único archivo estático cacheable (`121 KB`), eliminando todos los bloques `<style>` inline del HTML.

---

## 3. Alternativas Consideradas

- **Permanecer en Astro 5.3**:
  - *Ventaja*: Cero riesgo inmediato de migración.
  - *Desventaja*: Pérdida de mejoras de rendimiento de Vite 6 y compilador Rust; deuda técnica acumulada frente al ecosistema de Tailwind 4.
- **Forzar actualización a Astro 7.4+ con actualización de Node.js en el host**:
  - *Ventaja*: Última versión minor disponible.
  - *Desventaja*: Requiere modificar la máquina del usuario anfitrión y los entornos de desarrollo locales, introduciendo fricción operativa innecesaria.
- **Mantener estilos inyectados inline (`inlineStylesheets: 'auto'`)**:
  - *Ventaja*: No genera requests HTTP adicionales para CSS.
  - *Desventaja*: Ineficiente para usuarios que navegan múltiples páginas estáticas; incrementa el HTML de cada ruta en ~120 KB sin posibilidad de cache en navegador.

---

## 4. Consecuencias

### Positivas
- Tiempos de compilación del sitio completo reducidos a **~4.5 segundos**.
- Las páginas estáticas HTML ahora pesan entre **10 KB y 25 KB**, cargando en 10-15 ms.
- El archivo CSS compilado (`_astro/*.css`) se transfiere una sola vez y se cachea permanentemente en el CDN edge de Vercel.

### Negativas / Mitigaciones
- El compilador Rust de Astro 7 es estrictamente intolerante a errores de sintaxis JSX (por ejemplo etiquetas duplicadas o no cerradas). La suite de QA (`npm test`) se encarga de atrapar estos errores antes de cualquier commit.
