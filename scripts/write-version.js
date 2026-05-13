/**
 * Escribe assets/version.json con el SHA del commit actual.
 * Se ejecuta automáticamente antes de cada build (prebuild:win).
 */
const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

try {
  const sha  = execSync('git rev-parse HEAD').toString().trim();
  const data = { sha, built: new Date().toISOString() };
  const out  = path.join(__dirname, '..', 'assets', 'version.json');
  fs.writeFileSync(out, JSON.stringify(data, null, 2));
  console.log('Version →', sha.slice(0, 7));
} catch (e) {
  console.warn('No se pudo escribir version.json:', e.message);
}
