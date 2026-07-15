// Self-contained PNG icon generator (Node built-ins only: zlib).
// Renders a full-bleed indigo->violet gradient with a white lightning bolt,
// anti-aliased via 3x supersampling. Full-bleed => works as maskable + apple-touch.
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const OUT = process.argv[2] || '.';

// CRC32
const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return (buf) => {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) c = t[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
})();

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(CRC(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function writePNG(file, size, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // color type RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  // filtered scanlines (filter byte 0 per row)
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  const png = Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
  fs.writeFileSync(file, png);
}

// Lightning bolt polygon in a 24x24 viewBox (Material-ish bolt), centered.
const BOLT = [ [11,21],[11,14],[7,14],[13,3],[13,10],[17,10] ];

function pointInPoly(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    const intersect = ((yi > py) !== (yj > py)) &&
      (px < ((xj - xi) * (py - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function lerp(a, b, t) { return a + (b - a) * t; }

function render(size) {
  const ss = 3;                 // supersample factor
  const S = size * ss;
  const rgba = Buffer.alloc(size * size * 4);
  // gradient endpoints (indigo -> violet)
  const c0 = [124, 107, 255];   // #7C6BFF
  const c1 = [83, 71, 214];     // #5347D6
  // bolt transform: map 24-box into centered 62% square
  const boxScale = (0.62 * S) / 24;
  const cx = S / 2, cy = S / 2;
  const tx = (x) => cx + (x - 12) * boxScale;
  const ty = (y) => cy + (y - 12) * boxScale;
  const poly = BOLT.map(([x, y]) => [tx(x), ty(y)]);

  for (let oy = 0; oy < size; oy++) {
    for (let ox = 0; ox < size; ox++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const X = ox * ss + sx + 0.5;
          const Y = oy * ss + sy + 0.5;
          // background gradient (diagonal)
          const t = Math.min(1, Math.max(0, (X + Y) / (2 * S)));
          let pr = lerp(c0[0], c1[0], t);
          let pg = lerp(c0[1], c1[1], t);
          let pb = lerp(c0[2], c1[2], t);
          // bolt in white
          if (pointInPoly(X, Y, poly)) { pr = 255; pg = 255; pb = 255; }
          r += pr; g += pg; b += pb; a += 255;
        }
      }
      const n = ss * ss;
      const idx = (oy * size + ox) * 4;
      rgba[idx] = Math.round(r / n);
      rgba[idx + 1] = Math.round(g / n);
      rgba[idx + 2] = Math.round(b / n);
      rgba[idx + 3] = Math.round(a / n);
    }
  }
  return rgba;
}

for (const size of [512, 192, 180]) {
  const rgba = render(size);
  const name = size === 180 ? 'apple-touch-icon.png' : `icon-${size}.png`;
  writePNG(path.join(OUT, name), size, rgba);
  console.log('wrote', name, size + 'x' + size);
}
