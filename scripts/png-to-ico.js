/**
 * Wraps assets/icon.png inside a .ico container (Vista+ format).
 * Windows uses .ico for taskbar, shortcuts, and Alt+Tab.
 * Run: node scripts/png-to-ico.js
 */

const fs   = require('fs');
const path = require('path');

const pngPath = path.join(__dirname, '..', 'assets', 'icon.png');
const icoPath = path.join(__dirname, '..', 'assets', 'icon.ico');

const pngData = fs.readFileSync(pngPath);
const pngSize = pngData.length;

// ICO header (6 bytes) + one directory entry (16 bytes) + PNG data
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);  // reserved
header.writeUInt16LE(1, 2);  // type: 1 = icon
header.writeUInt16LE(1, 4);  // count: 1 image

const entry = Buffer.alloc(16);
entry.writeUInt8(0,  0);  // width  (0 = 256)
entry.writeUInt8(0,  1);  // height (0 = 256)
entry.writeUInt8(0,  2);  // color count (0 = no palette)
entry.writeUInt8(0,  3);  // reserved
entry.writeUInt16LE(1,   4);  // planes
entry.writeUInt16LE(32,  6);  // bit count
entry.writeUInt32LE(pngSize, 8);   // size of image data
entry.writeUInt32LE(22,  12); // offset = 6 (header) + 16 (entry)

fs.writeFileSync(icoPath, Buffer.concat([header, entry, pngData]));
console.log('ICO saved →', icoPath);
