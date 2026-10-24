# ADR-0003: QA Determinista de Rutas contra Línea Base de Sitemap

- **Estado**: Aceptado
- **Fecha**: 2026-10-23
- **Decisores**: Felipe Riquelme, Agente Antigravity

---

## 1. Contexto y Problema

A medida que el portafolio creció en complejidad (rutas de micro-aplicaciones en `/lab/*`, páginas legales `/privacidad` y `/terminos`, catálogo `/proyectos` y la página editorial autónoma `/sobre-mi`), existía un riesgo significativo de **regresiones silenciosas en el enrutamiento**:
- Archivos `.astro` eliminados, renombrados o mal configurados que dejasen de compilar rutas sin arrojar error fatal.
- Rutas canónicas indexadas por motores de búsqueda que desaparecieran del `sitemap-index.xml`.
- Falta de un mecanismo determinista y veloz en la suite de pruebas local (`npm test`) para certificar que el catálogo de URLs públicas se mantuviese idéntico tras cada refactorización.

---

## 2. Decisión

1. **Crear script determinista de validación (`scripts/qa-validate.mjs`)**: Desarrollar un evaluador ligero en Node.js que:
   - Ejecuta `astro build` para generar el sitio estático y el sitemap de producción.
   - Lee el archivo generado `dist/client/sitemap-0.xml`.
   - Compara el árbol canónico de URLs contra un archivo congelado de control: `.qa-sitemap-baseline.xml`.
   - Falla con código de salida `1` si detecta rutas faltantes o sobrantes no planificadas.
2. **Integrar al comando estándar `npm test`**: Vincular la ejecución de este script en `package.json` para que cualquier agente o desarrollador deba validar el sitemap antes de abrir PRs o promover cambios a producción.
3. **Flujo de modificación explícita de línea base**: Si una nueva página es creada intencionalmente (como ocurrió con `/sobre-mi`), el desarrollador o agente debe actualizar deliberadamente `.qa-sitemap-baseline.xml` como parte del commit atómico.

---

## 3. Alternativas Consideradas

- **Tests End-to-End con Playwright/Cypress navegando cada URL**:
  - *Ventaja*: Valida además la renderización visual en el navegador.
  - *Desventaja*: Tiempos de ejecución lentos (1-2 minutos), dependencia de binarios de navegadores instalados y lentitud para iteraciones frecuentes de contenido o estilos.
- **Auditoría manual o inspección ocular de `git diff`**:
  - *Ventaja*: Cero código adicional.
  - *Desventaja*: Alta probabilidad de error humano y amnesia entre agentes de IA en sesiones concurrentes.
- **Confiar ciegamente en la integración `@astrojs/sitemap`**:
  - *Ventaja*: No requiere scripts de verificación.
  - *Desventaja*: La integración solo genera el archivo; si una ruta deja de compilar o se excluye por un error de sintaxis, la integración genera un sitemap incompleto sin advertir de la regresión.

---

## 4. Consecuencias

### Positivas
- Verificación ultra veloz (**< 1 segundo**) tras la compilación estática.
- Protección total contra la rotura accidental de enlaces permanentes indexados en Google y Bing.
- Detección inmediata en CI/local si un refactor o eliminación de componente rompe una ruta pública.

### Negativas / Mitigaciones
- Al agregar una nueva página legítima al sitio, el comando `npm test` fallará intencionalmente hasta que la nueva URL sea incorporada a `.qa-sitemap-baseline.xml`. Este comportamiento es una salvaguarda por diseño (*safety rail*).
