// Genera los íconos PNG de la PWA (sin dependencias). Uso: node tools/make-icons.js
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const OUT = path.join(__dirname, '..', 'icons');
const BG = [0x0E, 0x10, 0x13], FG = [0xED, 0xEF, 0xF3];

const CRC = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(buf) { let c = 0xFFFFFFFF; for (const b of buf) c = CRC[(c ^ b) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, pixel) {
  const row = size * 4 + 1, raw = Buffer.alloc(row * size);
  for (let y = 0; y < size; y++) {
    raw[y * row] = 0;
    for (let x = 0; x < size; x++) { const p = pixel(x, y), o = y * row + 1 + x * 4; raw[o] = p[0]; raw[o + 1] = p[1]; raw[o + 2] = p[2]; raw[o + 3] = p[3]; }
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
// Geometría en unidades de 64 (igual que icons/icon.svg)
const RECTS = [[6, 26, 6, 12, 2], [13, 20, 8, 24, 2], [43, 20, 8, 24, 2], [52, 26, 6, 12, 2], [21, 29.5, 22, 5, 1.5]];
function inRoundRect(x, y, rx, ry, w, h, r) {
  if (x < rx || x > rx + w || y < ry || y > ry + h) return false;
  const cx = Math.max(rx + r, Math.min(x, rx + w - r)), cy = Math.max(ry + r, Math.min(y, ry + h - r));
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}
function make(size, maskable) {
  const S = 3; // supermuestreo
  return png(size, (px, py) => {
    let bg = 0, fg = 0;
    for (let sy = 0; sy < S; sy++) for (let sx = 0; sx < S; sx++) {
      const x = (px + (sx + .5) / S) / size * 64, y = (py + (sy + .5) / S) / size * 64;
      // fondo: cuadrado redondeado (o pleno si es maskable); contenido en zona segura 80 %
      const inBg = maskable ? true : inRoundRect(x, y, 0, 0, 64, 64, 14);
      if (!inBg) continue;
      bg++;
      const gx = maskable ? (x - 32) / 0.8 + 32 : x, gy = maskable ? (y - 32) / 0.8 + 32 : y;
      if (RECTS.some(r => inRoundRect(gx, gy, r[0], r[1], r[2], r[3], r[4]))) fg++;
    }
    const n = S * S, a = Math.round(255 * bg / n), t = bg ? fg / bg : 0;
    return [Math.round(BG[0] + (FG[0] - BG[0]) * t), Math.round(BG[1] + (FG[1] - BG[1]) * t), Math.round(BG[2] + (FG[2] - BG[2]) * t), a];
  });
}
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'icon-192.png'), make(192, false));
fs.writeFileSync(path.join(OUT, 'icon-512.png'), make(512, false));
fs.writeFileSync(path.join(OUT, 'icon-maskable-512.png'), make(512, true));
console.log('Íconos generados en', OUT);
