import { execSync } from 'node:child_process';
import fs from 'node:fs';

console.log('▶ [1/2] Compilando proyecto con Astro...');
execSync('npx astro build', { stdio: 'inherit' });

console.log('▶ [2/2] Verificando sitemap contra línea base...');
const currentPath = 'dist/client/sitemap-0.xml';
const baselinePath = '.qa-sitemap-baseline.xml';

if (!fs.existsSync(currentPath)) {
  console.error(`❌ No existe el archivo generado: ${currentPath}`);
  process.exit(1);
}

const current = fs.readFileSync(currentPath, 'utf-8').trim();

if (!fs.existsSync(baselinePath)) {
  fs.writeFileSync(baselinePath, current, 'utf-8');
  console.log(`ℹ Línea base creada en ${baselinePath}`);
} else {
  const baseline = fs.readFileSync(baselinePath, 'utf-8').trim();
  if (current !== baseline) {
    console.error('❌ El sitemap generado no coincide con la línea base:');
    console.error('Generado:\n', current);
    console.error('Línea base:\n', baseline);
    process.exit(1);
  }
  console.log('✅ Sitemap 100% idéntico a la línea base (cero regresiones en rutas).');
}

console.log('\n✨ ¡Compilación y sitemap validados con éxito!');
