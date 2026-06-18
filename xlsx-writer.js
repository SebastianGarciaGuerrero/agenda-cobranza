/**
 * xlsx-writer.js — Genera un archivo .xlsx real (sin dependencias).
 *
 * Construye un OOXML válido: un ZIP (método "stored") con las partes XML
 * mínimas que Excel necesita. Pensado para tablas simples de texto con
 * encabezado en negrita, autofiltro y fila superior congelada.
 *
 *   buildXLSX(headers, rows, sheetName) → Buffer
 */

// ── CRC-32 (para las entradas del ZIP) ────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

// ── ZIP mínimo (entradas sin comprimir) ───────────────────────────────────────
function zip(files) {
  const localChunks = [];
  const centralChunks = [];
  let offset = 0;

  for (const f of files) {
    const nameBuf = Buffer.from(f.name, 'utf-8');
    const data    = Buffer.isBuffer(f.data) ? f.data : Buffer.from(f.data, 'utf-8');
    const crc     = crc32(data);
    const size    = data.length;

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); // firma local
    local.writeUInt16LE(20, 4);         // versión necesaria
    local.writeUInt16LE(0, 6);          // flags
    local.writeUInt16LE(0, 8);          // método = stored
    local.writeUInt16LE(0, 10);         // hora
    local.writeUInt16LE(0x21, 12);      // fecha (1980-01-01)
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(size, 18);      // tamaño comprimido
    local.writeUInt32LE(size, 22);      // tamaño sin comprimir
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);         // extra
    localChunks.push(local, nameBuf, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0); // firma central
    central.writeUInt16LE(20, 4);         // versión creador
    central.writeUInt16LE(20, 6);         // versión necesaria
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0x21, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(size, 20);
    central.writeUInt32LE(size, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centralChunks.push(central, nameBuf);

    offset += local.length + nameBuf.length + data.length;
  }

  const centralBuf = Buffer.concat(centralChunks);
  const centralSize = centralBuf.length;

  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...localChunks, centralBuf, end]);
}

// ── Helpers XML ───────────────────────────────────────────────────────────────
function escapeXML(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ''); // control chars inválidos en XML
}

function colLetter(index) {
  let n = index, s = '';
  do { s = String.fromCharCode(65 + (n % 26)) + s; n = Math.floor(n / 26) - 1; } while (n >= 0);
  return s;
}

// ── Partes fijas del paquete OOXML ────────────────────────────────────────────
const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`;

const RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;

const WORKBOOK_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;

// s=0 normal · s=1 encabezado (negrita, blanco sobre ámbar) · s=2 cuerpo (wrap, arriba)
const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFB87517"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;

function buildWorkbook(sheetName) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${escapeXML(sheetName)}" sheetId="1" r:id="rId1"/></sheets></workbook>`;
}

function cell(ref, value, style) {
  return `<c r="${ref}" t="inlineStr" s="${style}"><is><t xml:space="preserve">${escapeXML(value)}</t></is></c>`;
}

function buildSheet(headers, rows) {
  // Ancho de columnas según el contenido (entre 10 y 60 caracteres)
  const widths = headers.map((h, c) => {
    let max = String(h).length;
    for (const row of rows) {
      const len = String(row[c] ?? '').length;
      if (len > max) max = len;
    }
    return Math.min(Math.max(max + 2, 10), 60);
  });
  const cols = widths
    .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
    .join('');

  const headerRow = `<row r="1">${headers.map((h, c) => cell(colLetter(c) + '1', h, 1)).join('')}</row>`;

  const bodyRows = rows.map((row, r) => {
    const rn = r + 2;
    const cells = row.map((v, c) => cell(colLetter(c) + rn, v, 2)).join('');
    return `<row r="${rn}">${cells}</row>`;
  }).join('');

  const lastCol = colLetter(headers.length - 1);
  const lastRow = rows.length + 1;

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${cols}</cols><sheetData>${headerRow}${bodyRows}</sheetData><autoFilter ref="A1:${lastCol}${lastRow}"/></worksheet>`;
}

/**
 * Construye un .xlsx en memoria.
 * @param {string[]}   headers    encabezados de columna
 * @param {string[][]} rows       filas (arrays de strings)
 * @param {string}     sheetName  nombre de la hoja
 * @returns {Buffer}
 */
function buildXLSX(headers, rows, sheetName = 'Hoja1') {
  return zip([
    { name: '[Content_Types].xml',        data: CONTENT_TYPES },
    { name: '_rels/.rels',                data: RELS },
    { name: 'xl/workbook.xml',            data: buildWorkbook(sheetName) },
    { name: 'xl/_rels/workbook.xml.rels', data: WORKBOOK_RELS },
    { name: 'xl/styles.xml',              data: STYLES },
    { name: 'xl/worksheets/sheet1.xml',   data: buildSheet(headers, rows) },
  ]);
}

module.exports = { buildXLSX };
