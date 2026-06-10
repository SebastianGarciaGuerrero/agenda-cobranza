/**
 * release.js — Publica una nueva versión en GitHub Releases.
 *
 * Hace: build → zip → release "r-<sha7>" con AgendaCobranza.zip adjunto.
 * La app de los usuarios (sin Git) compara su version.json contra el último
 * release y se actualiza descargando ese zip.
 *
 * Uso: npm run release   (o doble clic en publicar-version.bat)
 */

const { execSync, spawnSync } = require('child_process');
const https = require('https');
const fs    = require('fs');
const path  = require('path');

const ROOT = path.join(__dirname, '..');
const REPO = 'SebastianGarciaGuerrero/agenda-cobranza';

const run = cmd => execSync(cmd, { cwd: ROOT, encoding: 'utf-8' }).trim();

// ── Petición a la API de GitHub ───────────────────────────────────────────────
function api(method, host, urlPath, token, body, contentType) {
  return new Promise((resolve, reject) => {
    const data = body
      ? (Buffer.isBuffer(body) ? body : Buffer.from(JSON.stringify(body)))
      : null;
    const req = https.request({
      method, host, path: urlPath,
      headers: {
        'User-Agent': 'AgendaCobranza-release',
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github+json',
        ...(data ? { 'Content-Type': contentType || 'application/json', 'Content-Length': data.length } : {}),
      },
    }, res => {
      let out = '';
      res.on('data', c => out += c);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(out); } catch {}
        resolve({ status: res.statusCode, json });
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// ── Token desde el credential helper de git (no se imprime nunca) ────────────
function getToken() {
  const r = spawnSync('git', ['credential', 'fill'], {
    input: 'protocol=https\nhost=github.com\n\n',
    encoding: 'utf-8',
  });
  const line = (r.stdout || '').split('\n').find(l => l.startsWith('password='));
  if (!line) throw new Error('No se encontró la credencial de GitHub. Hacé un git push manual primero.');
  return line.slice('password='.length).trim();
}

async function main() {
  // 1. Verificaciones previas
  if (run('git status --porcelain')) {
    console.error('✗ Hay cambios sin commitear. Commiteá y pusheá antes de publicar.');
    process.exit(1);
  }
  if (run('git status -sb').includes('ahead')) {
    console.error('✗ Hay commits sin pushear. Hacé git push antes de publicar.');
    process.exit(1);
  }

  const sha  = run('git rev-parse HEAD');
  const sha7 = sha.slice(0, 7);
  const tag  = `r-${sha7}`;
  const msg  = run('git log -1 --pretty=%s');
  const token = getToken();

  // 2. ¿Ya existe un release de este commit?
  const existing = await api('GET', 'api.github.com', `/repos/${REPO}/releases/tags/${tag}`, token);
  if (existing.status === 200) {
    console.error(`✗ Ya existe un release para este commit (${tag}). No hay nada nuevo que publicar.`);
    process.exit(1);
  }

  // 3. Build + zip
  console.log('→ Compilando…');
  execSync('npm run build:win', { cwd: ROOT, stdio: 'inherit' });

  console.log('→ Comprimiendo…');
  const zipPath = path.join(ROOT, 'dist', 'AgendaCobranza.zip');
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
  execSync(
    `powershell -NoProfile -Command "Compress-Archive -Path 'dist\\AgendaCobranza-win32-x64' -DestinationPath 'dist\\AgendaCobranza.zip' -Force"`,
    { cwd: ROOT, stdio: 'inherit' },
  );

  // 4. Crear el release
  console.log('→ Creando release en GitHub…');
  const fecha = new Date().toLocaleDateString('es-CL');
  const rel = await api('POST', 'api.github.com', `/repos/${REPO}/releases`, token, {
    tag_name: tag,
    target_commitish: sha,
    name: `Agenda Cobranza — ${fecha} (${sha7})`,
    body: msg,
  });
  if (rel.status !== 201) {
    console.error('✗ Error al crear el release:', rel.status, JSON.stringify(rel.json));
    process.exit(1);
  }

  // 5. Subir el zip como asset
  console.log('→ Subiendo AgendaCobranza.zip (puede tardar)…');
  const zipData = fs.readFileSync(zipPath);
  const up = await api(
    'POST', 'uploads.github.com',
    `/repos/${REPO}/releases/${rel.json.id}/assets?name=AgendaCobranza.zip`,
    token, zipData, 'application/zip',
  );
  if (up.status !== 201) {
    console.error('✗ Error al subir el zip:', up.status, JSON.stringify(up.json));
    process.exit(1);
  }

  console.log('');
  console.log(`✓ Versión publicada: ${rel.json.html_url}`);
  console.log('  Los usuarios verán el aviso de actualización al abrir la app.');
}

main().catch(err => {
  console.error('✗', err.message);
  process.exit(1);
});
