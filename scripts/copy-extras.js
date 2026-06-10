/**
 * Copia archivos extra dentro de la carpeta empaquetada después del build.
 * Se ejecuta automáticamente (postbuild:win).
 */
const fs   = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist', 'AgendaCobranza-win32-x64');
const extras  = ['crear-acceso-directo.bat'];

for (const file of extras) {
  const src = path.join(__dirname, file);
  const dst = path.join(distDir, file);
  if (fs.existsSync(src) && fs.existsSync(distDir)) {
    fs.copyFileSync(src, dst);
    console.log('Copiado →', dst);
  }
}
