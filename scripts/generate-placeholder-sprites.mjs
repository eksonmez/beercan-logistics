/**
 * Minimal placeholder sprite sheet generator (no external deps).
 * Run: node scripts/generate-placeholder-sprites.mjs
 */
import { writeFileSync, mkdirSync } from 'fs';
import { deflateSync } from 'zlib';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'assets', 'sprites');

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function writePng(path, width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (width * 4 + 1);
    raw[rowStart] = 0;
    rgba.copy(raw, rowStart + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  writeFileSync(path, png);
}

function createBuffer(w, h) {
  return Buffer.alloc(w * h * 4, 0);
}

function setPixel(buf, w, x, y, r, g, b, a = 255) {
  if (x < 0 || y < 0 || x >= w) return;
  const i = (y * w + x) * 4;
  buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = a;
}

function fillRect(buf, w, x, y, rw, rh, r, g, b, a = 255) {
  for (let py = y; py < y + rh; py++)
    for (let px = x; px < x + rw; px++)
      setPixel(buf, w, px, py, r, g, b, a);
}

function drawPlayerFrame(buf, w, h, walkFrame, carrying) {
  const body = carrying ? [0xff, 0x66, 0x33] : [0x44, 0x88, 0xff];
  const legOffset = walkFrame % 2 === 0 ? 0 : 2;
  fillRect(buf, w, 12, h - 10, 8, 10, body[0], body[1], body[2]);
  fillRect(buf, w, 10, h - 22, 12, 12, body[0], body[1], body[2]);
  fillRect(buf, w, 12, h - 30, 8, 8, 0xff, 0xcc, 0x99);
  setPixel(buf, w, 14, h - 28, 0x22, 0x22, 0x22);
  setPixel(buf, w, 17, h - 28, 0x22, 0x22, 0x22);
  fillRect(buf, w, 11 + legOffset, h - 4, 3, 4, 0x33, 0x33, 0x44);
  fillRect(buf, w, 18 - legOffset, h - 4, 3, 4, 0x33, 0x33, 0x44);
  if (carrying) {
    fillRect(buf, w, 8, h - 38, 16, 8, 0xf5, 0xc5, 0x42);
    fillRect(buf, w, 10, h - 40, 12, 2, 0xcc, 0x99, 0x22);
  }
  fillRect(buf, w, 0, h - 2, w, 2, 0, 0, 0, 60);
}

function drawForkliftFrame(buf, w, h, moveFrame) {
  const bounce = moveFrame % 2;
  fillRect(buf, w, 4, h - 8 + bounce, w - 8, 10, 0xff, 0xcc, 0x00);
  fillRect(buf, w, w - 14, h - 22 + bounce, 6, 14, 0xcc, 0x99, 0x00);
  fillRect(buf, w, 6, h - 4 + bounce, 5, 4, 0x99, 0x99, 0x99);
  fillRect(buf, w, w - 12, h - 4 + bounce, 5, 4, 0x99, 0x99, 0x99);
  fillRect(buf, w, 8, h - 18 + bounce, 4, 3, 0x44, 0xff, 0x44);
  fillRect(buf, w, 0, h - 2, w, 2, 0, 0, 0, 60);
}

function buildPlayerSheet() {
  const FW = 32, FH = 48, COLS = 9, ROWS = 4;
  const sheet = createBuffer(FW * COLS, FH * ROWS);
  const dirs = ['ne', 'se', 'sw', 'nw'];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const frame = createBuffer(FW, FH);
      if (col === 0) drawPlayerFrame(frame, FW, FH, 0, false);
      else if (col <= 4) drawPlayerFrame(frame, FW, FH, col, false);
      else drawPlayerFrame(frame, FW, FH, col, true);
      for (let y = 0; y < FH; y++)
        for (let x = 0; x < FW; x++) {
          const si = ((row * FH + y) * (FW * COLS) + (col * FW + x)) * 4;
          const fi = (y * FW + x) * 4;
          sheet[si] = frame[fi]; sheet[si + 1] = frame[fi + 1];
          sheet[si + 2] = frame[fi + 2]; sheet[si + 3] = frame[fi + 3];
        }
    }
    void dirs[row];
  }
  return { sheet, width: FW * COLS, height: FH * ROWS, fw: FW, fh: FH };
}

function buildForkliftSheet() {
  const FW = 48, FH = 32, COLS = 5, ROWS = 4;
  const sheet = createBuffer(FW * COLS, FH * ROWS);
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const frame = createBuffer(FW, FH);
      drawForkliftFrame(frame, FW, FH, col === 0 ? 0 : col);
      for (let y = 0; y < FH; y++)
        for (let x = 0; x < FW; x++) {
          const si = ((row * FH + y) * (FW * COLS) + (col * FW + x)) * 4;
          const fi = (y * FW + x) * 4;
          sheet[si] = frame[fi]; sheet[si + 1] = frame[fi + 1];
          sheet[si + 2] = frame[fi + 2]; sheet[si + 3] = frame[fi + 3];
        }
    }
  }
  return { sheet, width: FW * COLS, height: FH * ROWS, fw: FW, fh: FH };
}

mkdirSync(join(OUT_DIR, 'player'), { recursive: true });
mkdirSync(join(OUT_DIR, 'forklift'), { recursive: true });

const player = buildPlayerSheet();
writePng(join(OUT_DIR, 'player', 'player_sheet.png'), player.width, player.height, player.sheet);

const forklift = buildForkliftSheet();
writePng(join(OUT_DIR, 'forklift', 'forklift_sheet.png'), forklift.width, forklift.height, forklift.sheet);

console.log('Generated placeholder sprites in public/assets/sprites/');
