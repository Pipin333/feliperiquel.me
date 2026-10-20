# Arquitectura Git y Flujo de Trabajo (Git Workflow)

Este repositorio adopta un modelo de integración continua estructurado y disciplinado para garantizar estabilidad en producción y agilidad durante el desarrollo.

---

## 1. Topología de Ramas

```
[main] (Producción / Vercel Live)
  ▲
  │ (Release / PR validado)
[dev]  (Integración / Staging)
  ▲
  ├── feat/<slug-kebab-case>      (Nuevas funcionalidades / páginas)
  ├── fix/<slug-kebab-case>       (Corrección de errores / bugs)
  ├── chore/<slug-kebab-case>     (Dependencias, tooling, scripts)
  ├── refactor/<slug-kebab-case>  (Refactorización sin cambio externo)
  ├── docs/<slug-kebab-case>      (Documentación y especificaciones)
  └── test/<slug-kebab-case>      (Cobertura de pruebas y fixtures)
```

### 1.1 Ramas Troncales (Protegidas)
- **`main`**: Rama de producción directa sincronizada con el despliegue automático en Vercel. Solo debe recibir fusiones probadas y verificadas provenientes de `dev` (o hotfixes críticos de emergencia vía `fix/*`).
- **`dev`**: Rama central de integración. Todo nuevo desarrollo, refactor o ajuste se origina desde aquí y se integra de vuelta hacia `dev`.

### 1.2 Ramas de Trabajo (Prefijos Estandarizados)
Toda rama de trabajo temporal debe adoptar nomenclatura en **kebab-case** en minúsculas y comenzar estrictamente con uno de los siguientes prefijos:

| Prefijo | Propósito | Ejemplo |
| :--- | :--- | :--- |
| `feat/` | Nuevas páginas, utilidades o componentes interactivos | `feat/pagina-mantencion` |
| `fix/` | Reparación de defectos, bugs de UI o APIs | `fix/error-cors-contacto` |
| `chore/` | Mantenimiento de paquetes, configs, Docker, hooks | `chore/actualizar-deps` |
| `refactor/` | Reestructuración de código sin alterar funcionalidad | `refactor/modularizar-dock` |
| `docs/` | Cambios exclusivos en documentación técnica o guías | `docs/flujo-git` |
| `test/` | Tests automatizados, regresiones o fixtures | `test/gate-verificacion` |
| `ci/` | Automatización de flujos CI/CD o GitHub Actions | `ci/configurar-linter` |

---

## 2. Convención de Mensajes de Commit (Conventional Commits)

Los commits deben seguir el estándar de **Conventional Commits**:

```
<tipo>(<alcance opcional>): <descripción concisa en imperativo>
```

- **Límite de encabezado**: Máximo 72 caracteres.
- **Tipos válidos**: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`.
- **Ejemplos**:
  - `feat(ui): implementar pagina de mantencion y redireccion 503`
  - `fix(contact): corregir validacion de formato de email`
  - `chore(git): instalar hook de validacion de commits y ramas`
  - `docs(readme): documentar ramas dev y convenciones de trabajo`

---

## 3. Ciclo de Trabajo Paso a Paso

### Paso 1: Sincronizar y crear la rama desde `dev`
```bash
# Cambiarse a dev y actualizar
git checkout dev
git pull origin dev

# Crear tu rama de trabajo
git checkout -b feat/mi-nueva-funcion
```

### Paso 2: Desarrollar, probar y commitear
```bash
# Verificar compilación local
npm run build

# Agregar cambios y commitear siguiendo la convención
git add .
git commit -m "feat(modulo): agregar soporte para XYZ"
```

### Paso 3: Integrar en `dev`
```bash
# Opción A: Vía Pull Request en GitHub (Recomendado)
git push -u origin feat/mi-nueva-funcion
# Crear PR con base: dev

# Opción B: Merge local en dev
git checkout dev
git pull origin dev
git merge --no-ff feat/mi-nueva-funcion
git push origin dev

# Eliminar rama de trabajo local
git branch -d feat/mi-nueva-funcion
```

### Paso 4: Despliegue a Producción (`main`)
Cuando `dev` esté probado y listo para release a producción:
```bash
git checkout main
git pull origin main
git merge --no-ff dev
git push origin main
```

---

## 4. Automatización con Git Hooks

El repositorio dispone de validaciones locales automáticas:
- **`commit-msg`**: Bloquea mensajes que no cumplan con Conventional Commits.
- **`pre-push`**: Bloquea el envío de ramas remotas que no sigan los prefijos autorizados (`main`, `dev`, `feat/*`, `fix/*`, etc.).
