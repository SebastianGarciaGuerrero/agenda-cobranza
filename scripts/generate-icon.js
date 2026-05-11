/**
 * Generates assets/icon.png — no external dependencies required.
 * Run once with: node scripts/generate-icon.js
 *
 * Design: navy rounded square · gold coin · bold "H" (Hadad)
 */

const zlib = require('zlib');
const fs   = require('fs');
const path = require('path');

const W = 256, H = 256;

// ── Minimal PNG writer (RGBA, no external deps) ───────────────────────────────
function writePNG(w, h, getPixel) {
  const raw = [];
  for (let y = 0; y < h; y++) {
    raw.push(0); // filter byte per row
    for (let x = 0; x < w; x++) raw.push(...getPixel(x, y));
  }
  const comp = zlib.deflateSync(Buffer.from(raw));

  const u32 = n => { const b = Buffer.alloc(4); b.writeUInt32BE(n); return b; };

  function crc32(buf) {
    let c = 0xFFFFFFFF;
    for (const v of buf) {
      c ^= v;
      for (let i = 0; i < 8; i++) c = c & 1 ? (c >>> 1) ^ 0xEDB88320 : c >>> 1;
    }
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  function chunk(type, data) {
    const t = Buffer.from(type, 'ascii');
    return Buffer.concat([u32(data.length), t, data, u32(crc32(Buffer.concat([t, data])))]);
  }

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', Buffer.concat([u32(w), u32(h), Buffer.from([8, 6, 0, 0, 0])])), // 8-bit RGBA
    chunk('IDAT', comp),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Signed-distance helpers ───────────────────────────────────────────────────
function sdfRRect(x, y) {
  const cx = W / 2, cy = H / 2, r = 44;
  const dx = Math.max(Math.abs(x - cx) - (W / 2 - 6 - r), 0);
  const dy = Math.max(Math.abs(y - cy) - (H / 2 - 6 - r), 0);
  return Math.sqrt(dx * dx + dy * dy) - r;
}

function sdfCircle(x, y, r) {
  const dx = x - W / 2, dy = y - H / 2;
  return Math.sqrt(dx * dx + dy * dy) - r;
}

// Anti-alias coverage from a signed distance value
function aa(d) { return Math.max(0, Math.min(1, 0.5 - d)); }

// Linear mix of two RGB triples
function mix(a, b, t) { return a.map((v, i) => Math.round(v + (b[i] - v) * t)); }

// ── Color palette ─────────────────────────────────────────────────────────────
const NAVY  = [22,  45,  80 ];
const GOLD  = [245, 196, 52 ];
const RIM   = [195, 150, 28 ];
const DARK  = [12,  26,  50 ];

// ── "H" glyph (three rectangles) ─────────────────────────────────────────────
function inH(x, y) {
  const lx1 = 88,  lx2 = 111;  // left bar
  const rx1 = 145, rx2 = 168;  // right bar
  const cy1 = 74,  cy2 = 182;  // vertical extents
  const mx1 = 88,  mx2 = 168;  // crossbar
  const my1 = 117, my2 = 139;  // crossbar vertical
  return (x >= lx1 && x <= lx2 && y >= cy1 && y <= cy2) ||
         (x >= rx1 && x <= rx2 && y >= cy1 && y <= cy2) ||
         (x >= mx1 && x <= mx2 && y >= my1 && y <= my2);
}

// ── Per-pixel renderer ────────────────────────────────────────────────────────
function getPixel(x, y) {
  const rrA = aa(sdfRRect(x, y));
  if (rrA <= 0) return [0, 0, 0, 0]; // outside rounded rect → transparent

  const dRim  = sdfCircle(x, y, 102);
  const dCoin = sdfCircle(x, y, 90);

  // Layer: start with navy, blend rim, then coin/H on top
  let color = NAVY;

  const rimA  = aa(dRim);
  if (rimA  > 0) color = mix(color, RIM, rimA);

  const coinA = aa(dCoin);
  if (coinA > 0) color = mix(color, inH(x, y) ? DARK : GOLD, coinA);

  return [...color, Math.round(rrA * 255)];
}

// ── Write file ────────────────────────────────────────────────────────────────
const outDir  = path.join(__dirname, '..', 'assets');
const outFile = path.join(outDir, 'icon.png');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, writePNG(W, H, getPixel));
console.log('Icon saved →', outFile);
