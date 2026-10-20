#!/usr/bin/env node
/**
 * Instala automáticamente los hooks de Git locales para validar
 * la arquitectura de ramas y Conventional Commits.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const gitHooksDir = path.resolve(__dirname, '../.git/hooks');

if (!fs.existsSync(gitHooksDir)) {
  console.log('ℹ️  No se encontró directorio .git/hooks. Omitiendo instalación de hooks.');
  process.exit(0);
}

const prePushContent = `#!/bin/sh
# Hook pre-push para validar convenciones de ramas en feliperiquel.me

current_branch=$(git symbolic-ref --short HEAD 2>/dev/null)

if [ -z "$current_branch" ]; then
    exit 0
fi

valid_pattern='^(main|dev|(feat|fix|chore|refactor|docs|test|ci)/[a-z0-9]+(-[a-z0-9]+)*)$'

if echo "$current_branch" | grep -Eq "$valid_pattern"; then
    exit 0
else
    echo "======================================================================"
    echo "❌ ERROR: Nombre de rama no cumple con el estándar del proyecto."
    echo "----------------------------------------------------------------------"
    echo "Rama actual : '$current_branch'"
    echo "Formato esperado:"
    echo "  - 'main' (solo producción / releases)"
    echo "  - 'dev'  (integración y desarrollo)"
    echo "  - '<tipo>/<slug-kebab-case>'"
    echo ""
    echo "Tipos válidos: feat/, fix/, chore/, refactor/, docs/, test/, ci/"
    echo "Ejemplo      : feat/pagina-mantencion"
    echo "======================================================================"
    exit 1
fi
`;

const commitMsgContent = `#!/bin/sh
# Hook commit-msg para validar Conventional Commits

msg_file="$1"
first_line=$(head -n 1 "$msg_file")

# Ignorar commits automáticos de merge o fixup
if echo "$first_line" | grep -Eq '^(Merge |fixup!|squash!)'; then
    exit 0
fi

valid_pattern='^(feat|fix|docs|refactor|test|chore|ci)(\\([a-z0-9-]+\\))?!?: .{1,72}$'

if echo "$first_line" | grep -Eq "$valid_pattern"; then
    exit 0
else
    echo "======================================================================"
    echo "❌ ERROR: Mensaje de commit no cumple con Conventional Commits."
    echo "----------------------------------------------------------------------"
    echo "Mensaje: '$first_line'"
    echo "Formato: <tipo>(<alcance opcional>): <descripción max 72 caracteres>"
    echo "Tipos  : feat, fix, docs, refactor, test, chore, ci"
    echo "Ejemplo: feat(ui): agregar pagina de mantencion"
    echo "======================================================================"
    exit 1
fi
`;

const prePushPath = path.join(gitHooksDir, 'pre-push');
const commitMsgPath = path.join(gitHooksDir, 'commit-msg');

fs.writeFileSync(prePushPath, prePushContent, { mode: 0o755 });
fs.writeFileSync(commitMsgPath, commitMsgContent, { mode: 0o755 });

console.log('✅ Git hooks instalados con éxito en .git/hooks (pre-push, commit-msg)');
