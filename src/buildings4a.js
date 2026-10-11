// Level 4 (Soviet metropolis), set A: school, kindergarten, stalinka courtyard block, hotel Intourist,
// research institute, Palace of Pioneers, planetarium.
// Conventions: origin = footprint centre on the ground, front = local +Z, userData = { w, d, h[, cols] }.
import * as THREE from 'three';
import { mat, color, boxT, cylT, place, gableRoof, decal } from './geo.js';
import { slab, sign } from './buildings2.js';
import { addPainters, mulberry } from './textures.js';

const G = () => new THREE.Group();
const size = (g, w, d, h, cols) => { g.userData = { ...g.userData, w, d, h }; if (cols) g.userData.cols = cols; return g; };
const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
const speck = (g, w, h, seed, n, cols) => { const r = mulberry(seed); for (let i = 0; i < n; i++) R(g, (r() * w) | 0, (r() * h) | 0, 1, 1, cols[(r() * cols.length) | 0]); };
const PI = Math.PI;

// ---------------------------------------------------------------- textures
addPainters({
  s4a_schoolwall(g, w, h) {            // one storey (3.6 m) of a panel school: strip window
    R(g, 0, 0, w, h, '#e6dcba'); speck(g, w, h, 1, 160, ['#d8cea9', '#efe6c8']);
    R(g, 0, 0, 1, h, '#c9bf9a'); R(g, 0, 0, w, 1, '#c9bf9a');
    R(g, 0, 50, w, 14, '#d3c79c'); R(g, 0, 50, w, 1, '#b9ad84');
    R(g, 0, 11, w, 3, '#f7f3e6'); R(g, 0, 46, w, 4, '#f7f3e6');
    R(g, 0, 14, w, 32, '#27384c'); R(g, 0, 14, w, 5, '#4f6a86'); R(g, 4, 20, 10, 2, '#7d97b0'); R(g, 38, 30, 14, 2, '#5d7893');
    R(g, 0, 14, 2, 32, '#f7f3e6'); R(g, 31, 14, 2, 32, '#f7f3e6'); R(g, 16, 14, 1, 32, '#cfd6da'); R(g, 48, 14, 1, 32, '#cfd6da');
    R(g, 0, 50, w, 2, 'rgba(0,0,0,.18)');
  },
  s4a_schoolplain(g, w, h) {
    R(g, 0, 0, w, h, '#e6dcba'); speck(g, w, h, 2, 160, ['#d8cea9', '#efe6c8']);
    R(g, 0, 0, 1, h, '#c9bf9a'); R(g, 0, 0, w, 1, '#c9bf9a'); R(g, 31, 0, 1, h, '#d6ccaa');
    R(g, 0, 56, w, 8, '#cdc29a');
  },
  s4a_gymglass(g, w, h) {
    R(g, 0, 0, w, h, '#f1ede0'); R(g, 0, 6, w, 52, '#2a4057'); R(g, 0, 6, w, 7, '#58789a');
    for (let x = 0; x < w; x += 16) { R(g, x, 6, 2, 52, '#f1ede0'); R(g, x + 6, 18, 1, 38, 'rgba(255,255,255,.18)'); }
    R(g, 0, 31, w, 2, '#f1ede0'); R(g, 0, 58, w, 6, '#d9d3c0');
  },
  s4a_mosaic(g, w, h) {                 // coarse "smalt" mosaic: sun, rocket, star
    const r = mulberry(5), px = 4;
    const cell = (x, y, c) => R(g, x * px, y * px, px, px, c);
    const cw = w / px, ch = h / px;
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) cell(x, y, ['#2f7fc0', '#3a8ccc', '#2a74b4'][(r() * 3) | 0]);
    const sx = 8, sy = 8;
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
      const d = Math.hypot(x - sx, y - sy), a = Math.atan2(y - sy, x - sx);
      if (d < 5) cell(x, y, r() < 0.5 ? '#f6d24a' : '#f2c030');
      else if (d < 9 && Math.sin(a * 8) > 0.5) cell(x, y, '#f4b43a');
      // rocket on a diagonal
      const u = (x - 18) * 0.8 + (y - 10) * -0.6, v = (x - 18) * 0.6 + (y - 10) * 0.8;
      if (Math.abs(u) < 2.2 && v > -9 && v < 6) cell(x, y, '#f4f1e6');
      if (Math.abs(u) < 2.2 && v >= 6 && v < 8) cell(x, y, '#e0e0e0');
      if (Math.abs(u) < 1.2 && v > -12 && v <= -9) cell(x, y, '#d8302a');
      if (Math.abs(u) > 2.2 && Math.abs(u) < 4.2 && v > 0 && v < 5 && Math.abs(u) - 2.2 < (v / 3)) cell(x, y, '#d8302a');
      if (v >= 8 && v < 14 && Math.abs(u) < 1.6 - (v - 8) * 0.18) cell(x, y, r() < 0.5 ? '#ff9a2a' : '#ffd24a');
    }
    // red star
    const stx = 26, sty = 6;
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) { const dx = x - stx, dy = y - sty, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx) + PI / 2; const k = Math.abs(((a % (2 * PI / 5)) + 2 * PI / 5) % (2 * PI / 5) - PI / 5); if (d < 3.2 + 2.2 * (1 - k / (PI / 5))) cell(x, y, '#d8302a'); }
    R(g, 0, 0, w, 2, '#f4efe0'); R(g, 0, h - 2, w, 2, '#f4efe0'); R(g, 0, 0, 2, h, '#f4efe0'); R(g, w - 2, 0, 2, h, '#f4efe0');
  },
  s4a_kgmural(g, w, h) {                // cartoon mural: sky, hills, sun with a face, rainbow, bear, house
    R(g, 0, 0, w, h, '#8fd0f0'); R(g, 0, 40, w, 24, '#6cc060'); R(g, 0, 50, w, 14, '#58b04c');
    g.fillStyle = '#6cc060'; g.beginPath(); g.arc(30, 58, 30, PI, 0); g.fill(); g.beginPath(); g.arc(100, 60, 34, PI, 0); g.fill();
    ['#e63a3a', '#f2922a', '#f6dc3a', '#4ab84a', '#3a8ae0'].forEach((c, i) => { g.strokeStyle = c; g.lineWidth = 3; g.beginPath(); g.arc(88, 48, 28 - i * 3, PI, 0); g.stroke(); });
    g.fillStyle = '#ffd93a'; g.beginPath(); g.arc(18, 14, 11, 0, 2 * PI); g.fill();
    g.strokeStyle = '#ffd93a'; g.lineWidth = 2; for (let a = 0; a < 12; a++) { g.beginPath(); g.moveTo(18 + Math.cos(a * PI / 6) * 13, 14 + Math.sin(a * PI / 6) * 13); g.lineTo(18 + Math.cos(a * PI / 6) * 18, 14 + Math.sin(a * PI / 6) * 18); g.stroke(); }
    R(g, 13, 11, 3, 3, '#333'); R(g, 20, 11, 3, 3, '#333'); R(g, 14, 18, 8, 2, '#c03020');
    // bear
    g.fillStyle = '#9a6030'; g.beginPath(); g.arc(50, 46, 9, 0, 2 * PI); g.fill(); g.beginPath(); g.arc(43, 38, 3.5, 0, 2 * PI); g.arc(57, 38, 3.5, 0, 2 * PI); g.fill();
    g.fillStyle = '#e8c090'; g.beginPath(); g.arc(50, 49, 4, 0, 2 * PI); g.fill(); R(g, 46, 43, 2, 2, '#222'); R(g, 52, 43, 2, 2, '#222'); R(g, 49, 47, 3, 2, '#222');
    // house + flowers
    R(g, 66, 40, 16, 14, '#f2d890'); g.fillStyle = '#d04030'; g.beginPath(); g.moveTo(63, 40); g.lineTo(74, 30); g.lineTo(85, 40); g.fill(); R(g, 71, 46, 5, 8, '#7a4a2a'); R(g, 68, 43, 3, 3, '#7ac0e0');
    for (let i = 0; i < 8; i++) { const fx = 4 + i * 15, fy = 58; R(g, fx, fy, 1, 5, '#2a7a2a'); R(g, fx - 1, fy - 2, 3, 3, ['#f06080', '#f8f040', '#ffffff', '#c060e0'][i % 4]); }
    R(g, 0, 0, w, 1, '#fff'); R(g, 0, h - 1, w, 1, '#fff'); R(g, 0, 0, 1, h, '#fff'); R(g, w - 1, 0, 1, h, '#fff');
  },
  s4a_stbase(g, w, h) {                 // rusticated two-floor base with windows, 6.6 m tile
    R(g, 0, 0, w, h, '#cdbc90');
    for (let y = 0; y < h; y += 8) { R(g, 0, y, w, 1, '#a89868'); for (let x = ((y / 8) % 2) * 16; x < w; x += 32) R(g, x, y, 1, 8, '#b4a474'); }
    speck(g, w, h, 11, 200, ['#bfae82', '#d8c89c']);
    for (let cx = 0; cx < 2; cx++) {
      const x0 = cx * 64;
      R(g, x0 + 14, 74, 36, 44, '#efe5c6'); R(g, x0 + 17, 77, 30, 38, '#26303a'); R(g, x0 + 17, 77, 30, 7, '#3c4c60'); R(g, x0 + 31, 77, 2, 38, '#efe5c6'); R(g, x0 + 17, 94, 30, 2, '#efe5c6');
      R(g, x0 + 12, 118, 40, 4, '#b4a474');
      R(g, x0 + 14, 10, 36, 50, '#efe5c6'); g.fillStyle = '#efe5c6'; g.beginPath(); g.arc(x0 + 32, 14, 18, PI, 0); g.fill();
      R(g, x0 + 17, 14, 30, 43, '#26303a'); g.fillStyle = '#26303a'; g.beginPath(); g.arc(x0 + 32, 14, 15, PI, 0); g.fill(); R(g, x0 + 31, 0, 2, 57, '#efe5c6'); R(g, x0 + 17, 32, 30, 2, '#efe5c6');
      R(g, x0 + 12, 58, 40, 4, '#b4a474');
    }
    R(g, 0, 64, w, 3, '#e9dcb4'); R(g, 0, 0, w, 1, '#a89868');
  },
  s4a_stbaseplain(g, w, h) {
    R(g, 0, 0, w, h, '#cdbc90');
    for (let y = 0; y < h; y += 8) { R(g, 0, y, w, 1, '#a89868'); for (let x = ((y / 8) % 2) * 16; x < w; x += 32) R(g, x, y, 1, 8, '#b4a474'); }
    speck(g, w, h, 12, 200, ['#bfae82', '#d8c89c']); R(g, 0, 64, w, 3, '#e9dcb4');
  },
  s4a_stplain(g, w, h) {
    R(g, 0, 0, w, h, '#d9cba2'); speck(g, w, h, 13, 260, ['#c8b98e', '#e6d9b4']);
    for (let i = 0; i < 2; i++) { R(g, 0, i * 64 + 62, w, 2, '#c4b68c'); R(g, 0, i * 64, 2, 64, '#e8dcb8'); }
  },
  s4a_hotelwall(g, w, h) {              // curtain-wall ribbons, 2 floors per 6 m tile
    R(g, 0, 0, w, h, '#cfd2d0');
    for (let f = 0; f < 2; f++) {
      const y0 = f * 32;
      R(g, 0, y0, w, 9, '#c4c8c6'); R(g, 0, y0 + 8, w, 1, '#9aa0a0');
      R(g, 0, y0 + 9, w, 23, '#4d7f98'); R(g, 0, y0 + 9, w, 6, '#7fb0c6'); R(g, 0, y0 + 24, w, 8, '#3a6680');
      for (let x = 0; x < w; x += 16) { R(g, x, y0 + 9, 1, 23, '#d4dcdc'); }
      R(g, 0, y0 + 20, w, 1, '#c8d4d8');
    }
  },
  s4a_hotelend(g, w, h) {
    R(g, 0, 0, w, h, '#c9c6ba'); speck(g, w, h, 14, 200, ['#b9b6aa', '#d6d3c8']);
    for (let f = 0; f < 2; f++) { const y0 = f * 32; R(g, 22, y0 + 8, 8, 16, '#2c3a48'); R(g, 34, y0 + 8, 8, 16, '#2c3a48'); R(g, 20, y0 + 6, 24, 2, '#efece0'); R(g, 0, y0 + 30, w, 2, '#aaa79b'); }
  },
  s4a_niiwall(g, w, h) {                // 3.5 m storey: concrete frame + blue glass
    R(g, 0, 0, w, h, '#b9b5aa'); speck(g, w, h, 15, 180, ['#a9a59a', '#c8c4b9']);
    R(g, 0, 0, w, 9, '#a39f94'); R(g, 0, 8, w, 1, '#8c887d');
    R(g, 5, 11, 54, 43, '#3f6e8c'); R(g, 5, 11, 54, 9, '#7aa9c4'); R(g, 5, 42, 54, 12, '#2f566f');
    R(g, 31, 11, 2, 43, '#d8d6cc'); R(g, 5, 30, 54, 1, '#d8d6cc');
    R(g, 10, 15, 8, 2, '#a6cfe2'); R(g, 38, 24, 12, 2, '#8fbad0');
    R(g, 0, 56, w, 8, '#aaa69b');
  },
  s4a_niibase(g, w, h) {
    R(g, 0, 0, w, h, '#b3afa4'); speck(g, w, h, 16, 220, ['#a29e93', '#c2beb3']);
    for (let y = 6; y < h; y += 12) R(g, 0, y, w, 1, 'rgba(0,0,0,.14)');
    R(g, 0, 0, 1, h, 'rgba(0,0,0,.2)');
  },
  s4a_relief(g, w, h) {                 // abstract concrete relief: atom, sun, beams
    const r = mulberry(21);
    R(g, 0, 0, w, h, '#a9a699');
    for (let i = 0; i < 26; i++) { const c = ['#8c897c', '#c4c0b2', '#b5532c', '#2f6fa8', '#e6dcc0', '#5c5a52'][(r() * 6) | 0]; R(g, (r() * w) | 0, (r() * h) | 0, 6 + ((r() * 22) | 0), 4 + ((r() * 12) | 0), c); }
    g.fillStyle = '#e8c04a'; g.beginPath(); g.arc(w * 0.5, h * 0.5, 13, 0, 2 * PI); g.fill();
    g.strokeStyle = '#1e2c3c'; g.lineWidth = 3;
    for (let a = 0; a < 3; a++) { g.save(); g.translate(w * 0.5, h * 0.5); g.rotate(a * PI / 3); g.beginPath(); g.ellipse(0, 0, 44, 15, 0, 0, 2 * PI); g.stroke(); g.fillStyle = '#d8302a'; g.beginPath(); g.arc(44, 0, 4, 0, 2 * PI); g.fill(); g.restore(); }
    g.fillStyle = '#1e2c3c'; g.beginPath(); g.arc(w * 0.5, h * 0.5, 5, 0, 2 * PI); g.fill();
    R(g, 0, 0, w, 3, '#5c5a52'); R(g, 0, h - 3, w, 3, '#5c5a52'); R(g, 0, 0, 3, h, '#5c5a52'); R(g, w - 3, 0, 3, h, '#5c5a52');
  },
  s4a_palwing(g, w, h) {                // 4 m storey: white piers + tall glass
    R(g, 0, 0, w, h, '#f3f0e6'); speck(g, w, h, 17, 120, ['#e4e0d2', '#fffdf6']);
    R(g, 0, 0, w, 6, '#e6e2d4'); R(g, 0, 5, w, 1, '#c9c4b2');
    R(g, 6, 8, 52, 50, '#2f4f6b'); R(g, 6, 8, 52, 10, '#6d93b2');
    for (let x = 6; x < 58; x += 13) R(g, x, 8, 1, 50, '#e8e6dc');
    R(g, 6, 34, 52, 1, '#e8e6dc'); R(g, 14, 22, 8, 2, '#9fc0d8');
    R(g, 0, 60, w, 4, '#dcd8c8');
  },
  s4a_whitestone(g, w, h) {
    R(g, 0, 0, w, h, '#eeeadc'); speck(g, w, h, 18, 200, ['#e0dccd', '#f8f6ee', '#d6d1be']);
    for (let y = 0; y < h; y += 16) { R(g, 0, y, w, 1, '#cfcab8'); for (let x = ((y / 16) % 2) * 16; x < w; x += 32) R(g, x, y, 1, 16, '#d6d1c0'); }
  },
  s4a_star(g, w, h) {                   // red star emblem plaque
    R(g, 0, 0, w, h, '#b82a1c'); R(g, 1, 1, w - 2, h - 2, '#d8a82a'); R(g, 3, 3, w - 6, h - 6, '#b82a1c');
    g.fillStyle = '#f6d24a'; g.beginPath();
    for (let i = 0; i < 10; i++) { const a = -PI / 2 + i * PI / 5, rr = i % 2 ? 5 : 12; g.lineTo(w / 2 + Math.cos(a) * rr, h / 2 + 1 + Math.sin(a) * rr); }
    g.fill();
  },
  s4a_plandrum(g, w, h) {               // pale stone drum with narrow slit windows
    R(g, 0, 0, w, h, '#dad6ca'); speck(g, w, h, 19, 220, ['#cbc7ba', '#e8e5da']);
    for (let x = 0; x < w; x += 32) { R(g, x + 12, 14, 7, 40, '#3a4654'); R(g, x + 12, 14, 7, 6, '#6a7c90'); R(g, x + 10, 12, 11, 2, '#efece2'); R(g, x + 10, 54, 11, 2, '#efece2'); }
    R(g, 0, 0, w, 4, '#c4c0b2'); R(g, 0, 60, w, 4, '#c4c0b2');
  },
}, { s4a_schoolwall: [64, 64], s4a_mosaic: [128, 64], s4a_kgmural: [128, 64], s4a_stbase: [128, 128], s4a_stbaseplain: [128, 128], s4a_stplain: [128, 128], s4a_relief: [128, 64], s4a_star: [32, 32] });

// ---------------------------------------------------------------- shared helpers
const mbox = (w, h, d, mats, tile) => { const m = boxT(w, h, d, Array.isArray(mats) ? mats[0] : mats, tile); if (Array.isArray(mats)) m.material = mats; return m; };
const B = (g, w, h, d, m, x, y, z, t = 3) => { const o = place(boxT(w, h, d, m, t), x, y, z); g.add(o); return o; };
const M = (g, geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); g.add(o); return o; };
const GREY = () => color(0x6c7076), DARK = () => color(0x2a2c30), WHITE = () => color(0xeeeadc);
const dishMat = new THREE.MeshLambertMaterial({ color: 0xe4e1d6, side: THREE.DoubleSide });

// Windows along a wall. Wall centre (cx,cz), outward normal angle r (0=+Z, PI=-Z, PI/2=+X, -PI/2=-X), length len.
function wins(g, { cx = 0, cz = 0, r = 0, len, ys, step = 3.6, sx = 1.4, sy = 2.3, off = 0.07, fixed = false, c = '#fbfaf4', margin = 2.5, litN = 0, skip = null, shift = 0 }) {
  const n = Math.floor((len - 2 * margin) / step) + 1, nx = Math.sin(r), nz = Math.cos(r), tx = Math.cos(r), tz = -Math.sin(r);
  let k = 0;
  for (let i = 0; i < n; i++) for (const y of ys) {
    const s = (i - (n - 1) / 2) * step + shift; k++;
    if (skip && skip(s, y)) continue;
    const w = decal('window', sx, sy, cx + tx * s + nx * off, y, cz + tz * s + nz * off, { c, fixed, lit: litN > 0 && k % litN === 0 });
    w.rotation.y = r; g.add(w);
  }
}
function doorAt(g, { cx, cz, r = 0, s = 0, y = 1.4, w = 1.6, h = 2.6, c = '#3a5a8a', off = 0.07 }) {
  const nx = Math.sin(r), nz = Math.cos(r), tx = Math.cos(r), tz = -Math.sin(r);
  const d = decal('door', w, h, cx + tx * s + nx * off, y, cz + tz * s + nz * off, { c }); d.rotation.y = r; g.add(d);
}
function parapet(g, w, d, cx, cz, y, h = 0.8, t = 0.35, m = null) {
  m = m || mat('concrete');
  B(g, w, h, t, m, cx, y + h / 2, cz + d / 2 - t / 2, 2); B(g, w, h, t, m, cx, y + h / 2, cz - d / 2 + t / 2, 2);
  B(g, t, h, d - 2 * t, m, cx - w / 2 + t / 2, y + h / 2, cz, 2); B(g, t, h, d - 2 * t, m, cx + w / 2 - t / 2, y + h / 2, cz, 2);
}
function pipe(g, x, z, h, y0 = 0, r = 0.1, c = 0x60646a) { M(g, new THREE.CylinderGeometry(r, r, h, 6), color(c), x, y0 + h / 2, z); }
function ladder(g, x, y0, y1, z, face = 1) {
  const h = y1 - y0, m = DARK();
  B(g, 0.07, h, 0.07, m, x - 0.3, y0 + h / 2, z, 1); B(g, 0.07, h, 0.07, m, x + 0.3, y0 + h / 2, z, 1);
  for (let y = y0 + 0.4; y < y1; y += 0.6) B(g, 0.6, 0.05, 0.05, m, x, y, z + face * 0.02, 1);
}
function antenna(g, x, y, z, hgt = 4) {
  const d = DARK();
  M(g, new THREE.BoxGeometry(0.07, hgt, 0.07), d, x, y + hgt / 2, z);
  M(g, new THREE.BoxGeometry(1.6, 0.05, 0.05), d, x, y + hgt - 0.3, z); M(g, new THREE.BoxGeometry(1.1, 0.05, 0.05), d, x, y + hgt - 0.8, z); M(g, new THREE.BoxGeometry(0.7, 0.05, 0.05), d, x, y + hgt - 1.3, z);
}
function dish(g, x, y, z, rad, yaw = 0, tilt = 0.7) {
  const grp = new THREE.Group(), Rr = rad / Math.sin(0.62);
  const geo = new THREE.SphereGeometry(Rr, 12, 5, 0, 2 * PI, 0, 0.62); geo.translate(0, -Rr, 0);
  const bowl = new THREE.Mesh(geo, dishMat); bowl.rotation.x = PI / 2; grp.add(bowl);
  const feed = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, rad * 0.9, 4), DARK()); feed.rotation.x = PI / 2; feed.position.z = rad * 0.45; grp.add(feed);
  const tip = new THREE.Mesh(new THREE.BoxGeometry(rad * 0.16, rad * 0.16, rad * 0.16), DARK()); tip.position.z = rad * 0.9; grp.add(tip);
  grp.rotation.order = 'YXZ'; grp.rotation.y = yaw; grp.rotation.x = -tilt; grp.position.set(x, y + rad * 0.7, z); g.add(grp);
  M(g, new THREE.CylinderGeometry(0.2, 0.35, rad * 0.8, 6), GREY(), x, y + rad * 0.35, z);
}
function tree(g, x, z, s = 1, y = 0) {
  M(g, new THREE.CylinderGeometry(0.18 * s, 0.28 * s, 2.4 * s, 6), color(0x5a3c22), x, y + 1.2 * s, z);
  M(g, new THREE.SphereGeometry(1.7 * s, 8, 6), color(0x3d7a36), x, y + 3.4 * s, z);
  M(g, new THREE.SphereGeometry(1.2 * s, 8, 6), color(0x4e8f3e), x + 0.3 * s, y + 4.7 * s, z - 0.2 * s);
}
function conifer(g, x, z, s = 1) {
  M(g, new THREE.CylinderGeometry(0.15 * s, 0.22 * s, 1.5 * s, 6), color(0x5a3c22), x, 0.75 * s, z);
  M(g, new THREE.ConeGeometry(1.6 * s, 3 * s, 8), color(0x2f6a3a), x, 2.8 * s, z); M(g, new THREE.ConeGeometry(1.2 * s, 2.6 * s, 8), color(0x3a7c44), x, 4.3 * s, z);
}
function bench(g, x, y, z, ry = 0, len = 1.8) {
  const b = G();
  B(b, len, 0.08, 0.45, mat('planks'), 0, 0.5, 0, 1); B(b, len, 0.5, 0.07, mat('planks'), 0, 0.8, -0.22, 1);
  B(b, 0.1, 0.5, 0.45, DARK(), -len / 2 + 0.15, 0.25, 0, 1); B(b, 0.1, 0.5, 0.45, DARK(), len / 2 - 0.15, 0.25, 0, 1);
  b.position.set(x, y, z); b.rotation.y = ry; g.add(b);
}
function flag(g, x, y, z, h, hex, ry = 0) {
  M(g, new THREE.CylinderGeometry(0.06, 0.09, h, 6), color(0xcfcfcf), x, y + h / 2, z);
  const f = M(g, new THREE.BoxGeometry(1.7, 1.05, 0.04), color(hex, { emissive: 0x200000 }), x + 0.9 * Math.cos(ry), y + h - 0.7, z - 0.9 * Math.sin(ry)); f.rotation.y = ry;
  M(g, new THREE.SphereGeometry(0.12, 6, 4), color(0xd9a62a), x, y + h + 0.05, z);
}
function star(g, x, y, z, s = 1, hex = 0xe03020) {
  const m = M(g, new THREE.OctahedronGeometry(1.4 * s), color(hex, { emissive: 0x801000 }), x, y, z); m.scale.set(1, 1.5, 0.45); return m;
}
// extruded wall slab with an arched passage through it (along z): UVs in tile units
function archWall(width, height, depth, aw, straight, material, tile) {
  const sh = new THREE.Shape(); sh.moveTo(-width / 2, 0); sh.lineTo(width / 2, 0); sh.lineTo(width / 2, height); sh.lineTo(-width / 2, height); sh.lineTo(-width / 2, 0);
  const hole = new THREE.Path(); const rr = aw / 2;
  hole.moveTo(-rr, 0); hole.lineTo(-rr, straight); hole.absarc(0, straight, rr, PI, 0, true); hole.lineTo(rr, 0); hole.lineTo(-rr, 0);
  sh.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false, curveSegments: 8 });
  geo.translate(0, 0, -depth / 2);
  const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / tile, uv.getY(i) / tile);
  return new THREE.Mesh(geo, material);
}

// =================================================================== 1. SCHOOL
export function school(opts = {}) {
  const g = G(), FH = 3.6, H = FH * 3;
  const wallP = mat('s4a_schoolwall'), plainP = mat('s4a_schoolplain'), roofT = mat('roofTar');
  // main block z -15..-1, x -31..31
  B(g, 62.6, 0.6, 14.6, mat('concreteDark'), 0, 0.3, -8, 4);
  g.add(place(mbox(62, FH, 14, [wallP, wallP, roofT, roofT, plainP, wallP], FH), 0, FH / 2, -8));
  g.add(place(mbox(62, FH * 2, 14, [wallP, wallP, roofT, roofT, wallP, wallP], FH), 0, FH * 1.5 + FH / 2 + 0.0, -8));
  parapet(g, 62.4, 14.4, 0, -8, H, 0.9);
  B(g, 62.8, 0.4, 14.8, mat('concrete'), 0, H - 0.2, -8, 2);
  // gym / canteen wing x -31..-9, z -1..15
  g.add(place(mbox(22, FH, 16, [plainP, plainP, roofT, roofT, plainP, plainP], FH), -20, FH / 2, 7));
  g.add(place(mbox(18, 4.8, 12, [mat('s4a_gymglass'), mat('s4a_gymglass'), roofT, roofT, mat('s4a_gymglass'), mat('s4a_gymglass')], 4.8), -20, FH + 2.4, 7));
  const rf = gableRoof(18.4, 12.4, 1.5, 0.4, mat('metalRoof', { double: true }), mat('concrete', { double: true }), 3); rf.position.set(-20, FH + 4.8, 7); g.add(rf);
  parapet(g, 22.4, 16.4, -20, 7, FH, 0.7); B(g, 22.6, 0.3, 16.6, mat('concrete'), -20, FH - 0.15, 7, 2);
  B(g, 18, 0.3, 12, mat('concrete'), -20, FH + 4.95, 7, 2);
  // wing windows / doors
  wins(g, { cx: -20, cz: 15, r: 0, len: 22, ys: [1.95], step: 3.4, sx: 1.6, sy: 2.2, margin: 2, skip: (s) => Math.abs(s) < 2.4 });
  doorAt(g, { cx: -20, cz: 15, r: 0, s: -0.8, w: 1.5, h: 2.7, c: '#7a3a2a' }); doorAt(g, { cx: -20, cz: 15, r: 0, s: 0.8, w: 1.5, h: 2.7, c: '#7a3a2a' });
  B(g, 5, 0.25, 2.2, mat('concrete'), -20, 3.1, 16, 2);
  wins(g, { cx: -9, cz: 7, r: PI / 2, len: 16, ys: [1.95], step: 3.4, sx: 1.6, sy: 2.2, margin: 2 });
  wins(g, { cx: -31, cz: 7, r: -PI / 2, len: 16, ys: [1.95], step: 3.4, sx: 1.6, sy: 2.2, margin: 2, fixed: true });
  doorAt(g, { cx: -31, cz: 7, r: -PI / 2, s: 0, w: 1.6, h: 2.6, c: '#5a5a62' });
  const num = sign('57', 4.2, 2.6, { bg: '#b8352a' }); num.position.set(-20, 6.4, 13.08); g.add(num);
  // main front, ground storey windows, entrance
  wins(g, { cx: 11, cz: -1, r: 0, len: 40, ys: [1.95], step: 3.6, sx: 1.6, sy: 2.2, margin: 2.5, litN: 6, skip: (s) => Math.abs(s - 3) < 4.4 });
  doorAt(g, { cx: 14, cz: -1, r: 0, s: -0.85, w: 1.6, h: 2.8, y: 1.45, c: '#3a5a8a' }); doorAt(g, { cx: 14, cz: -1, r: 0, s: 0.85, w: 1.6, h: 2.8, y: 1.45, c: '#3a5a8a' });
  B(g, 8, 0.4, 4.4, mat('concrete'), 14, 4.2, 1.2, 2);
  for (const dx of [-3.6, 3.6]) M(g, new THREE.CylinderGeometry(0.2, 0.2, 4, 8), mat('concrete'), 14 + dx, 2.0, 3.0);
  for (let i = 0; i < 3; i++) B(g, 7.6, 0.18 * (3 - i), 1.3, mat('concrete'), 14, 0.09 * (3 - i), 0.2 + i * 1.0 + 0.4, 1.5);
  B(g, 17, 1.6, 0.3, mat('concrete'), 14, 6.0, -0.9, 2);
  const sg = sign('СРЕДНЯЯ ШКОЛА № 57', 16, 1.3, { bg: '#1c3a4a' }); sg.position.set(14, 6.0, -0.72); g.add(sg);
  const hd = sign('УЧИТЬСЯ, УЧИТЬСЯ И УЧИТЬСЯ!', 14, 1.0, { bg: '#a82a1c' }); hd.position.set(14, 9.4, -0.93); g.add(hd);
  // mosaic on the east end
  const mo = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), mat('s4a_mosaic')); mo.position.set(31.06, 6.4, -8); mo.rotation.y = PI / 2; g.add(mo);
  B(g, 0.2, 6.6, 12.6, mat('concrete'), 31.1, 6.4, -8, 2);
  // roof: stair tower, boiler chimney, aerials
  B(g, 7, 3.2, 5, plainP, 14, H + 1.6, -11, 3.2); B(g, 7.6, 0.3, 5.6, mat('concrete'), 14, H + 3.35, -11, 2);
  B(g, 4, 2.4, 3, plainP, -6, H + 1.2, -6, 3); B(g, 4.4, 0.25, 3.4, mat('concrete'), -6, H + 2.5, -6, 2);
  M(g, new THREE.CylinderGeometry(0.8, 1.1, 12, 10), mat('brick'), -24, H + 6, -12.5); M(g, new THREE.CylinderGeometry(1.0, 0.8, 0.6, 10), DARK(), -24, H + 12.2, -12.5);
  antenna(g, 22, H, -9, 5); antenna(g, 2, H, -12, 4);
  // flagpole, fence, trees
  flag(g, 26, 0, 6, 10, 0xc42a1a);
  for (let x = 2; x <= 30; x += 2) B(g, 0.08, 1.2, 0.08, DARK(), x, 0.6, 12, 1);
  B(g, 28, 0.06, 0.06, DARK(), 16, 1.0, 12, 1); B(g, 28, 0.06, 0.06, DARK(), 16, 0.4, 12, 1);
  tree(g, 5, 8, 1.1); tree(g, 22, 10, 1); conifer(g, 30, 6, 1);
  bench(g, 17, 0, 6.6, PI); bench(g, 11, 0, 6.6, PI);
  // back: indestructible windows are painted; add doors, pipes, ladder, vents
  for (const x of [-22, -4, 12, 26]) doorAt(g, { cx: x, cz: -15, r: PI, s: 0, w: 1.6, h: 2.5, y: 1.3, c: '#5a5a62', off: 0.06 });
  for (const x of [-22, -4, 12, 26]) B(g, 2.8, 0.2, 1.2, mat('concrete'), x, 2.7, -15.6, 1);
  for (const x of [-26, -12, 5, 20, 29]) pipe(g, x, -15.15, H, 0, 0.1);
  ladder(g, 30.2, 0.5, H, -15.15, -1);
  for (const x of [-14, 0, 16]) B(g, 1.4, 1.0, 0.7, GREY(), x, 3.0 + 3.6, -15.4, 1);
  wins(g, { cx: -20, cz: -1, r: PI, len: 0, ys: [], step: 1 });
  wins(g, { cx: -9, cz: -8, r: PI / 2, len: 0, ys: [], step: 1 });
  return size(g, 62, 30, 23, [[-31, 31, -15, -1, H + 1], [-31, -9, -1, 15, 8.4]]);
}

// =================================================================== 2. KINDERGARTEN
export function kindergarten(opts = {}) {
  const g = G();
  const glass = mat('glass'), pl = (n) => mat('plain' + n);
  const pavilion = (cx, cz, w, d, h, wall, roofHex, name) => {
    B(g, w + 0.3, 0.4, d + 0.3, mat('concrete'), cx, 0.2, cz, 2);
    g.add(place(mbox(w, h, d, [wall, wall, mat('roofTar'), mat('roofTar'), wall, wall], 3), cx, h / 2 + 0.4, cz));
    return h + 0.4;
  };
  // A (mint, flat teal roof)  B (butter, flat orange roof)  C (cream, funny hip roof)
  const hA = pavilion(-11, -5, 14, 12, 3.4, pl('Mint')), hB = pavilion(11, -5, 14, 12, 3.4, pl('Yellow')), hC = pavilion(0, 6, 12, 10, 4.2, pl('Cream'));
  B(g, 15.6, 0.45, 13.6, color(0x1f9aa6), -11, hA + 0.2, -5, 3); B(g, 15.6, 0.45, 13.6, color(0xf08a2a), 11, hB + 0.2, -5, 3);
  B(g, 13.6, 0.5, 11.6, color(0xd0405a), 0, hC + 0.2, 6, 3);
  // hip roof on C: four-sided cone, a bit squashed and crooked
  const hip = M(g, new THREE.ConeGeometry(9.4, 4.6, 4), color(0xe0384a), 0, hC + 0.45 + 2.3, 6); hip.rotation.y = PI / 4; hip.scale.set(1.0, 1, 0.82);
  M(g, new THREE.ConeGeometry(2.6, 2.2, 4), color(0xf6d22a), 0.8, hC + 5.2, 5.4).rotation.y = PI / 4;
  const dorm = B(g, 2.4, 1.8, 2.0, pl('Cream'), -2.6, hC + 1.5, 9.4, 2); void dorm;
  M(g, new THREE.ConeGeometry(1.9, 1.8, 4), color(0x2f9a4a), -2.6, hC + 3.3, 9.4).rotation.y = PI / 4;
  decalWin(g, -2.6, hC + 1.4, 10.45, 1.0, 1.2, false);
  // chimney + sun disc on A
  B(g, 0.9, 1.8, 0.9, mat('brick'), -14, hA + 1.4, -8, 1.5);
  const sun = M(g, new THREE.CylinderGeometry(1.4, 1.4, 0.2, 12), color(0xffd93a, { emissive: 0x403000 }), -11, hA + 2.2, -0.2); sun.rotation.x = PI / 2;
  // glazed corridors
  const corr = (cx, cz, w, d) => { B(g, w, 2.9, d, glass, cx, 1.45, cz, 3); B(g, w + 0.4, 0.3, d + 0.4, color(0xb03a3a), cx, 3.05, cz, 2); };
  corr(0, -5, 8.4, 5); corr(0, -0.6, 3.6, 2.4);
  // mural on C front
  const mur = new THREE.Mesh(new THREE.PlaneGeometry(9, 3.0), mat('s4a_kgmural')); mur.position.set(0, 2.5, 11.07); g.add(mur);
  B(g, 9.4, 3.4, 0.14, color(0xffffff), 0, 2.5, 11.0, 1);
  doorAt(g, { cx: 0, cz: 11, r: 0, s: 4.6 - 9, w: 1.5, h: 2.4, y: 1.6, c: '#e8442a' });
  decalWin(g, -4.2, 2.4, 11.07, 1.3, 1.9, false); decalWin(g, 4.2, 2.4, 11.07, 1.3, 1.9, false);
  const sg = sign('ДЕТСКИЙ САД «СОЛНЫШКО»', 8, 0.8, { bg: '#2a8ac0' }); sg.position.set(0, hC - 0.15, 11.08); g.add(sg);
  // A and B fronts (facing +Z, look into yard) & sides & backs
  for (const cx of [-11, 11]) {
    wins(g, { cx, cz: 1, r: 0, len: 14, ys: [2.2], step: 3.4, sx: 1.7, sy: 1.8, margin: 2.2, c: '#ffffff', litN: 3 });
    wins(g, { cx, cz: -11, r: PI, len: 14, ys: [2.2], step: 3.4, sx: 1.6, sy: 1.8, margin: 2.2, fixed: true, c: '#ffffff' });
  }
  doorAt(g, { cx: -11, cz: 1, r: 0, s: 5, w: 1.4, h: 2.3, y: 1.55, c: '#f2922a' }); doorAt(g, { cx: 11, cz: 1, r: 0, s: -5, w: 1.4, h: 2.3, y: 1.55, c: '#3a8ae0' });
  doorAt(g, { cx: 0, cz: -11, r: PI, s: 0, w: 1.4, h: 2.3, y: 1.55, c: '#6a4a8a', off: 0.1 });
  B(g, 14.2, 0.3, 0.45, color(0xf2d63a), 0, 0, 0, 1).visible = false;
  wins(g, { cx: -18, cz: -5, r: -PI / 2, len: 12, ys: [2.2], step: 3.4, sx: 1.6, sy: 1.8, margin: 2, fixed: true, c: '#ffffff' });
  wins(g, { cx: 18, cz: -5, r: PI / 2, len: 12, ys: [2.2], step: 3.4, sx: 1.6, sy: 1.8, margin: 2, fixed: true, c: '#ffffff' });
  wins(g, { cx: -6, cz: 6, r: -PI / 2, len: 10, ys: [2.3], step: 3.4, sx: 1.4, sy: 1.8, margin: 2, fixed: true, c: '#ffffff' });
  wins(g, { cx: 6, cz: 6, r: PI / 2, len: 10, ys: [2.3], step: 3.4, sx: 1.4, sy: 1.8, margin: 2, fixed: true, c: '#ffffff' });
  for (const x of [-16, 16, -5, 5]) pipe(g, x, -11.12, 3.4, 0.4, 0.08);
  B(g, 2.2, 1.0, 1.2, color(0x3e6a3e), -15, 0.9, -12.0, 1.5); B(g, 2.2, 0.15, 1.3, DARK(), -15, 1.45, -12.0, 1);          // bins
  B(g, 2.2, 1.0, 1.2, color(0x3e6a3e), 15, 0.9, -12.0, 1.5);
  // colourful balloons / rainbow arch over the corridor entrance
  const cols = [0xe63a3a, 0xf2922a, 0xf6dc3a, 0x4ab84a, 0x3a8ae0];
  cols.forEach((c, i) => { const a = new THREE.Mesh(new THREE.TorusGeometry(2.4 - i * 0.22, 0.1, 4, 14, PI), color(c)); a.position.set(0, 3.2, -2.6); g.add(a); });
  // fenced yard
  const fx0 = 6.6, fx1 = 17.4, fz0 = 2.4, fz1 = 10.6, fc = [0xe63a3a, 0xf6dc3a, 0x3a8ae0, 0x4ab84a];
  let k = 0;
  const post = (x, z) => B(g, 0.1, 1.3, 0.1, color(fc[k++ % 4]), x, 0.65, z, 1);
  for (let x = fx0; x <= fx1 + 0.01; x += 0.9) { post(x, fz1); if (x < 12.5 || x > 14.5) post(x, fz0); }
  for (let z = fz0; z <= fz1 + 0.01; z += 0.9) { post(fx0, z); post(fx1, z); }
  for (const z of [fz0, fz1]) B(g, fx1 - fx0, 0.07, 0.07, color(0xfafafa), (fx0 + fx1) / 2, 1.1, z, 1);
  for (const x of [fx0, fx1]) B(g, 0.07, 0.07, fz1 - fz0, color(0xfafafa), x, 1.1, (fz0 + fz1) / 2, 1);
  B(g, fx1 - fx0 - 0.4, 0.04, fz1 - fz0 - 0.4, mat('grass'), (fx0 + fx1) / 2, 0.03, (fz0 + fz1) / 2, 3);
  // sandbox
  B(g, 3.0, 0.3, 3.0, mat('planks'), 9.2, 0.15, 5, 1); B(g, 2.7, 0.06, 2.7, color(0xe0c882), 9.2, 0.3, 5, 1);
  // slide
  B(g, 1.2, 1.9, 1.2, color(0x3a8ae0), 14.4, 0.95, 4.2, 1); B(g, 0.9, 0.06, 3.0, color(0xf2d63a), 14.4, 1.0, 5.8, 1).rotation.x = -0.6;
  // swing
  for (const x of [-1.4, 1.4]) { const l = B(g, 0.1, 2.5, 0.1, color(0xd0405a), 12 + x, 1.2, 9.4, 1); l.rotation.z = 0; }
  B(g, 3.1, 0.1, 0.1, color(0xd0405a), 12, 2.45, 9.4, 1);
  B(g, 0.04, 1.6, 0.04, DARK(), 11.5, 1.6, 9.4, 1); B(g, 0.04, 1.6, 0.04, DARK(), 12.5, 1.6, 9.4, 1); B(g, 1.1, 0.07, 0.3, color(0xf6dc3a), 12, 0.8, 9.4, 1);
  // mushrooms
  for (const [x, z, c] of [[16.2, 9.4, 0xe03030], [7.8, 9.8, 0xf2922a]]) { M(g, new THREE.CylinderGeometry(0.2, 0.25, 0.9, 6), color(0xf0e8d0), x, 0.45, z); M(g, new THREE.SphereGeometry(0.75, 8, 5, 0, 2 * PI, 0, PI / 2), color(c), x, 0.9, z); }
  // spring rider (horse) and tiny trees
  tree(g, 17.0, 3.2, 0.7); tree(g, -16, 8, 0.9); tree(g, -8, 11, 0.8); conifer(g, -17.6, 2, 0.7);
  bench(g, 8, 0, 3.2, 0, 1.4);
  return size(g, 36, 22, 9.6, [[-18, -4, -11, 1, 3.8], [4, 18, -11, 1, 3.8], [-6, 6, 1, 11, 4.6], [-4.2, 4.2, -7.5, -2.5, 3.2], [-1.8, 1.8, -1.8, 1, 3.2]]);
}
function decalWin(g, x, y, z, w, h, fixed) { g.add(decal('window', w, h, x, y, z, { c: '#ffffff', fixed })); }

// =================================================================== 3. STALINKA
export function stalinka(opts = {}) {
  const g = G();
  const AW = 9, BASE = 6.6, FL = 3.3, UP = FL * 5, TOPY = BASE + UP;      // arch width, base height, floor height, upper height, cornice level (23.1)
  const baseP = mat('s4a_stbaseplain'), baseW = mat('s4a_stbase'), upW = mat('stalin'), upP = mat('s4a_stplain'), roofT = mat('roofTar'), cream = mat('plainCream');
  // ---- front and back wings (arched passage)
  const frontBase = archWall(84, BASE, 16, AW, BASE - 4.5, baseP, 6.6); frontBase.position.set(0, 0, 26); g.add(frontBase);
  const backBase = archWall(84, BASE, 16, AW, BASE - 4.5, baseW, 6.6); backBase.position.set(0, 0, -26); g.add(backBase);
  // upper floors
  g.add(place(mbox(84, UP, 16, [upW, upW, roofT, roofT, upP, upW], 6.6), 0, BASE + UP / 2, 26));
  g.add(place(mbox(84, UP, 16, [upW, upW, roofT, roofT, upW, upW], 6.6), 0, BASE + UP / 2, -26));
  // side wings
  for (const sd of [-1, 1]) {
    g.add(place(mbox(16, BASE, 36, [baseW, baseW, roofT, roofT, baseW, baseW], 6.6), sd * 34, BASE / 2, 0));
    g.add(place(mbox(16, UP, 36, [upW, upW, roofT, roofT, upW, upW], 6.6), sd * 34, BASE + UP / 2, 0));
  }
  // cornice + attic + roof for all four wings
  const wingsR = [[0, 26, 84, 16], [0, -26, 84, 16], [-34, 0, 16, 36], [34, 0, 16, 36]];
  for (const [cx, cz, w, d] of wingsR) {
    B(g, w + 1.4, 0.5, d + 1.4, cream, cx, TOPY + 0.25, cz, 3); B(g, w + 2.0, 0.7, d + 2.0, cream, cx, TOPY + 0.85, cz, 3);
    B(g, w + 0.4, 0.5, d + 0.4, cream, cx, BASE - 0.1, cz, 3).scale.y = 0.5;
  }
  // attic band along the outer perimeter + roof deck
  B(g, 84, 1.6, 0.6, cream, 0, TOPY + 1.2 + 0.8, 33.7, 2); B(g, 84, 1.6, 0.6, cream, 0, TOPY + 1.2 + 0.8, -33.7, 2);
  B(g, 0.6, 1.6, 72, cream, -41.7, TOPY + 2.0, 0, 2); B(g, 0.6, 1.6, 72, cream, 41.7, TOPY + 2.0, 0, 2);
  // pilasters on front, between bays
  for (let x = -38; x <= 38; x += 12) if (Math.abs(x) > 6) B(g, 1.0, UP, 0.5, cream, x, BASE + UP / 2, 34.25, 3);
  // ---- front facade windows (shatterable, plain wall)
  const fw = (rows, skip) => wins(g, { cx: 0, cz: 34, r: 0, len: 84, ys: rows, step: FL, sx: 1.3, sy: 2.2, margin: 1.6, c: '#efe5c6', litN: 7, skip });
  fw([BASE + FL * 0 + 1.8, BASE + FL * 1 + 1.8, BASE + FL * 2 + 1.8, BASE + FL * 3 + 1.8, BASE + FL * 4 + 1.8], (s, y) => Math.abs(s) < 3.0 && false);
  wins(g, { cx: 0, cz: 34, r: 0, len: 84, ys: [1.9, 4.9], step: FL, sx: 1.4, sy: 2.4, margin: 1.6, c: '#efe5c6', litN: 6, skip: (s) => Math.abs(s) < 11.5 });
  // ---- portico around the arch
  for (const x of [-6.8, -10.0, 6.8, 10.0]) { M(g, new THREE.CylinderGeometry(0.7, 0.8, 14.5, 12), cream, x, 7.25, 35.6); B(g, 2.0, 0.5, 2.0, cream, x, 14.75, 35.6, 2); B(g, 1.9, 0.5, 1.9, cream, x, 0.25, 35.6, 2); }
  B(g, 25, 1.5, 3.4, cream, 0, 15.5, 35.0, 3); B(g, 26, 0.5, 3.8, cream, 0, 16.5, 35.0, 3);
  B(g, 25, 0.9, 0.2, cream, 0, 17.2, 36.6, 2);
  for (let x = -12; x <= 12; x += 1.5) B(g, 0.15, 0.8, 0.15, cream, x, 17.3, 36.6, 1);
  const sgn = sign('ЖИЛОЙ ДОМ  ·  СЛАВА ТРУДУ', 18, 1.1, { bg: '#7a1c14' }); sgn.position.set(0, 15.5, 36.72); g.add(sgn);
  B(g, 11, 0.6, 2.2, cream, 0, 0.3, 36.0, 3);  // step
  // inner arch trim: pilaster frames at the passage mouths
  for (const sd of [-1, 1]) for (const z of [34.1, -34.1]) B(g, 0.9, 6.6, 0.4, cream, sd * 5.0, 3.3, z, 2);
  // ---- central tower (front), stepped, with spire & star
  g.add(place(mbox(22, 4.6, 12, [upW, upW, roofT, roofT, upW, upW], 6.6), 0, TOPY + 2.0 + 2.3, 27));
  B(g, 24, 0.6, 14, cream, 0, TOPY + 2.0 + 4.9, 27, 3);
  g.add(place(mbox(13, 4.4, 8, [upW, upW, roofT, roofT, upW, upW], 6.6), 0, TOPY + 2.0 + 5.2 + 2.2, 27));
  B(g, 14.6, 0.6, 9.6, cream, 0, TOPY + 2.0 + 9.8 + 0.1, 27, 3);
  for (const x of [-4.5, -1.5, 1.5, 4.5]) M(g, new THREE.CylinderGeometry(0.35, 0.4, 2.4, 8), cream, x, TOPY + 2.0 + 10.4 + 1.2, 27);
  B(g, 11, 0.5, 6.4, cream, 0, TOPY + 2.0 + 13.0, 27, 3);
  M(g, new THREE.ConeGeometry(4.2, 7.5, 8), mat('shingleGreen', { double: true }), 0, TOPY + 2.0 + 13.2 + 3.75, 27);
  M(g, new THREE.CylinderGeometry(0.12, 0.2, 3.2, 6), color(0xd9a62a), 0, TOPY + 2.0 + 21.0 + 0.6, 27);
  star(g, 0, TOPY + 2.0 + 23.4, 27, 1.2);
  const clk = new THREE.Mesh(new THREE.CircleGeometry(1.6, 16), mat('clock')); clk.position.set(0, TOPY + 2.0 + 7.6, 31.05); g.add(clk);
  // corner turrets
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = sx * 37.5, z = sz * 29.5;
    g.add(place(mbox(8, 5, 8, [upW, upW, roofT, roofT, upW, upW], 6.6), x, TOPY + 2 + 2.5, z));
    B(g, 9, 0.5, 9, cream, x, TOPY + 2 + 5.2, z, 3);
    M(g, new THREE.ConeGeometry(6.2, 6, 4), mat('shingleGreen', { double: true }), x, TOPY + 2 + 8.2, z).rotation.y = PI / 4;
    M(g, new THREE.CylinderGeometry(0.08, 0.1, 2.6, 6), color(0xd9a62a), x, TOPY + 2 + 12.4, z);
    star(g, x, TOPY + 2 + 14.2, z, 0.5);
  }
  // back tower over the rear arch (smaller)
  g.add(place(mbox(16, 4, 9, [upW, upW, roofT, roofT, upW, upW], 6.6), 0, TOPY + 2 + 2, -27));
  B(g, 17.4, 0.5, 10.4, cream, 0, TOPY + 2 + 4.2, -27, 3);
  M(g, new THREE.ConeGeometry(6.6, 4.4, 4), mat('shingleGreen', { double: true }), 0, TOPY + 2 + 6.7, -27).rotation.y = PI / 4;
  // roof junk
  for (const [x, z] of [[-30, 28], [28, -22], [-22, -28], [32, 24], [-37, 6], [37, -8], [20, 28], [-18, -24]]) { B(g, 1.2, 2.2, 1.2, mat('brick'), x, TOPY + 2 + 1.1, z, 1.5); B(g, 1.5, 0.2, 1.5, DARK(), x, TOPY + 2 + 2.3, z, 1); }
  antenna(g, -24, TOPY + 2, 26, 5); antenna(g, 22, TOPY + 2, -28, 5); antenna(g, -37, TOPY + 2, -8, 4); antenna(g, 37, TOPY + 2, 12, 5);
  // ---- balconies: front (above portico, wide), courtyard & outer sides
  const balc = (x, y, z, w, ry) => { const b = G(); B(b, w, 0.22, 1.1, cream, 0, 0, 0.55, 2); B(b, w, 0.9, 0.08, DARK(), 0, 0.55, 1.08, 1); b.position.set(x, y, z); b.rotation.y = ry; g.add(b); };
  for (const x of [-30, -18, 18, 30]) for (const y of [BASE + FL * 1, BASE + FL * 3]) balc(x, y + 0.2, 34, 3.0, 0);
  for (const sd of [-1, 1]) for (let z = -13; z <= 13; z += 6.5) for (const y of [BASE + FL, BASE + FL * 3]) balc(sd * 26, y + 0.2, z, 2.4, sd > 0 ? -PI / 2 : PI / 2);
  for (const sd of [-1, 1]) for (let x = -20; x <= 20; x += 8) if (Math.abs(x) > 6) for (const y of [BASE + FL * 2]) { balc(x, y + 0.2, sd * 18, 2.6, sd > 0 ? PI : 0); }
  // ---- fixed windows on base of courtyard & outside walls are painted into s4a_stbase; add doors and details
  // front doors in the base (shatter not needed)
  for (const x of [-20, 20]) { doorAt(g, { cx: 0, cz: 34, s: x, w: 2.0, h: 3.2, y: 1.7, c: '#4a3a2a' }); B(g, 3.6, 0.3, 1.6, cream, x, 3.7, 34.8, 2); }
  for (const x of [-28, -14, 14, 28]) { doorAt(g, { cx: 0, cz: -34, r: PI, s: x, w: 2.0, h: 3.2, y: 1.7, c: '#4a3a2a' }); B(g, 3.6, 0.3, 1.6, cream, x, 3.7, -34.8, 2); }
  for (const sd of [-1, 1]) for (const z of [-9, 9]) { doorAt(g, { cx: sd * 26, cz: z, r: sd > 0 ? -PI / 2 : PI / 2, w: 2.0, h: 3.2, y: 1.7, c: '#4a3a2a', off: 0.1 }); B(g, 1.6, 0.3, 3.6, cream, sd * 26 - sd * 0.8, 3.7, z, 2); }
  for (const x of [-30, -12, 12, 30]) pipe(g, x, -34.2, TOPY, 0, 0.12); for (const z of [-12, 12]) pipe(g, -42.2, z, TOPY, 0, 0.12), pipe(g, 42.2, z, TOPY, 0, 0.12);
  // lamps in the arches
  for (const z of [26, -26]) B(g, 0.5, 0.3, 0.5, color(0xffe9a0, { emissive: 0x806020 }), 0, 5.4, z, 1);
  // ---- courtyard
  B(g, 52, 0.06, 36, mat('grass'), 0, 0.03, 0, 5);
  B(g, 3.2, 0.08, 36, mat('pavingDark'), 0, 0.07, 0, 3); B(g, 52, 0.08, 3.2, mat('pavingDark'), 0, 0.08, 0, 3);
  // fountain
  M(g, new THREE.CylinderGeometry(4.2, 4.4, 0.7, 14), mat('granite'), 0, 0.35, 0); M(g, new THREE.CylinderGeometry(3.7, 3.7, 0.12, 14), mat('water'), 0, 0.68, 0);
  M(g, new THREE.CylinderGeometry(0.35, 0.5, 2.6, 8), mat('granite'), 0, 1.7, 0); M(g, new THREE.CylinderGeometry(1.4, 0.4, 0.4, 10), mat('granite'), 0, 2.9, 0); M(g, new THREE.SphereGeometry(0.4, 8, 6), color(0xcfe9f4), 0, 3.4, 0);
  // trees (sphere/cone stacks) around, benches
  for (const [x, z] of [[-14, -9], [14, -9], [-14, 9], [14, 9], [-22, 0], [22, 0], [-9, -15], [9, 15], [-8, 15], [8, -15]]) tree(g, x, z, 1.0 + ((x * 7 + z) % 3) * 0.1);
  for (const [x, z] of [[-20, -8], [-20, 8], [20, -8], [20, 8]]) conifer(g, x, z, 0.9);
  for (const [x, z, ry] of [[-6.5, -4, 0], [6.5, 4, PI], [-4, 6.5, -PI / 2], [4, -6.5, PI / 2], [-12, 0, PI / 2], [12, 0, -PI / 2], [-12, -16, 0], [12, 16, PI]]) bench(g, x, 0.1, z, ry);
  // laundry lines
  for (const [x1, x2, z, y] of [[-24, -18, 12, 3.1], [18, 24, -12, 3.1]]) {
    B(g, 0.12, y + 0.4, 0.12, DARK(), x1, (y + 0.4) / 2, z, 1); B(g, 0.12, y + 0.4, 0.12, DARK(), x2, (y + 0.4) / 2, z, 1); B(g, x2 - x1, 0.03, 0.03, DARK(), (x1 + x2) / 2, y + 0.3, z, 1);
    for (let i = 0; i < 6; i++) B(g, 0.6, 0.9, 0.03, color([0xf4f0e8, 0x4a7ac0, 0xd04040, 0xf0d060][i % 4]), x1 + 0.8 + i * 0.9, y - 0.1, z, 1);
  }
  // sandbox + playground
  B(g, 3.4, 0.3, 3.4, mat('planks'), -18, 0.18, -2, 1); B(g, 3.0, 0.06, 3.0, color(0xe0c882), -18, 0.34, -2, 1);
  B(g, 2.6, 0.12, 0.4, color(0xd04040), -18, 0.7, -4.4, 1);
  for (const x of [-1.2, 1.2]) B(g, 0.1, 2.4, 0.1, color(0x3a8ae0), -20 + x + 4.2 * 0, 1.2, 4, 1); B(g, 2.6, 0.1, 0.1, color(0x3a8ae0), -20, 2.4, 4, 1);
  // gas pipe / transformer booth in the corner
  B(g, 3, 2.6, 2.4, mat('brick'), 22, 1.3, 14, 2); B(g, 3.4, 0.3, 2.8, mat('concrete'), 22, 2.75, 14, 2);
  const cols = [[-42, -4.5, 18, 34, 25], [4.5, 42, 18, 34, 25], [-42, -4.5, -34, -18, 25], [4.5, 42, -34, -18, 25], [-42, -26, -18, 18, 25], [26, 42, -18, 18, 25]];
  return size(g, 84, 72, 40, cols);
}

// =================================================================== 4. HOTEL INTOURIST
export function hotelIntourist(opts = {}) {
  const g = G(), H = 60;
  const wall = mat('s4a_hotelwall'), endW = mat('s4a_hotelend'), roofT = mat('roofTar');
  // slab z -16..0
  g.add(place(mbox(70, H, 16, [endW, endW, roofT, roofT, wall, wall], 6), 0, H / 2, -8));
  for (const sd of [-1, 1]) B(g, 3.0, H, 16.6, mat('concrete'), sd * 34.6, H / 2, -8, 4);       // end piers
  for (const x of [-17.5, 0, 17.5]) B(g, 0.9, H, 0.5, mat('concrete'), x, H / 2, 0.2, 4);        // fins on the front
  B(g, 71, 0.6, 17, mat('concrete'), 0, H + 0.1, -8, 3);
  parapet(g, 70.6, 16.4, 0, -8, H + 0.4, 0.8);
  // rooftop restaurant
  g.add(place(mbox(36, 3.6, 8, [wall, wall, roofT, roofT, wall, wall], 6), 0, H + 0.4 + 1.8, -9)); B(g, 37, 0.4, 9, mat('concrete'), 0, H + 4.2, -9, 3);
  // podium z -17..14, x +-38
  const gr = mat('concrete');
  g.add(place(mbox(76, 7, 31, [gr, gr, mat('concrete'), roofT, gr, gr], 4), 0, 3.5, -1.5));
  parapet(g, 76, 31, 0, -1.5, 7, 0.9);
  B(g, 76.8, 0.6, 31.8, mat('concrete'), 0, 6.9, -1.5, 3);
  // glass lobby (front, centre) + canopy
  const lg = new THREE.Mesh(new THREE.PlaneGeometry(32, 6.2), mat('glass')); lg.position.set(0, 3.5, 14.06); g.add(lg);
  for (let x = -16; x <= 16; x += 3.2) B(g, 0.22, 6.4, 0.3, DARK(), x, 3.5, 14.2, 1);
  B(g, 32.4, 0.3, 0.3, DARK(), 0, 6.6, 14.2, 1); B(g, 32.4, 0.3, 0.3, DARK(), 0, 0.4, 14.2, 1);
  for (const x of [-1.6, 1.6]) doorAt(g, { cx: 0, cz: 14.2, s: x, w: 2.6, h: 3.4, y: 1.8, c: '#2a3a4a', off: 0.05 });
  B(g, 36, 0.5, 3.6, mat('concrete'), 0, 5.0, 15.9, 3); B(g, 36.2, 1.0, 0.3, color(0x1a5a8a), 0, 5.0, 17.75, 1);
  const hs = sign('ГОСТИНИЦА «ИНТУРИСТ»', 16, 0.8, { bg: '#1a5a8a', border: null }); hs.position.set(0, 5.0, 17.92); g.add(hs);
  for (const x of [-16, -8, 0, 8, 16]) M(g, new THREE.CylinderGeometry(0.22, 0.22, 4.7, 8), color(0xd4d4d4), x, 2.35, 17.2);
  for (let i = 0; i < 3; i++) B(g, 32, 0.15 * (3 - i), 1.1, mat('concrete'), 0, 0.075 * (3 - i), 15.2 + i * 0.4 + 0.4, 2);
  // podium flank windows (shatterable on the front)
  for (const sd of [-1, 1]) {
    wins(g, { cx: sd * 27, cz: 14, r: 0, len: 22, ys: [1.9, 5.1], step: 3.8, sx: 1.7, sy: 2.5, margin: 2, c: '#ffffff', litN: 4 });
    wins(g, { cx: sd * 38, cz: -1.5, r: sd * PI / 2, len: 31, ys: [1.9, 5.1], step: 3.8, sx: 1.7, sy: 2.5, margin: 2, fixed: true, c: '#ffffff' });
  }
  wins(g, { cx: 0, cz: -17, r: PI, len: 76, ys: [5.1], step: 3.8, sx: 1.7, sy: 2.5, margin: 2, fixed: true, c: '#ffffff' });
  // back loading bays
  for (const x of [-24, -8, 8, 24]) { doorAt(g, { cx: 0, cz: -17, r: PI, s: x, w: 3.2, h: 3.4, y: 1.8, c: '#5a5a62', off: 0.08 }); B(g, 5, 0.25, 2.2, mat('concrete'), x, 3.8, -18.1, 2); }
  for (const x of [-32, 14]) { B(g, 2.4, 1.2, 1.4, color(0x3e6a3e), x, 0.6, -17.8, 1.5); B(g, 2.4, 0.15, 1.5, DARK(), x, 1.25, -17.8, 1); }
  for (const x of [-30, -12, 12, 30]) pipe(g, x, -17.1, 7, 0, 0.12);
  for (const x of [-30, -15, 15, 30]) pipe(g, x, -16.15, 60, 0, 0.1);
  // roof sign "ИНТУРИСТ" on a frame, readable from front and back
  const SY = H + 6.4;
  for (const x of [-17, -6, 6, 17]) B(g, 0.35, 5.2, 0.35, DARK(), x, H + 2.6 + 0.6, -1.8, 1);
  B(g, 42, 0.4, 0.5, DARK(), 0, SY - 3.0, -1.8, 1); B(g, 42, 0.4, 0.5, DARK(), 0, SY + 3.0, -1.8, 1);
  B(g, 42, 6.2, 0.35, color(0x15283a), 0, SY, -1.8, 1);
  const s1 = sign('ИНТУРИСТ', 40, 5.4, { bg: '#15283a', fg: '#ffffff', border: null }); s1.position.set(0, SY, -1.6); g.add(s1);
  const s2 = sign('ИНТУРИСТ', 40, 5.4, { bg: '#15283a', fg: '#ffffff', border: null }); s2.position.set(0, SY, -2.0); s2.rotation.y = PI; g.add(s2);
  // flags on podium roof edge and roof
  [0xc42a1a, 0x1a4a9a, 0xf4f4f4, 0x2a8a3a, 0xe8b020, 0xc42a1a, 0x1a4a9a].forEach((c, i) => flag(g, -27 + i * 9, 7.4, 12.5, 7, c, 0));
  antenna(g, -28, H + 0.8, -12, 7); antenna(g, 28, H + 0.8, -4, 8);
  M(g, new THREE.SphereGeometry(0.3, 6, 4), color(0xff2010, { emissive: 0xff2010 }), -34.6, H + 1.4, -8); M(g, new THREE.SphereGeometry(0.3, 6, 4), color(0xff2010, { emissive: 0xff2010 }), 34.6, H + 1.4, -8);
  for (const x of [-27, -20, 20, 27]) { B(g, 3.4, 1.8, 3, GREY(), x, H + 1.4, -11, 2); M(g, new THREE.CylinderGeometry(0.9, 0.9, 0.3, 8), DARK(), x, H + 2.45, -11); }
  B(g, 5, 4, 5, mat('concrete'), -30, H + 2.4, -5, 3);
  return size(g, 76, 34, 68, [[-38, 38, -17, 14, 7.6], [-35, 35, -16, 0, H + 2]]);
}

// =================================================================== 5. RESEARCH INSTITUTE
export function researchInstitute(opts = {}) {
  const g = G(), FH = 3.5, roofT = mat('roofTar');
  const nw = mat('s4a_niiwall'), nb = mat('s4a_niibase'), conc = mat('concrete');
  const wing = (cx, cz, w, d, floors) => {
    const h = floors * FH;
    g.add(place(mbox(w, FH, d, [nw, nw, roofT, roofT, nb, nw], FH), cx, FH / 2, cz));
    g.add(place(mbox(w, h - FH, d, nw, FH), cx, FH + (h - FH) / 2, cz));
    B(g, w + 0.8, 0.5, d + 0.8, conc, cx, h + 0.1, cz, 2); parapet(g, w + 0.6, d + 0.6, cx, cz, h + 0.3, 0.7);
    return h;
  };
  const hS = wing(0, -10, 64, 10, 8);                       // spine at the back
  const hC = wing(0, 2.5, 10, 25, 8);                        // central tooth (entrance)
  const hL = wing(-25, 2.5, 10, 25, 6), hR = wing(25, 2.5, 10, 25, 6);
  void hC;
  // glazed link balconies between teeth: horizontal sunshades
  for (const cx of [-12.5, 12.5]) for (let f = 2; f <= 6; f += 2) B(g, 15.2, 0.2, 1.0, conc, cx, f * FH, -4.6, 2);
  // ground-floor windows on the fronts of the teeth and spine (shatterable)
  const gw = (opt) => wins(g, { ys: [1.8], step: 3.5, sx: 1.9, sy: 2.4, margin: 1.8, c: '#e8e6dc', ...opt });
  gw({ cx: 0, cz: 15, r: 0, len: 10, skip: (s) => Math.abs(s) < 3.3 && false });
  gw({ cx: -25, cz: 15, r: 0, len: 10 }); gw({ cx: 25, cz: 15, r: 0, len: 10 });
  gw({ cx: -12.5, cz: -5, r: 0, len: 15.2, margin: 2 }); gw({ cx: 12.5, cz: -5, r: 0, len: 15.2, margin: 2 });
  gw({ cx: -20, cz: 2.5, r: PI / 2, len: 25, litN: 4 }); gw({ cx: 20, cz: 2.5, r: -PI / 2, len: 25, litN: 4 });
  gw({ cx: -30, cz: 2.5, r: PI / 2 + PI, len: 25, fixed: true }); gw({ cx: 30, cz: 2.5, r: PI / 2, len: 25, fixed: true });
  gw({ cx: -5, cz: 2.5, r: -PI / 2, len: 25, fixed: true }); gw({ cx: 5, cz: 2.5, r: PI / 2, len: 25, fixed: true });
  gw({ cx: 0, cz: -15, r: PI, len: 64, fixed: true, step: 3.5 });
  // entrance: relief panel, portal, canopy
  const rel = new THREE.Mesh(new THREE.PlaneGeometry(9, 6.0), mat('s4a_relief')); rel.position.set(0, 9.4, 15.12); g.add(rel);
  B(g, 9.6, 6.6, 0.22, conc, 0, 9.4, 15.0, 2);
  B(g, 8, 0.4, 5, conc, 0, 4.6, 17.0, 2);
  for (const x of [-3.4, 3.4]) B(g, 0.5, 4.4, 0.5, conc, x, 2.2, 18.8, 2);
  B(g, 8, 0.4, 0.3, conc, 0, 4.4, 19.4, 2);
  for (const x of [-1.2, 1.2]) doorAt(g, { cx: 0, cz: 15, s: x, w: 2.0, h: 3.0, y: 1.6, c: '#2a3a52', off: 0.09 });
  for (let i = 0; i < 4; i++) B(g, 8.4, 0.16 * (4 - i), 1.1, conc, 0, 0.08 * (4 - i), 18.4 + i * 0.0 + 0.55 - 0.0, 2);
  const nm = sign('НИИ ПРИКЛАДНОЙ ФИЗИКИ', 8.6, 0.9, { bg: '#16273a' }); nm.position.set(0, 4.6, 19.58); g.add(nm);
  // atom sculpture in the left gap
  const gold = color(0xd9a62a, { emissive: 0x302000 });
  B(g, 1.8, 0.8, 1.8, conc, -12.5, 0.4, 9, 2); M(g, new THREE.SphereGeometry(0.8, 10, 8), color(0xd8302a), -12.5, 3.0, 9);
  for (let i = 0; i < 3; i++) { const t = M(g, new THREE.TorusGeometry(2.2, 0.08, 4, 18), gold, -12.5, 3.0, 9); t.rotation.set(i * 1.05, i * 0.7, 0); }
  M(g, new THREE.CylinderGeometry(0.1, 0.1, 2.2, 5), conc, -12.5, 1.5, 9);
  for (const [x, z] of [[-12.5, 4], [12.5, 12], [12.5, 4], [-12.5, 12]]) bench(g, x - 3.5, 0, z, 0), tree(g, x + 4.2, z, 0.9);
  // roof: dishes, radar, mast, observatory dome, machine rooms
  const ry = hS;
  B(g, 8, 3, 6, nb, -22, ry + 1.5 + 0.4, -9, 3); B(g, 8.4, 0.3, 6.4, conc, -22, ry + 3.1 + 0.4, -9, 2);
  dish(g, -12, ry + 0.4, -10, 3.2, 0.4, 0.8); dish(g, 8, ry + 0.4, -12, 2.4, -0.3, 0.9); dish(g, 24, ry + 0.4, -8, 3.6, 0.9, 0.6);
  // radar on the central tooth roof: tall pedestal + big grid reflector
  const cy = hC;
  B(g, 3, 2.4, 3, conc, 0, cy + 1.2 + 0.4, 6, 2); M(g, new THREE.CylinderGeometry(0.4, 0.5, 2.5, 8), GREY(), 0, cy + 3.9, 6);
  const rad = G(); B(rad, 9, 3.4, 0.25, color(0xcfcdc4), 0, 0, 0, 3); B(rad, 9.4, 0.2, 0.35, GREY(), 0, 1.7, 0, 1); B(rad, 9.4, 0.2, 0.35, GREY(), 0, -1.7, 0, 1); B(rad, 0.15, 0.15, 2.2, DARK(), 0, 0, 1.1, 1);
  rad.position.set(0, cy + 6.1, 6); rad.rotation.y = 0.5; g.add(rad);
  // lattice mast
  const mx = -28, mz = -12;
  for (const [dx, dz] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]) B(g, 0.12, 14, 0.12, DARK(), mx + dx, ry + 7.4, mz + dz, 1);
  for (let y = 0; y < 14; y += 2) { B(g, 1.3, 0.08, 0.08, DARK(), mx, ry + 0.9 + y, mz - 0.6, 1); B(g, 1.3, 0.08, 0.08, DARK(), mx, ry + 0.9 + y, mz + 0.6, 1); B(g, 0.08, 0.08, 1.3, DARK(), mx - 0.6, ry + 0.9 + y, mz, 1); B(g, 0.08, 0.08, 1.3, DARK(), mx + 0.6, ry + 0.9 + y, mz, 1); }
  M(g, new THREE.SphereGeometry(0.3, 6, 4), color(0xff2010, { emissive: 0xff2010 }), mx, ry + 14.6, mz);
  antenna(g, -2, ry + 0.4, -13, 6); antenna(g, 14, ry + 0.4, -6, 5);
  // observatory
  const ox = 18, oz = -10;
  M(g, new THREE.CylinderGeometry(3.2, 3.4, 3.2, 12), mat('stuccoWhite'), ox, ry + 0.4 + 1.6, oz);
  const dm = M(g, new THREE.SphereGeometry(3.3, 14, 8, 0, 2 * PI, 0, PI / 2), mat('domeSilver', { double: true }), ox, ry + 0.4 + 3.2, oz);
  B(g, 0.9, 3.0, 1.0, DARK(), ox + 0.0, ry + 0.4 + 5.0, oz + 2.6, 1).rotation.x = -0.35; void dm;
  M(g, new THREE.CylinderGeometry(0.2, 0.2, 2.6, 6), DARK(), ox + 2.2, ry + 0.4 + 4.6, oz + 1.6).rotation.x = 1.0;
  // back details: fire stairs core + utilities
  B(g, 5, 28, 3.2, nb, -26, 14, -16.7, 3);
  wins(g, { cx: -26, cz: -18.3, r: PI, len: 5, ys: [3, 7, 11, 15, 19, 23, 27], step: 4, sx: 0.9, sy: 1.6, margin: 1, fixed: true });
  for (const x of [-12, 12, 30]) { doorAt(g, { cx: 0, cz: -15, r: PI, s: x, w: 2.0, h: 2.8, y: 1.5, c: '#5a5a62', off: 0.1 }); B(g, 3.4, 0.25, 1.3, conc, x, 3.2, -15.8, 2); }
  for (const x of [-18, -6, 10, 22, 31]) pipe(g, x, -15.2, 28, 0, 0.12);
  for (const x of [-10, 4, 16]) { B(g, 2.2, 1.2, 1.6, GREY(), x, 0.6, -16.2, 1.5); M(g, new THREE.CylinderGeometry(0.5, 0.5, 0.2, 8), DARK(), x, 1.3, -16.2); }
  return size(g, 64, 30, 37, [[-32, 32, -15, -5, hS + 1], [-5, 5, -5, 15, hS + 1], [-30, -20, -5, 15, hL + 1], [20, 30, -5, 15, hR + 1]]);
}

// =================================================================== 6. PALACE OF PIONEERS
export function palaceOfPioneers(opts = {}) {
  const g = G(), roofT = mat('roofTar'), ws = mat('s4a_whitestone'), pw = mat('s4a_palwing'), conc = mat('stuccoWhite');
  const wh = (n) => mat(n);
  void wh;
  const flat = (cx, cz, w, d, y, ov = 1.0) => { B(g, w + ov * 2, 0.5, d + ov * 2, ws, cx, y + 0.25, cz, 3); };
  // terraced base in front
  for (let i = 0; i < 3; i++) B(g, 56 - i * 6, 0.18, 14 - i * 1.4 + 0, ws, 0, 0.09 + i * 0.18 - 0.09, 9.2 + 0 + (i * 0.0), 3).position.y = 0.09 + i * 0.18;
  for (let i = 0; i < 4; i++) B(g, 21 - i * 0.0, 0.14 * (4 - i), 1.0, ws, 0, 0.07 * (4 - i), 14.6 + i * 0.35, 2);
  // back auditorium x -14..14, z -16..-4, h 16
  g.add(place(mbox(28, 16, 12, [ws, ws, roofT, roofT, ws, ws], 4), 0, 8, -10)); flat(0, -10, 28, 12, 16, 0.8);
  wins(g, { cx: 0, cz: -16, r: PI, len: 28, ys: [4, 9, 13.6], step: 4.2, sx: 1.6, sy: 2.4, margin: 2, fixed: true, c: '#ffffff' });
  wins(g, { cx: -14, cz: -10, r: -PI / 2, len: 12, ys: [4, 9], step: 4.2, sx: 1.6, sy: 2.4, margin: 1.8, fixed: true, c: '#ffffff' });
  wins(g, { cx: 14, cz: -10, r: PI / 2, len: 12, ys: [4, 9], step: 4.2, sx: 1.6, sy: 2.4, margin: 1.8, fixed: true, c: '#ffffff' });
  // great hall x -16..16, z -4..8, h 11 with a huge glazed front
  g.add(place(mbox(32, 11, 12, [ws, ws, roofT, roofT, ws, ws], 4), 0, 5.5, 2)); flat(0, 2, 32, 12, 11, 1.2);
  const gl = new THREE.Mesh(new THREE.PlaneGeometry(26, 9.6), mat('glass')); gl.position.set(0, 5.3, 8.07); g.add(gl);
  for (let x = -13; x <= 13.01; x += 2.6) B(g, 0.16, 9.8, 0.25, color(0xe8e6dc), x, 5.3, 8.15, 1);
  for (const y of [1.0, 4.0, 7.2, 10.2]) B(g, 26.4, 0.18, 0.25, color(0xe8e6dc), 0, y, 8.15, 1);
  for (const x of [-14.6, 14.6]) wins(g, { cx: x, cz: 8, r: 0, len: 2.6, ys: [3.0, 7.2], step: 1, sx: 1.6, sy: 2.6, margin: 1, c: '#ffffff' });
  // portico: 8 slim columns + flat roof, star emblem on the frieze
  const px = (i) => -14 + i * 4;
  for (let i = 0; i < 8; i++) { M(g, new THREE.CylinderGeometry(0.3, 0.34, 10.2, 10), conc, px(i) * 1.0 + 0.0, 5.1, 12.2); }
  B(g, 36, 1.4, 6.4, ws, 0, 10.9, 11.4, 3); B(g, 37, 0.4, 7.2, ws, 0, 11.8, 11.4, 3);
  const sg = sign('ДВОРЕЦ ПИОНЕРОВ', 20, 1.0, { bg: '#b8281c' }); sg.position.set(0, 10.9, 14.62); g.add(sg);
  const em = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.2), mat('s4a_star')); em.position.set(0, 13.6, 8.3); g.add(em);
  B(g, 3.6, 3.6, 0.3, ws, 0, 13.6, 8.16, 2);
  for (const x of [-22, -14, 14, 22]) B(g, 0.4, 0.4, 0.4, conc, x, 0.2, 0, 1).visible = false;
  doorAt(g, { cx: 0, cz: 8, s: -1.5, w: 2.4, h: 3.4, y: 1.8, c: '#2a3a52', off: 0.12 }); doorAt(g, { cx: 0, cz: 8, s: 1.5, w: 2.4, h: 3.4, y: 1.8, c: '#2a3a52', off: 0.12 });
  // side wings x +-(16..34), z -12..4, two floors h 8
  for (const sd of [-1, 1]) {
    const cx = sd * 25;
    g.add(place(mbox(18, 4, 16, [pw, pw, roofT, roofT, mat('s4a_whitestone'), pw], 4), cx, 2, -4));
    g.add(place(mbox(18, 4, 16, [pw, pw, roofT, roofT, pw, pw], 4), cx, 6, -4)); flat(cx, -4, 18, 16, 8, 1.2);
    wins(g, { cx, cz: 4, r: 0, len: 18, ys: [2.0], step: 3.6, sx: 2.0, sy: 2.6, margin: 1.8, c: '#ffffff', litN: 3 });
    wins(g, { cx, cz: -12, r: PI, len: 18, ys: [2.0], step: 3.6, sx: 2.0, sy: 2.6, margin: 1.8, c: '#ffffff', fixed: true });
    doorAt(g, { cx, cz: -12, r: PI, s: 0, w: 1.8, h: 2.8, y: 1.5, c: '#5a5a62', off: 0.1 }); B(g, 3.4, 0.25, 1.3, ws, cx, 3.2, -12.7, 2);
    // end pavilion x +-(34..43), z -10..12 h 10
    const pcx = sd * 38.5;
    g.add(place(mbox(9, 10, 22, [ws, ws, roofT, roofT, ws, ws], 4), pcx, 5, 1)); flat(pcx, 1, 9, 22, 10, 0.9);
    const pg = new THREE.Mesh(new THREE.PlaneGeometry(7, 6.4), mat('glass')); pg.position.set(pcx, 4.4, 12.07); g.add(pg);
    for (let x = -3; x <= 3.01; x += 1.5) B(g, 0.14, 6.6, 0.24, color(0xe8e6dc), pcx + x, 4.4, 12.14, 1);
    for (const y of [1.2, 4.4, 7.6]) B(g, 7.4, 0.16, 0.24, color(0xe8e6dc), pcx, y, 12.14, 1);
    wins(g, { cx: pcx, cz: 1, r: sd * PI / 2, len: 22, ys: [3.2, 7.4], step: 4.2, sx: 1.7, sy: 2.4, margin: 2.2, fixed: true, c: '#ffffff' });
    wins(g, { cx: pcx, cz: -10, r: PI, len: 9, ys: [3.2, 7.4], step: 4.2, sx: 1.7, sy: 2.4, margin: 2.2, fixed: true, c: '#ffffff' });
    flag(g, sd * 30, 0.5, 14, 9, 0xc42a1a);
    for (let i = 0; i < 4; i++) M(g, new THREE.CylinderGeometry(0.2, 0.22, 3.6, 8), conc, pcx - 3 + i * 2, 1.8, 12.9);
    B(g, 9, 0.35, 2.2, ws, pcx, 3.8, 12.7, 2);
  }
  // wing banner
  const bn = sign('ВСЕГДА ГОТОВ!', 12, 1.2, { bg: '#a82a1c' }); bn.position.set(-25, 9.2, 4.1); g.add(bn);
  const bn2 = sign('ПИОНЕР — ВСЕМ РЕБЯТАМ ПРИМЕР', 14, 1.2, { bg: '#1c4a8a' }); bn2.position.set(25, 9.2, 4.1); g.add(bn2);
  B(g, 12.4, 1.6, 0.3, ws, -25, 9.2, 4.0, 2); B(g, 14.4, 1.6, 0.3, ws, 25, 9.2, 4.0, 2); bn.position.z = 4.2; bn2.position.z = 4.2;
  // pioneers' bonfire monument (torch) and trees
  B(g, 2.4, 1.0, 2.4, ws, 0, 0.5 + 0.54, 15.0, 2).visible = false;
  for (const x of [-21, 21]) { B(g, 1.6, 1.4, 1.6, ws, x, 0.7 + 0.36, 11.5, 2); M(g, new THREE.ConeGeometry(0.75, 2.4, 6), color(0xff9a20, { emissive: 0xd05000 }), x, 2.9, 11.5); M(g, new THREE.ConeGeometry(0.4, 1.6, 6), color(0xffe060, { emissive: 0xa08000 }), x, 3.1, 11.5); }
  for (const [x, z] of [[-30, 15.5], [-36, 15.5], [30, 15.5], [36, 15.5]]) conifer(g, x, z, 0.8);
  // roof gear
  antenna(g, 8, 16.5, -12, 6); antenna(g, -10, 16.5, -12, 5); B(g, 5, 2.6, 4, ws, -6, 17.8, -11, 2); B(g, 5.4, 0.3, 4.4, ws, -6, 19.25, -11, 2);
  star(g, 0, 18.6, -9, 0.7);
  for (const x of [-35, -25, -12, 12, 25, 35]) pipe(g, x, -12.12 + (Math.abs(x) < 20 ? -3.9 : 0), 6, 0, 0.1);
  return size(g, 86, 32, 20, [[-14, 14, -16, -4, 16.6], [-16, 16, -4, 8, 11.6], [-34, -16, -12, 4, 8.6], [16, 34, -12, 4, 8.6], [-43, -34, -10, 12, 10.6], [34, 43, -10, 12, 10.6]]);
}

// =================================================================== 7. PLANETARIUM
export function planetarium(opts = {}) {
  const g = G(), roofT = mat('roofTar'), stone = mat('s4a_plandrum'), conc = mat('stuccoWhite'), ws = mat('s4a_whitestone');
  const DR = 13, DH = 9;
  // plinth + drum
  M(g, new THREE.CylinderGeometry(DR + 1.2, DR + 1.4, 0.6, 20), mat('granite'), 0, 0.3, 0);
  const drum = cylT(DR, DR, DH, 24, stone, 4.5); drum.position.set(0, 0.6 + DH / 2, 0); g.add(drum);
  M(g, new THREE.CylinderGeometry(DR + 0.7, DR + 0.5, 0.7, 24), ws, 0, 0.6 + DH + 0.3, 0);
  // dome: silver hemisphere + ribs + lantern
  const dome = M(g, new THREE.SphereGeometry(DR - 0.6, 20, 10, 0, 2 * PI, 0, PI / 2), mat('domeSilver', { double: true }), 0, DH + 1.0, 0);
  dome.scale.y = 0.96;
  M(g, new THREE.TorusGeometry(DR - 0.6, 0.2, 5, 24), ws, 0, DH + 1.0, 0).rotation.x = PI / 2;
  M(g, new THREE.CylinderGeometry(1.6, 1.9, 1.4, 10), ws, 0, DH + 1 + (DR - 0.6) * 0.96 + 0.2, 0);
  M(g, new THREE.SphereGeometry(1.5, 10, 6, 0, 2 * PI, 0, PI / 2), mat('domeSilver', { double: true }), 0, DH + 1 + (DR - 0.6) * 0.96 + 0.9, 0);
  M(g, new THREE.CylinderGeometry(0.05, 0.08, 2.6, 5), DARK(), 0, DH + 1 + (DR - 0.6) * 0.96 + 2.6, 0);
  // portico: 6 columns, flat roof, frieze with name
  const cz = 15.0;
  for (let i = 0; i < 6; i++) { const x = -6.5 + i * 2.6; M(g, new THREE.CylinderGeometry(0.55, 0.62, 8.6, 12), conc, x, 0.6 + 4.3, cz); B(g, 1.5, 0.35, 1.5, conc, x, 9.3, cz, 2); B(g, 1.4, 0.3, 1.4, conc, x, 0.75, cz, 2); }
  B(g, 18, 1.6, 6.0, ws, 0, 10.4, 13.6, 3); B(g, 19, 0.4, 6.8, ws, 0, 11.4, 13.6, 3);
  const fs = sign('ПЛАНЕТАРИЙ', 12, 1.1, { bg: '#16273a' }); fs.position.set(0, 10.4, 16.62); g.add(fs);
  for (let i = 0; i < 4; i++) B(g, 20 - i * 0.6, 0.15, 1.0, ws, 0, 0.075 + i * 0.15 - 0.0, 16.6 + (3 - i) * 0.0 + 0.5 - 0.0 + (i * 0.0), 2).position.y = 0.075 + (3 - i) * 0.0;
  for (let i = 0; i < 4; i++) { const s = B(g, 17, 0.12 * (4 - i), 0.9, ws, 0, 0.06 * (4 - i), 16.5 + i * 0.4 + 0.45, 2); s.position.y = 0.06 * (4 - i) + 0.0; }
  // entrance wall behind the columns: dark glass doors
  const eg = new THREE.Mesh(new THREE.PlaneGeometry(7, 6), mat('glass')); eg.position.set(0, 3.6, DR - 0.07 * 0 + 0.0 - 0.0 + 0.0); eg.position.z = 12.9; g.add(eg);
  B(g, 13, 8.2, 0.5, ws, 0, 4.7, 12.6, 3);
  const eg2 = new THREE.Mesh(new THREE.PlaneGeometry(10, 4.2), mat('glass')); eg2.position.set(0, 3.3, 12.9); g.add(eg2);
  for (const x of [-1.2, 1.2]) doorAt(g, { cx: 0, cz: 12.9, s: x, w: 2.0, h: 3.4, y: 1.7, c: '#2a3a52', off: 0.06 });
  // observatory cupola tower (back-right)
  M(g, new THREE.CylinderGeometry(3.0, 3.3, 13, 12), ws, 11, 6.5, -11);
  M(g, new THREE.CylinderGeometry(3.4, 3.4, 0.5, 12), conc, 11, 13.2, -11);
  M(g, new THREE.SphereGeometry(3.0, 12, 7, 0, 2 * PI, 0, PI / 2), mat('domeSilver', { double: true }), 11, 13.4, -11);
  B(g, 0.9, 2.6, 1.6, DARK(), 11, 15.0, -9.0, 1).rotation.x = -0.25;
  M(g, new THREE.CylinderGeometry(0.2, 0.22, 3.4, 6), DARK(), 11.0, 15.3, -9.2).rotation.x = 1.15;
  for (let y = 3; y < 12; y += 4) { const w = decal('window', 0.9, 1.6, 11, y + 0.4, -11 + 3.35, { c: '#efece2', fixed: true }); g.add(w); w.rotation.y = 0; }
  // service annex (back) and details
  g.add(place(mbox(12, 5.6, 4, [ws, ws, roofT, roofT, ws, ws], 4), -4, 2.8, -14.8)); B(g, 12.8, 0.4, 4.8, conc, -4, 5.8, -14.8, 2);
  wins(g, { cx: -4, cz: -12.8, r: PI, len: 0, ys: [], step: 1 });
  wins(g, { cx: -4, cz: -16.8, r: PI, len: 12, ys: [2.8], step: 3.6, sx: 1.4, sy: 1.8, margin: 2, fixed: true, c: '#ffffff' });
  doorAt(g, { cx: 3, cz: -14.8, r: PI / 2, s: 0, w: 1.8, h: 2.7, y: 1.4, c: '#5a5a62' }); wins(g, { cx: 2, cz: -14.8, r: PI / 2, len: 0, ys: [], step: 1 });
  doorAt(g, { cx: -4, cz: -16.8, r: PI, s: 3.5, w: 1.8, h: 2.7, y: 1.4, c: '#5a5a62', off: 0.1 });
  // windows on the drum (lower row of the stone texture gives slits); add fixed doors/vents on the sides
  for (const sd of [-1, 1]) doorAt(g, { cx: sd * 12.95, cz: 0, r: sd * PI / 2, s: 0, w: 1.8, h: 2.8, y: 1.4, c: '#5a5a62', off: 0.05 });
  for (const a of [-2.1, -0.8, 0.8, 2.1]) { const x = Math.sin(a) * (DR + 0.03), z = Math.cos(a) * (DR + 0.03); const w = decal('window', 1.0, 3.0, x, 4.6, z, { c: '#efece2', fixed: a > 1 || a < -1 }); w.rotation.y = a; g.add(w); }
  for (const a of [0.0, 3.14]) { const w = decal('window', 1.0, 3.0, Math.sin(a + PI) * (DR + 0.03) * 0 + (a === 0 ? 0 : 0), 4.6, a === 0 ? 0 : -(DR + 0.03), { c: '#efece2', fixed: true }); if (a !== 0) { w.rotation.y = PI; g.add(w); } }
  for (const a of [0.4, 1.0, 1.7, 2.3, 2.9, 3.5, 4.1, 4.7, 5.3]) { const x = Math.sin(a) * (DR + 0.03), z = Math.cos(a) * (DR + 0.03); if (z > 9) continue; const w = decal('window', 1.0, 3.0, x, 4.6, z, { c: '#efece2', fixed: true }); w.rotation.y = a; g.add(w); }
  for (const a of [0.9, 2.2, 3.4, 4.5]) pipe(g, Math.sin(a) * (DR + 0.15), Math.cos(a) * (DR + 0.15), DH, 0.6, 0.09);
  // armillary sphere (left) and rocket (right) out front, on pedestals
  const gold = color(0xd9a62a, { emissive: 0x302000 });
  B(g, 2.6, 1.4, 2.6, ws, -12.2, 0.7, 14.5, 2); M(g, new THREE.CylinderGeometry(0.3, 0.4, 1.2, 8), ws, -12.2, 2.0, 14.5);
  for (let i = 0; i < 4; i++) { const t = M(g, new THREE.TorusGeometry(1.7, 0.07, 4, 20), gold, -12.2, 3.9, 14.5); t.rotation.set(i * 0.8 + 0.3, i * 0.6, i * 0.4); }
  M(g, new THREE.SphereGeometry(0.55, 8, 6), color(0x3a8ae0), -12.2, 3.9, 14.5); M(g, new THREE.CylinderGeometry(0.05, 0.05, 4.2, 5), DARK(), -12.2, 3.9, 14.5).rotation.z = 0.41;
  B(g, 2.8, 1.0, 2.8, ws, 12.2, 0.5, 14.5, 2);
  M(g, new THREE.CylinderGeometry(0.6, 0.75, 4.6, 10), color(0xf2efe6), 12.2, 3.5, 14.5); M(g, new THREE.ConeGeometry(0.6, 1.8, 10), color(0xd8302a), 12.2, 6.7, 14.5);
  for (let i = 0; i < 4; i++) { const f = B(g, 1.1, 1.4, 0.1, color(0xd8302a), 12.2 + Math.cos(i * PI / 2) * 0.9, 2.1, 14.5 + Math.sin(i * PI / 2) * 0.9, 1); f.rotation.y = -i * PI / 2; }
  M(g, new THREE.ConeGeometry(0.5, 1.6, 8), color(0xff9a20, { emissive: 0xd05000 }), 12.2, 1.1, 14.5).rotation.x = PI;
  for (const [x, z] of [[-14.5, 4], [14.5, 5], [-15, -7]]) tree(g, x, z, 1.0);
  bench(g, -5, 0, 19 - 2.2, 0); bench(g, 5, 0, 19 - 2.2, 0);
  star(g, 0, DH + 1 + (DR - 0.6) * 0.96 + 4.4, 0, 0.4);
  const cols = [[-13, 13, -4.9, 4.9, 22], [-4.9, 4.9, -13, 13, 22], [-9.2, 9.2, -9.2, 9.2, 22], [8, 14, -14, -8, 14], [-10, 2, -17, -12.8, 6]];
  return size(g, 34, 34, 26, cols);
}
