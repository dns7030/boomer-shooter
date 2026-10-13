// Level 4 (Soviet metropolis), set B: stadium, atomic power station, Tbilisi highways ministry,
// Kyiv "flying saucer", Matenadaran, Linnahall. Same conventions as the other building files:
// origin = footprint centre on the ground, front faces +Z, userData = { w, d, h[, cols] }.
import * as THREE from 'three';
import { mat, color, boxT, cylT, place, gableRoof, decal } from './geo.js';
import { sign, tiledPlane, pylon } from './buildings2.js';
import { addPainters, mulberry, tex } from './textures.js';

const G = () => new THREE.Group();
const size = (g, w, d, h, cols = null) => { g.userData = { ...g.userData, w, d, h }; if (cols) g.userData.cols = cols; return g; };

// ---------- textures ----------
const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
const speck = (g, w, h, rnd, n, cols) => { for (let i = 0; i < n; i++) R(g, (rnd() * w) | 0, (rnd() * h) | 0, 1 + ((rnd() * 2) | 0), 1, cols[(rnd() * cols.length) | 0]); };
function seatsPainter(vertical) {
  return (g, w, h) => {
    const rnd = mulberry(vertical ? 412 : 411), pal = ['#b8352a', '#b8352a', '#2f5fa8', '#d9b53a', '#e8e4d6', '#2f5fa8'];
    R(g, 0, 0, w, h, '#8e8b84');
    for (let a = 0; a < 64; a += 4) {
      for (let b = 0; b < 64; b++) {
        const blk = ((b >> 3) + (a >> 4)) % pal.length, aisle = (b % 32) < 2;
        const col = aisle ? '#a8a59c' : pal[blk];
        if (vertical) { R(g, a, b, 3, 1, col); R(g, a + 3, b, 1, 1, aisle ? '#8e8b84' : '#00000055'); } else { R(g, b, a, 1, 3, col); R(g, b, a + 3, 1, 1, aisle ? '#8e8b84' : '#00000055'); }
      }
    }
    speck(g, w, h, rnd, 40, ['#ffffff33', '#00000033']);
  };
}
addPainters({
  s4b_slots(g, w, h) { // brutalist concrete with deep horizontal window slots
    const r = mulberry(401);
    R(g, 0, 0, w, h, '#aeaca4'); speck(g, w, h, r, 300, ['#bdbbb3', '#9d9b94', '#a5a39b']);
    R(g, 0, 0, w, 1, '#8f8d86'); R(g, 0, 32, w, 1, '#9a988f'); R(g, 31, 0, 1, 18, '#98968e'); R(g, 0, 18, w, 2, '#c9c7be');
    R(g, 2, 20, 60, 14, '#10151a'); R(g, 2, 20, 60, 3, '#04060a'); R(g, 2, 24, 60, 8, '#26343f');
    for (let x = 12; x < 64; x += 16) R(g, x, 23, 2, 10, '#7c7f80');
    R(g, 0, 34, w, 2, '#d6d4ca'); R(g, 0, 36, w, 1, '#827f78'); R(g, 0, 50, w, 1, '#8c8a83');
  },
  s4b_vslit(g, w, h) { // pale precast panels with tall narrow slits
    const r = mulberry(402);
    R(g, 0, 0, w, h, '#bdbab0'); speck(g, w, h, r, 260, ['#cbc8be', '#a9a69d']);
    for (let x = 4; x < 64; x += 16) { R(g, x - 1, 6, 6, 50, '#d8d5cb'); R(g, x, 6, 4, 50, '#0e1318'); R(g, x, 6, 4, 4, '#030507'); R(g, x + 1, 12, 2, 38, '#2c3b47'); }
    R(g, 0, 60, w, 4, '#98958c'); R(g, 0, 0, w, 2, '#98958c');
  },
  s4b_basalt(g, w, h) {
    const r = mulberry(403);
    R(g, 0, 0, w, h, '#4f5154');
    for (let y = 0; y < 64; y += 8) {
      const off = (y / 8) % 2 ? 8 : 0;
      for (let x = -16; x < 64; x += 16) { const sh = ['#53565a', '#4a4c50', '#595c60', '#45474b'][(r() * 4) | 0]; R(g, x + off + 1, y + 1, 15, 7, sh); }
      R(g, 0, y, w, 1, '#2c2e30');
    }
    for (let x = 0; x < 64; x += 16) R(g, x, 0, 1, 64, '#2c2e30');
    speck(g, w, h, r, 160, ['#6a6d70', '#33353a']);
  },
  s4b_seats: seatsPainter(false),
  s4b_seatsV: seatsPainter(true),
  s4b_pitch(g, w, h) {
    const r = mulberry(404);
    for (let i = 0; i < 8; i++) R(g, i * 30, 0, 30, h, i % 2 ? '#3d7a2c' : '#468633');
    speck(g, w, h, r, 700, ['#35702a', '#4f9038']);
    g.strokeStyle = '#e9eee0'; g.lineWidth = 2;
    g.strokeRect(3, 3, w - 6, h - 6);
    g.beginPath(); g.moveTo(w / 2, 3); g.lineTo(w / 2, h - 3); g.stroke();
    g.beginPath(); g.arc(w / 2, h / 2, 26, 0, Math.PI * 2); g.stroke();
    R(g, w / 2 - 2, h / 2 - 2, 4, 4, '#e9eee0');
    g.strokeRect(3, h / 2 - 34, 40, 68); g.strokeRect(w - 43, h / 2 - 34, 40, 68);
    g.strokeRect(3, h / 2 - 16, 14, 32); g.strokeRect(w - 17, h / 2 - 16, 14, 32);
    R(g, 30, h / 2 - 1, 3, 3, '#e9eee0'); R(g, w - 33, h / 2 - 1, 3, 3, '#e9eee0');
  },
  s4b_track(g, w, h) {
    const r = mulberry(405);
    R(g, 0, 0, w, h, '#b4543a'); speck(g, w, h, r, 120, ['#a24a32', '#c26244']);
    for (let y = 0; y < h; y += 6) R(g, 0, y, w, 1, '#ece6da');
  },
  s4b_scoreboard(g, w, h) {
    R(g, 0, 0, w, h, '#0a0c10'); R(g, 3, 3, w - 6, h - 6, '#14181e');
    for (let x = 6; x < w - 4; x += 8) { R(g, x, 4, 3, 2, '#e04030'); R(g, x, h - 6, 3, 2, '#e04030'); }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#ffb020'; g.font = 'bold 16px Arial, sans-serif'; g.fillText('ДИНАМО   3 : 1   СПАРТАК', w / 2, h * 0.38);
    g.fillStyle = '#e8e4d0'; g.font = 'bold 11px Arial, sans-serif'; g.fillText('ЦЕНТРАЛЬНЫЙ СТАДИОН   ТАЙМ 2   78’', w / 2, h * 0.72);
  },
  s4b_lamps(g, w, h) {
    R(g, 0, 0, w, h, '#33373c');
    for (let y = 3; y < h - 2; y += 8) for (let x = 3; x < w - 2; x += 8) { R(g, x, y, 6, 6, '#fff6d0'); R(g, x + 1, y + 1, 4, 4, '#ffffff'); }
  },
  s4b_banner(g, w, h) {
    R(g, 0, 0, w, h, '#c0261d'); R(g, 1, 1, w - 2, 1, '#e0b040'); R(g, 1, h - 3, w - 2, 1, '#e0b040');
    g.fillStyle = '#f2c230'; g.beginPath();
    const cx = w / 2, cy = h * 0.34;
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? 4 : 10; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
    g.fill(); R(g, 6, h * 0.62, w - 12, 2, '#f2c230'); R(g, 6, h * 0.68, w - 12, 2, '#f2c230'); R(g, 6, h * 0.74, w - 12, 2, '#f2c230');
  },
  s4b_hall(g, w, h) { // turbine hall: pale ribbed sheet cladding with a glazed band at the top
    const r = mulberry(406);
    R(g, 0, 0, w, h, '#b9c1c2'); speck(g, w, h, r, 200, ['#c8cfd0', '#a6aeb0']);
    for (let x = 0; x < 64; x += 4) R(g, x, 0, 1, 64, '#a3abad');
    R(g, 0, 40, w, 20, '#e6e6de');
    for (let x = 0; x < 64; x += 16) { R(g, x + 1, 42, 14, 16, '#233443'); R(g, x + 1, 42, 14, 3, '#10202c'); R(g, x + 1, 48, 14, 1, '#cfd3d0'); R(g, x + 1, 53, 14, 1, '#cfd3d0'); }
    R(g, 0, 39, w, 1, '#7d8486'); R(g, 0, 60, w, 2, '#7d8486');
  },
  s4b_reactor(g, w, h) {
    const r = mulberry(407);
    R(g, 0, 0, w, h, '#b7b4aa'); speck(g, w, h, r, 260, ['#c4c1b7', '#a09d94', '#aaa79d']);
    for (let x = 0; x < 64; x += 16) R(g, x, 0, 1, 64, '#8c8981');
    R(g, 0, 31, w, 1, '#8c8981');
    for (let x = 6; x < 64; x += 16) { R(g, x, 8, 4, 14, '#161c22'); R(g, x, 38, 4, 14, '#161c22'); }
  },
  s4b_rad(g, w, h) { // radiation trefoil sign on a yellow plate
    R(g, 0, 0, w, h, '#e6b81a'); R(g, 1, 1, w - 2, h - 2, '#f1cb2c');
    g.fillStyle = '#16161a'; const cx = w / 2, cy = h / 2;
    for (let k = 0; k < 3; k++) { const a0 = (k * 2 * Math.PI) / 3 - Math.PI / 2 - Math.PI / 6; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, w * 0.42, a0, a0 + Math.PI / 3); g.closePath(); g.fill(); }
    g.beginPath(); g.arc(cx, cy, w * 0.09, 0, Math.PI * 2); g.fill();
  },
  s4b_hazard(g, w, h) {
    R(g, 0, 0, w, h, '#e8b81c');
    g.fillStyle = '#17171a';
    for (let i = -h; i < w + h; i += 16) { g.beginPath(); g.moveTo(i, h); g.lineTo(i + 8, h); g.lineTo(i + 8 + h, 0); g.lineTo(i + h, 0); g.fill(); }
  },
  s4b_stripe(g, w, h) { // red / white chimney bands
    R(g, 0, 0, w, h, '#ece8de');
    R(g, 0, 8, w, 16, '#c0261d'); R(g, 0, 40, w, 16, '#c0261d');
    R(g, 0, 8, 2, 16, '#a01c14'); R(g, 0, 40, 2, 16, '#a01c14');
  },
  s4b_ribbed(g, w, h) { // saucer mid-band: glazed ribs
    const r = mulberry(408);
    R(g, 0, 0, w, h, '#d6d7d2'); speck(g, w, h, r, 80, ['#e2e3de', '#c4c5c0']);
    R(g, 0, 8, w, 48, '#233a50'); R(g, 0, 8, w, 3, '#12202e'); R(g, 0, 31, w, 2, '#cfd3d4');
    R(g, 0, 20, w, 1, '#3d5a74'); R(g, 0, 44, w, 1, '#3d5a74');
    for (let x = 0; x < 64; x += 8) { R(g, x, 6, 2, 52, '#d6d7d2'); R(g, x + 2, 6, 1, 52, '#9c9d99'); }
  },
  s4b_limestone(g, w, h) {
    const r = mulberry(409);
    R(g, 0, 0, w, h, '#b9b09c');
    for (let y = 0; y < 64; y += 16) {
      const off = (y / 16) % 2 ? 16 : 0;
      for (let x = -32; x < 64; x += 32) { const sh = ['#bdb4a0', '#b2a995', '#c3baa6', '#aaa18d'][(r() * 4) | 0]; R(g, x + off + 1, y + 1, 31, 15, sh); }
      R(g, 0, y, w, 1, '#7d7766');
    }
    for (let x = 0; x < 64; x += 32) R(g, x, 0, 1, 64, '#7d7766');
    speck(g, w, h, r, 150, ['#c9c0ac', '#8f8977']);
  },
  s4b_lino(g, w, h) { // rough board-formed concrete with long dark slits (Linnahall hall)
    const r = mulberry(410);
    R(g, 0, 0, w, h, '#9b9a94'); speck(g, w, h, r, 350, ['#a8a7a1', '#8a8984', '#b2b1ab']);
    for (let y = 0; y < 64; y += 6) R(g, 0, y, w, 1, '#8d8c87');
    R(g, 4, 24, 56, 6, '#121820'); R(g, 4, 24, 56, 1, '#050709'); R(g, 4, 30, 56, 2, '#c4c3bc');
    R(g, 0, 62, w, 2, '#7c7b76');
  },
  s4b_paving(g, w, h) {
    const r = mulberry(413);
    R(g, 0, 0, w, h, '#8e8c86'); speck(g, w, h, r, 200, ['#9a9892', '#7e7c77']);
    for (let i = 0; i < 64; i += 16) { R(g, i, 0, 1, 64, '#6c6a65'); R(g, 0, i, 64, 1, '#6c6a65'); }
  },
}, { s4b_pitch: [240, 128], s4b_track: [16, 24], s4b_scoreboard: [256, 64], s4b_banner: [32, 64], s4b_rad: [32, 32], s4b_hazard: [32, 32], s4b_lamps: [32, 32] });

// ---------- shared helpers ----------
// box from coordinate ranges. materials: side, top, tile, tileV (vertical tile on the side faces), bottom
function bb(g, x0, x1, y0, y1, z0, z1, side, top = side, tile = 4, tileV = tile, bot = top) {
  const w = x1 - x0, h = y1 - y0, d = z1 - z0;
  const geo = new THREE.BoxGeometry(w, h, d), uv = geo.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) {
    const [a, b] = dims[f], tv = f >= 2 && f <= 3 ? tile : tileV;
    for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, (uv.getX(k) * a) / tile, (uv.getY(k) * b) / tv); }
  }
  const m = new THREE.Mesh(geo, [side, side, top, bot, side, side]);
  m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); g.add(m); return m;
}
function limb(a, b, r, m, seg = 6) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), seg), m);
  mesh.position.copy(A).addScaledVector(d, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return mesh;
}
const rng = (a, b, s) => { const r = []; for (let v = a; v <= b + 1e-6; v += s) r.push(+v.toFixed(3)); return r; };
// decal on a face of a building. face: '+z' '-z' '+x' '-x'; at: coordinate of the wall plane; us: positions along the wall
function placeOnFace(m, face, at, u, y) {
  const o = 0.07;
  if (face === '+z') m.position.set(u, y, at + o);
  else if (face === '-z') { m.position.set(u, y, at - o); m.rotation.y = Math.PI; } else if (face === '+x') { m.position.set(at + o, y, u); m.rotation.y = Math.PI / 2; } else { m.position.set(at - o, y, u); m.rotation.y = -Math.PI / 2; }
  return m;
}
function wins(g, face, at, us, ys, o = {}) {
  const { sx = 1.4, sy = 2.1, c = '#fbfaf4', fixed = face !== '+z', lit = () => false } = o;
  for (const u of us) for (const y of ys) g.add(placeOnFace(decal('window', sx, sy, 0, 0, 0, { c, lit: lit(u, y), fixed }), face, at, u, y));
}
function doors(g, face, at, us, w, h, c = '#4a3a2a') { for (const u of us) g.add(placeOnFace(decal('door', w, h, 0, 0, 0, { c }), face, at, u, h / 2)); }
function signOn(g, text, w, h, face, at, u, y, opts) { const s = sign(text, w, h, opts); placeOnFace(s, face, at, u, y); s.position[face[1] === 'z' ? 'z' : 'x'] += (face[0] === '+' ? 1 : -1) * 0.04; g.add(s); return s; }
// 3 rects forming a rough octagon (inscribed radius r)
function octCols(cx, cz, r, h) { const k = r * 0.42, q = r * 0.8; return [[cx - r, cx + r, cz - k, cz + k, h], [cx - k, cx + k, cz - r, cz + r, h], [cx - q, cx + q, cz - q, cz + q, h]]; }
function flatDisc(g, r, y, m, seg = 24) { const d = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.06, seg), m); d.position.y = y; g.add(d); return d; }
function lampBank(g, x, y, z, faceAng, w = 7, h = 4) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.6), [color(0x2a2d31), color(0x2a2d31), color(0x2a2d31), color(0x2a2d31), mat('s4b_lamps'), color(0x2a2d31)]);
  m.position.set(x, y, z); m.rotation.y = faceAng; g.add(m); return m;
}
function figure(g, x, y, z, s, m, { seated = false, ry = 0 } = {}) {
  const f = G();
  if (seated) {
    f.add(place(new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.7, 1.2), m), 0, 0.35, 0));
    f.add(place(new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 0.5), m), 0, 1.25, -0.2));
    f.add(place(new THREE.Mesh(new THREE.SphereGeometry(0.33, 8, 6), m), 0, 2.0, -0.2));
    f.add(place(new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.3, 0.7), m), 0, 0.55, 0.55));
    f.add(place(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.5), color(0xd8cfa8)), 0.1, 1.1, 0.45)); // scroll
  } else {
    f.add(place(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.5, 1.7, 8), m), 0, 0.85, 0));
    f.add(place(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.4), m), 0, 2.05, 0));
    f.add(place(new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), m), 0, 2.7, 0));
    f.add(place(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.4), color(0xd8cfa8)), 0.2, 1.8, 0.35));
  }
  f.scale.setScalar(s); f.position.set(x, y, z); f.rotation.y = ry; g.add(f); return f;
}

// =====================================================================================================
// 1. Central stadium (Luzhniki feeling): a stepped bowl, canopy ring, floodlight masts, torch, scoreboard.
// Walkable pitch: 72 x 44 open interior, gates 10 m wide in the middle of all four sides.
// =====================================================================================================
export function stadium() {
  const g = G(), cols = [];
  const HX = 56, HZ = 42, IX = 36, IZ = 22, GT = 5, WALL = 20;
  const conc = mat('concrete'), concD = mat('concreteDark'), seatH = mat('s4b_seats'), seatV = mat('s4b_seatsV'), tar = mat('roofTar');
  const segs = (hx, hz, X, Z) => [[-X, -GT, -Z, -hz], [GT, X, -Z, -hz], [-X, -GT, hz, Z], [GT, X, hz, Z], [-X, -hx, -hz, -GT], [-X, -hx, GT, hz], [hx, X, -hz, -GT], [hx, X, GT, hz]];
  // stepped stands (visible tiers = colliders)
  const tiers = [[0, 2.6], [3.2, 4.8], [6.4, 7.0], [9.6, 9.2], [12.8, 11.4], [16, 14]];
  for (const [o, hgt] of tiers) {
    segs(IX + o, IZ + o, HX - 1.5, HZ - 1.5).forEach((r, i) => {
      cols.push([r[0], r[1], r[2], r[3], hgt]);
      bb(g, r[0], r[1], 0, hgt, r[2], r[3], conc, i < 4 ? seatH : seatV, 4, 4, conc);
    });
  }
  // outer wall (collider h 20) + gate lintels
  segs(HX - 1.5, HZ - 1.5, HX, HZ).forEach((r) => { cols.push([r[0], r[1], r[2], r[3], WALL]); bb(g, r[0], r[1], 0, WALL, r[2], r[3], mat('stuccoWhite'), conc, 6, 6, conc); });
  for (const s of [1, -1]) {
    bb(g, -GT - 0.4, GT + 0.4, 14.5, WALL, s * HZ - 0.75, s * HZ + 0.75, conc, conc, 3);
    bb(g, s * HX - 0.75, s * HX + 0.75, 14.5, WALL, -GT - 0.4, GT + 0.4, conc, conc, 3);
    for (const e of [-1, 1]) { // gate pylons
      bb(g, e * (GT + 0.9) - 0.5, e * (GT + 0.9) + 0.5, 0, 17, s * HZ + 0.2, s * HZ + 1.4, conc, conc, 3);
      bb(g, s * HX + 0.2, s * HX + 1.4, 0, 17, e * (GT + 0.9) - 0.5, e * (GT + 0.9) + 0.5, conc, conc, 3);
    }
  }
  // canopy ring on top of the stands
  const pl = (x0, x1, z0, z1) => bb(g, x0, x1, 20.6, 21.4, z0, z1, conc, mat('metalRoof'), 4, 4, concD);
  pl(-HX, HX, -HZ, -(IZ + 9)); pl(-HX, HX, IZ + 9, HZ); pl(-HX, -(IX + 9), -(IZ + 9), IZ + 9); pl(IX + 9, HX, -(IZ + 9), IZ + 9);
  // struts under the canopy
  const strut = (x, z) => bb(g, x - 0.3, x + 0.3, 9, 20.6, z - 0.3, z + 0.3, concD, concD, 2);
  for (const u of [-49, -35, -21, -7, 7, 21, 35, 49]) { strut(u, -(IZ + 9.8)); strut(u, IZ + 9.8); }
  for (const u of [-28, -14, 14, 28]) { strut(-(IX + 9.8), u); strut(IX + 9.8, u); }
  // pitch, running track, gate paving
  const pitch = new THREE.Mesh(new THREE.PlaneGeometry(60, 32), mat('s4b_pitch')); pitch.rotation.x = -Math.PI / 2; pitch.position.y = 0.03; g.add(pitch);
  for (const s of [1, -1]) {
    const ns = tiledPlane(72, 6, 18, 1, mat('s4b_track'), 0, 0, 0); ns.rotation.x = -Math.PI / 2; ns.position.set(0, 0.03, s * 19); g.add(ns);
    const ew = G(); const e = tiledPlane(32, 6, 8, 1, mat('s4b_track'), 0, 0, 0); e.rotation.x = -Math.PI / 2; ew.add(e); ew.rotation.y = Math.PI / 2; ew.position.set(s * 33, 0.03, 0); g.add(ew);
    for (const [x, z, rot] of [[0, s * 32, 0], [s * 46, 0, Math.PI / 2]]) { const p = G(); const pp = tiledPlane(10, 20, 2.5, 5, mat('s4b_paving'), 0, 0, 0); pp.rotation.x = -Math.PI / 2; p.add(pp); p.rotation.y = rot; p.position.set(x, 0.03, z); g.add(p); }
  }
  // goals
  for (const s of [1, -1]) {
    const wm = color(0xf2f2ee), x = s * 30;
    for (const z of [-3.66, 3.66]) g.add(place(new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.44, 0.14), wm), x, 1.22, z));
    g.add(place(new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 7.5), wm), x, 2.44, 0));
    const net = new THREE.Mesh(new THREE.PlaneGeometry(7.3, 2.4), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22, side: THREE.DoubleSide }));
    net.rotation.y = Math.PI / 2; net.position.set(x + s * 2, 1.2, 0); g.add(net);
    for (const z of [-3.66, 3.66]) g.add(place(new THREE.Mesh(new THREE.BoxGeometry(2, 0.06, 0.06), wm), x + s, 0.05, z));
  }
  // advertising boards along the inner riser
  const boards = ['СЛАВА ТРУДУ!', 'МИР! ТРУД! МАЙ!', 'СЛАВА КПСС', 'ДИНАМО', 'СПАРТАК', 'ШАЙБУ!', 'ВПЕРЁД, СОВЕТСКИЙ СПОРТ!', 'ЛУЖНИКИ'];
  let bi = 0;
  for (const u of [-27, -14, 14, 27]) {
    const a = sign(boards[bi++ % 8], 10, 1.2, { bg: '#b8352a' }); a.position.set(u, 1.5, -IZ + 0.06); g.add(a);
    const b = sign(boards[bi++ % 8], 10, 1.2, { bg: '#1c3a5a' }); b.position.set(u, 1.5, IZ - 0.06); b.rotation.y = Math.PI; g.add(b);
  }
  for (const u of [-13, 13]) {
    const a = sign(boards[bi++ % 8], 10, 1.2, { bg: '#1c3a5a' }); a.position.set(-IX + 0.06, 1.5, u); a.rotation.y = Math.PI / 2; g.add(a);
    const b = sign(boards[bi++ % 8], 10, 1.2, { bg: '#b8352a' }); b.position.set(IX - 0.06, 1.5, u); b.rotation.y = -Math.PI / 2; g.add(b);
  }
  // outer facade: pilasters, windows, banners, signs on all four sides
  const faces = [['+z', HZ, HX], ['-z', -HZ, HX], ['+x', HX, HZ], ['-x', -HX, HZ]];
  const banner = mat('s4b_banner', { double: true });
  for (const [f, at, L] of faces) {
    const zf = f[1] === 'z', sgn = f[0] === '+' ? 1 : -1;
    const us = []; for (let u = 7; u < L - 2; u += 7) us.push(u, -u);
    for (const u of us) {
      if (zf) bb(g, u - 0.6, u + 0.6, 0, 17.5, at - 0.1 * sgn + (sgn > 0 ? 0 : -0.7), at + (sgn > 0 ? 0.7 : 0.1) , conc, conc, 3);
      else bb(g, at + (sgn > 0 ? -0.1 : -0.7), at + (sgn > 0 ? 0.7 : 0.1), 0, 17.5, u - 0.6, u + 0.6, conc, conc, 3);
    }
    const wu = []; for (let u = 10.5; u < L - 3; u += 7) wu.push(u, -u);
    wins(g, f, at, wu, [4.5, 10, 15], { sx: 1.5, sy: 2.3, lit: (u, y) => ((u * 3 + y) | 0) % 7 === 0 });
    const bu = zf ? [24.5, 38.5] : [24.5];
    for (const u of bu) for (const s of [-1, 1]) {
      if (globalThis.__noCyrillic) continue;   // Neo game: no red star banners
      const bn = new THREE.Mesh(new THREE.PlaneGeometry(3, 9), banner);
      if (zf) bn.position.set(s * u, 11, at + sgn * 1.0); else { bn.position.set(at + sgn * 1.0, 11, s * u); bn.rotation.y = Math.PI / 2; }
      if (f === '-z') bn.rotation.y = Math.PI; g.add(bn);
    }
    const sl = (txt, uu) => signOn(g, txt, 40, 1.8, f, at, uu, 18.9, { bg: '#b8352a' });
    if (zf) { sl('СЛАВА СОВЕТСКОМУ СПОРТУ!', 29); sl('МИР · ТРУД · МАЙ', -29); } else { sl('ФИЗКУЛЬТ-УРА!', 0); }
    signOn(g, zf ? 'ЦЕНТРАЛЬНЫЙ СТАДИОН' : 'СТАДИОН · ВХОД', 11, 1.5, f, at, 0, 16.9, { bg: '#1c3a5a' });
  }
  // corner stair-towers
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(place(cylT(3.4, 3.8, 23, 10, conc, 4), sx * (HX - 3.2), 11.5, sz * (HZ - 3.2)));
    g.add(place(cylT(4.2, 4.2, 0.8, 10, concD, 4), sx * (HX - 3.2), 23.4, sz * (HZ - 3.2)));
  }
  // flags along the front roof edge
  for (let x = -49; x <= 49; x += 14) {
    g.add(place(new THREE.Mesh(new THREE.BoxGeometry(0.12, 6, 0.12), color(0xcfcfcf)), x, 24.4, HZ - 1));
    g.add(place(new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 0.06), color(0xc0261d)), x + 1.3, 26.9, HZ - 1));
  }
  // floodlight masts on the four corners (start on the canopy)
  const steel = color(0x7b8086);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const cx = sx * 51.5, cz = sz * 37.5, top = 49;
    for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) g.add(limb([cx + a * 1.4, 21.4, cz + b * 1.4], [cx + a * 0.5, top, cz + b * 0.5], 0.14, steel));
    for (let y = 24; y < top - 2; y += 6) {
      const k = 1.4 - (y - 21.4) / (top - 21.4) * 0.9;
      g.add(limb([cx - k, y, cz - k], [cx + k, y + 6, cz - k], 0.07, steel)); g.add(limb([cx + k, y, cz + k], [cx - k, y + 6, cz + k], 0.07, steel));
    }
    const ang = Math.atan2(-cx, -cz);
    lampBank(g, cx - Math.sin(ang) * -0.9 * 0, top + 2.2, cz, ang, 7.5, 3.6);
    lampBank(g, cx, top + 5.8, cz, ang, 7.5, 3.6);
  }
  // scoreboard on the north canopy, facing the pitch
  const sbm = [color(0x2a2d31), color(0x2a2d31), color(0x2a2d31), color(0x2a2d31), mat('s4b_scoreboard'), color(0x3a3d42)];
  const sb = new THREE.Mesh(new THREE.BoxGeometry(22, 5.5, 1.2), sbm); sb.position.set(0, 24.6, -(IZ + 9) + 0.8); g.add(sb);
  for (const x of [-9, 9]) g.add(place(new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.0, 0.8), steel), x, 22.9, -(IZ + 9) + 0.8));
  // torch / cauldron sculpture on the south canopy
  const tz = HZ - 6;
  bb(g, -2.2, 2.2, 21.4, 23, tz - 2.2, tz + 2.2, conc, conc, 3);
  bb(g, -1.2, 1.2, 23, 33, tz - 1.2, tz + 1.2, conc, conc, 3);
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 1.4, 2.2, 10), color(0xb08a2a, { emissive: 0x2a1c00 })); bowl.position.set(0, 34.1, tz); g.add(bowl);
  const fl = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex('flame'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  fl.scale.set(6, 8.5, 1); fl.position.set(0, 38.2, tz); g.add(fl); g.userData.flame = fl;
  return size(g, 112, 84, 22, cols);
}

// =====================================================================================================
// 2. Nuclear power station
// =====================================================================================================
function coolTower(H, rBase, rWaist, yWaist) {
  const g = G(), k = (rBase * rBase - rWaist * rWaist) / (yWaist * yWaist), pts = [];
  for (let i = 0; i <= 14; i++) { const y = (i / 14) * H; pts.push(new THREE.Vector2(Math.sqrt(rWaist * rWaist + k * (y - yWaist) * (y - yWaist)), y)); }
  const geo = new THREE.LatheGeometry(pts, 20), uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 10, uv.getY(i) * (H / 6));
  g.add(new THREE.Mesh(geo, mat('concrete', { double: true })));
  // inner dark rim and a ring of stripes
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(pts[14].x, pts[14].x, 0.8, 20, 1, true), color(0xc0261d)); rim.position.y = H - 0.4; g.add(rim);
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; g.add(place(new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.5, 0.6), color(0x15191d)), Math.sin(a) * (rBase - 0.3), 1.4, Math.cos(a) * (rBase - 0.3))).rotation.y = a; }
  const steam = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex('steam'), transparent: true, opacity: 0.9, depthWrite: false }));
  steam.scale.set(64, 54, 1); steam.position.set(0, H + 15, 0); g.add(steam); g.userData.steam = steam;
  return g;
}
export function atomicPlant() {
  const g = G(), cols = [];
  const hall = mat('s4b_hall'), react = mat('s4b_reactor'), conc = mat('concrete'), concD = mat('concreteDark'), tar = mat('roofTar'), haz = mat('s4b_hazard');
  const steel = color(0x7b8086), dark = color(0x2a2d31);
  // turbine hall 110 x 30 x 28 : x[-75,35] z[-5,25]
  bb(g, -75, 35, 0, 28, -5, 25, hall, tar, 9.2, 28 / 3, concD);
  bb(g, -70, 30, 28, 31.6, 1, 19, hall, tar, 9, 3.6);              // roof monitor
  bb(g, -75.4, 35.4, 28, 28.7, -5.4, 25.4, conc, conc, 4);          // cornice
  for (let i = 0; i < 10; i++) {
    const x = -69.5 + 11 * i;
    bb(g, x - 0.4, x + 0.4, 0, 28, 25, 25.7, conc, conc, 3); bb(g, x - 0.4, x + 0.4, 0, 28, -5.7, -5, conc, conc, 3);
  }
  for (const x of [-42, -20, 2]) { // roll-up gates at the front
    const d = tiledPlane(8, 7.4, 4, 1, mat('ironDoor'), x, 3.7, 25.06); g.add(d);
    g.add(place(new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.5, 0.3), color(0x2a2d31)), x, 7.6, 25.1));
    g.add(tiledPlane(8.6, 1.0, 4, 1, haz, x, 0.5, 25.12));
  }
  g.add(tiledPlane(110, 1.0, 46, 1, haz, -20, 0.5, 25.1).translateZ(-0.2));
  doors(g, '+z', 25, [-31, -9, 14], 1.8, 3.0, '#6a2a1a');
  signOn(g, 'АТОМНАЯ ЭЛЕКТРОСТАНЦИЯ ИМ. ЛЕНИНА', 54, 3.2, '+z', 25, -20, 24.2 - 2 + 4, { bg: '#1c3a5a' });
  signOn(g, 'МИРНЫЙ АТОМ — В КАЖДЫЙ ДОМ', 26, 2.0, '+z', 25.7, 3, 20.2 - 6, { bg: '#b8352a' });
  // back of the hall: fixed windows, doors, pipework
  wins(g, '-z', -5, rng(-71, 31, 5.5), [8.5], { sx: 1.6, sy: 2.4 });
  doors(g, '-z', -5, [-52, -28, -4, 20], 2.6, 3.4, '#555e58');
  for (const [y, r] of [[14, 0.55], [20, 0.8]]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 106, 8), color(0xa8afb0)); p.rotation.z = Math.PI / 2; p.position.set(-20, y, -6.5); g.add(p);
    for (let x = -70; x <= 30; x += 20) bb(g, x - 0.2, x + 0.2, 0, y, -6.9, -6.1, steel, steel, 2);
  }
  for (const x of [-60, -33, -7, 15]) g.add(place(cylT(1.1, 1.1, 14, 8, color(0xb9b49c), 2), x, 7, -7.5));
  // roof gear: exhaust fans, vents
  for (let x = -66; x <= 26; x += 12) { g.add(place(cylT(1.4, 1.6, 1.8, 8, concD, 2), x, 32.5, 22)); g.add(place(cylT(1.9, 1.9, 0.3, 8, dark, 2), x, 33.55, 22)); g.add(place(cylT(1.4, 1.6, 1.8, 8, concD, 2), x, 32.5, -2)); }
  // admin annex at the front left
  bb(g, -76, -60, 0, 12, 25, 34, mat('stuccoGrey'), tar, 8);
  wins(g, '+z', 34, rng(-73, -63, 3.3), [4.2, 9], { sx: 1.4, sy: 2.1, lit: (u, y) => (u + y) % 2 === 0 });
  doors(g, '+z', 34, [-68], 2.2, 3.0, '#4a2a18');
  wins(g, '-x', -76, [30], [4.2, 9], {}); wins(g, '+x', -60, [30], [4.2, 9], {});
  signOn(g, 'ДИРЕКЦИЯ', 8, 1.0, '+z', 34, -68, 11.0 - 3.6, { bg: '#7a1c14' });
  // reactor block x[38,72] z[-18,25], 42 high, plus the upper hall
  bb(g, 38, 72, 0, 42, -18, 25, react, tar, 8.5, 42 / 5, concD);
  bb(g, 43, 67, 42, 52, -14, 12, react, tar, 8, 10 / 1.5, concD);
  bb(g, 37.6, 72.4, 42, 42.8, -18.4, 25.4, conc, conc, 4);
  bb(g, 35, 38, 14, 21, 6, 12, conc, tar, 3);                        // transit gallery to the hall
  wins(g, '+z', 25, rng(42, 68, 4.4), [5.5, 12, 19], { sx: 1.5, sy: 2.4, lit: (u, y) => y === 12 && u > 50 && u < 62 });
  doors(g, '+z', 25, [55], 3.4, 4.2, '#555e58');
  g.add(tiledPlane(34, 1.0, 14, 1, haz, 55, 0.5, 25.12));
  const rad = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), mat('s4b_rad')); rad.position.set(55, 33, 25.08); g.add(rad);
  signOn(g, '1-Й ЭНЕРГОБЛОК', 18, 1.6, '+z', 25, 55, 28.4 - 0.5, { bg: '#1c3a5a' });
  wins(g, '+x', 72, rng(-12, 20, 5.3), [6, 14, 22, 30], { sx: 1.5, sy: 2.4 });
  wins(g, '-z', -18, rng(42, 68, 5.5), [6, 14, 22, 30, 38], { sx: 1.6, sy: 2.4 });
  wins(g, '-x', 38, [-12, -5, 0], [24, 32, 38], {});
  for (const x of [40.3, 69.7]) for (const z of [-15, 22]) g.add(place(cylT(0.4, 0.4, 42, 6, steel, 2), x, 21, z + (z < 0 ? -0.6 : 0.6)));   // down-pipes
  g.add(place(cylT(1.0, 1.0, 40, 8, color(0xa8afb0), 2), 73.2, 20, 14));
  // vent duct from the reactor roof to the stack, on legs
  bb(g, 53.5, 56.5, 36, 39.5, -26, -17.8, conc, concD, 3);
  for (const z of [-24, -20]) bb(g, 54.2, 55.8, 0, 36, z - 0.4, z + 0.4, concD, concD, 2);
  bb(g, 53.5, 56.5, 39.5, 41, -26, -18, haz, haz, 2);
  // ventilation stack, red / white, ~90 m
  const sx = 55, sz = -30;
  g.add(place(cylT(7, 7.4, 2.4, 12, concD, 4), sx, 1.2, sz));
  g.add(place(cylT(3.0, 5.4, 90, 12, mat('s4b_stripe'), 30), sx, 45, sz));
  g.add(place(cylT(3.6, 3.6, 0.7, 12, steel, 3), sx, 90.3, sz));
  for (const y of [30, 62]) g.add(place(cylT(4.6 - y * 0.024, 4.6 - y * 0.024, 0.4, 12, steel, 3), sx, y, sz));
  for (const [y, c] of [[91.5, 0xff3020], [60, 0xff3020], [30, 0xff3020]]) g.add(place(new THREE.Mesh(new THREE.SphereGeometry(0.5, 6, 5), color(c, { emissive: 0xa01408 })), sx + (y > 90 ? 0 : 3.6 - y * 0.02), y, sz));
  g.add(place(cylT(0.07, 0.07, 6, 6, steel, 2), sx, 94, sz));
  g.add(limb([sx + 3.2, 2, sz], [sx + 2.0, 88, sz], 0.1, steel));                  // ladder rail
  // cooling towers with steam
  const ct1 = coolTower(66, 14, 9, 46); ct1.position.set(-52, 0, -21); g.add(ct1);
  const ct2 = coolTower(66, 14, 9, 46); ct2.position.set(-14, 0, -21); g.add(ct2);
  g.userData.steam = [ct1.userData.steam, ct2.userData.steam];
  // switchyard: pylons with wires, transformers
  const pm = [];
  for (let x = -48; x <= 24; x += 12) { const p = pylon(24); p.scale.setScalar(0.62); p.rotation.y = Math.PI / 2; p.position.set(x, 0, 31); g.add(p); pm.push(x); }
  const s = 0.62;
  for (let i = 0; i < pm.length - 1; i++) {
    for (const [y, dz] of [[(24 - 9) * s, 8 * s], [(24 - 9) * s, -8 * s], [(24 - 3) * s, 6 * s], [(24 - 3) * s, -6 * s]]) {
      const w = new THREE.Mesh(new THREE.BoxGeometry(12, 0.07, 0.07), dark); w.position.set((pm[i] + pm[i + 1]) / 2, y - 1.5, 31 + dz); g.add(w);
    }
  }
  for (const x of [43, 55, 67]) {
    bb(g, x - 3, x + 3, 0.6, 5, 28.5, 33.5, conc, concD, 3);
    for (let k = -2; k <= 2; k++) bb(g, x + k * 1.0 - 0.15, x + k * 1.0 + 0.15, 1, 4.5, 33.5, 34.4, steel, steel, 2);
    for (const dx of [-1.8, 0, 1.8]) g.add(place(cylT(0.35, 0.35, 2.2, 6, color(0xcdbfa4), 2), x + dx, 6.1, 31));
    bb(g, x - 3.4, x + 3.4, 0, 0.6, 28.1, 34.9, concD, concD, 3);
  }
  // fence posts along the front edge
  for (let x = -74; x <= 74; x += 4) g.add(place(new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.2, 0.15), steel), x, 1.1, 34.5));
  g.add(place(new THREE.Mesh(new THREE.BoxGeometry(148, 0.1, 0.1), steel), 0, 2.0, 34.5));
  // colliders: hall, reactor, towers, stack
  cols.push([-75, 35, -5, 25, 28], [38, 72, -18, 25, 42], [-76, -60, 25, 34, 12], [35, 38, 6, 12, 21]);
  for (const x of [-52, -14]) { cols.push(...octCols(x, -21, 12.2, 18), ...octCols(x, -21, 9, 66)); }
  cols.push(...octCols(55, -30, 4, 90));
  return size(g, 152, 70, 40, cols);
}

// =====================================================================================================
// 3. Ministry of Highways (Tbilisi): interlocking concrete slabs forming a bridge over a 12 m passage
// =====================================================================================================
export function highwaysMinistry() {
  const g = G(), slots = mat('s4b_slots'), vs = mat('s4b_vslit'), conc = mat('concrete'), concD = mat('concreteDark');
  const roof = mat('roofTar');
  // piers
  for (const s of [-1, 1]) {
    const a = s < 0 ? -32 : 6, b = s < 0 ? -6 : 32;
    bb(g, a, b, 0, 14, -20, 20, slots, roof, 3.5, 3.5, concD);
    // end volumes
    const ea = s < 0 ? -32 : 14, eb = s < 0 ? -14 : 32;
    bb(g, ea, eb, 24, 30, -20, 20, vs, roof, 3.4, 3.4, concD);
  }
  // span A across the passage
  bb(g, -32, 32, 14, 24, -14, 14, slots, roof, 3.4, 3.4, concD);
  // central cross volume
  bb(g, -9, 9, 24, 34, -20, 20, vs, roof, 3.4, 3.4, concD);
  // lower stub cantilevers at the pier ends
  bb(g, -32, -14, 14, 24, -20, -14, slots, roof, 3.4, 3.4, concD);
  bb(g, 14, 32, 14, 24, 14, 20, slots, roof, 3.4, 3.4, concD);
  // shading ledges (deep relief) on span A and the cross
  for (const z of [14.35, -14.35]) for (const y of [16.3, 19.8, 23.2]) bb(g, -32, 32, y, y + 0.35, z - 0.45, z + 0.45, conc, conc, 3);
  for (const x of [-9.35, 9.35]) for (const y of [26.3, 29.8, 33.4]) bb(g, x - 0.45, x + 0.45, y, y + 0.35, -20, 20, conc, conc, 3);
  for (const z of [20.35, -20.35]) for (const y of [26.3, 29.8, 33.4]) bb(g, -9, 9, y, y + 0.35, z - 0.45, z + 0.45, conc, conc, 3);
  // stair / lift core on the right pier front, glazed
  bb(g, 20, 27, 0, 30, 20, 21.6, concD, concD, 3);
  // window decals: glazed core (shatterable on the front, fixed elsewhere)
    wins(g, '+z', 21.6, [21.6, 23.5, 25.4], [3.2, 6.6, 10, 16.5, 20, 24, 27.5], { sx: 1.4, sy: 2.4, c: '#dcdad0', lit: (u, y) => y > 5 && u > 22 });
  bb(g, -27, -20, 0, 24, -21.6, -20, concD, concD, 3);
  wins(g, '-z', -21.6, [-25.6, -23.5, -21.4], [3.2, 6.6, 10, 16.5, 20], { sx: 1.4, sy: 2.4, c: '#dcdad0' });
  wins(g, '+x', 32, [-9, 9], [5, 10.5], { sx: 1.4, sy: 2.4, c: '#dcdad0', fixed: false });
  wins(g, '-x', -32, [-9, 9], [5, 10.5], { sx: 1.4, sy: 2.4, c: '#dcdad0', fixed: false });
  // note: the pier inner faces are x=-6 (faces +x) and x=+6 (faces -x)
  doors(g, '+x', -6, [-10, 10], 2.6, 3.4, '#35474a'); doors(g, '-x', 6, [-10, 10], 2.6, 3.4, '#35474a');
  doors(g, '+z', 20, [-22, -12], 2.8, 3.6, '#2a3a44');
  doors(g, '-z', -20, [-24, 24], 2.8, 3.6, '#555e58');
  // underside lamps in the passage, paving
  const pv = tiledPlane(12, 40, 3, 10, mat('s4b_paving'), 0, 0.03, 0); pv.rotation.x = -Math.PI / 2; g.add(pv);
  for (const z of [-12, -4, 4, 12]) g.add(place(new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.2, 0.7), color(0xfff0c0, { emissive: 0xaa9050 })), 0, 13.85, z));
  // signs
  signOn(g, 'МИНИСТЕРСТВО АВТОМОБИЛЬНЫХ ДОРОГ', 26, 2.2, '+z', 14.5, 0, 24.5 - 1.2, { bg: '#1c3a5a' }); // on the ledge, front
  signOn(g, 'ГРУЗИНСКАЯ ССР', 14, 1.4, '+z', 20.6, 0, 31.5, { bg: '#b8352a' });
  signOn(g, 'МИНИСТЕРСТВО АВТОДОРОГ', 24, 1.8, '-z', -20.6, 0, 31.5, { bg: '#1c3a5a' });
  // roof clutter
  const dark = color(0x2a2d31);
  bb(g, -4, 4, 34, 36.5, -3, 3, conc, roof, 4);
  g.add(place(cylT(0.08, 0.08, 8, 6, dark, 1), 0, 40.5, 0));
  g.add(place(new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 0.08), dark), 0, 39, 0));
  for (const x of [-26, -20, 20, 26]) { bb(g, x - 1, x + 1, 30, 31.4, -2, 2, concD, roof, 2); g.add(place(cylT(0.5, 0.5, 2.5, 6, color(0xa8afb0), 2), x, 31.2, 8)); }
  for (const x of [-28, 28]) g.add(place(cylT(0.6, 0.6, 3, 8, color(0xb9b49c), 2), x, 25.5, -14));
  // red flag mast
  g.add(place(cylT(0.08, 0.08, 7, 6, dark, 1), 4.5, 37.5, 0));
  g.add(place(new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 0.05), color(0xc0261d)), 5.7, 40.2, 0));
  const cols = [[-32, -14, -20, 20, 30], [-14, -6, -20, 20, 24], [14, 32, -20, 20, 30], [6, 14, -20, 20, 24]];
  cols.push([20, 27, 20, 21.6, 30], [-27, -20, -21.6, -20, 24]);
  return size(g, 64, 43.2, 34, cols);
}

// =====================================================================================================
// 4. Flying Saucer (Kyiv institute): a disc on a slim tower and thin angled legs
// =====================================================================================================
export function flyingSaucer() {
  const g = G(), conc = mat('concrete'), concD = mat('concreteDark'), ribbed = mat('s4b_ribbed'), white = mat('stuccoWhite'), vs = mat('s4b_vslit');
  const steel = color(0x8a9096), dark = color(0x2a2d31), cols = [];
  const paving = flatDisc(g, 22.5, 0.03, mat('paving'), 28);
  paving.geometry = new THREE.CylinderGeometry(22.5, 22.5, 0.06, 28); const pu = paving.geometry.attributes.uv; for (let i = 0; i < pu.count; i++) pu.setXY(i, pu.getX(i) * 10, pu.getY(i) * 10);
  // central tower
  g.add(place(cylT(5.5, 6.4, 1.2, 10, concD, 3), 0, 0.6, 0));
  g.add(place(cylT(3.6, 3.9, 14, 12, vs, 4), 0, 8, 0));
  // disc: underside cone, glazed ribbed band, upper cone, roof deck
  g.add(place(cylT(22, 8, 2.4, 28, concD, 5), 0, 15.2, 0));
  g.add(place(cylT(22, 22, 4.2, 28, ribbed, 4.2), 0, 18.5, 0));
  g.add(place(cylT(22.5, 22.5, 0.5, 28, white, 3), 0, 16.45, 0));
  g.add(place(cylT(22.5, 22.5, 0.5, 28, white, 3), 0, 20.65, 0));
  g.add(place(cylT(13, 22, 2.2, 28, concD, 5), 0, 21.9, 0));
  g.add(place(cylT(13, 13, 0.4, 28, conc, 4), 0, 23.2, 0));
  g.add(place(cylT(4.8, 5.2, 1.6, 12, conc, 3), 0, 24.2, 0));
  const dome = new THREE.Mesh(new THREE.SphereGeometry(3.2, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat('glass')); dome.position.set(0, 25, 0); g.add(dome);
  g.add(place(cylT(0.1, 0.1, 6, 6, dark, 1), 0, 28.2, 0));
  g.add(place(new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.07, 0.07), dark), 0, 30, 0));
  g.add(place(new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.07, 0.07), dark), 0, 29.2, 0));
  g.add(place(new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 5), color(0xff3020, { emissive: 0xa01408 })), 0, 31.2, 0));
  // rooftop gear around the deck
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2, r = 9.4;
    g.add(place(cylT(0.7, 0.8, 1.6, 8, i % 2 ? steel : concD, 2), Math.sin(a) * r, 24.0, Math.cos(a) * r));
  }
  const dish = new THREE.Mesh(new THREE.SphereGeometry(1.4, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), white); dish.rotation.x = -0.9; dish.position.set(-8.2, 24.8, -6); g.add(dish);
  // parapet ring of lamps
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; g.add(place(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), color(0xffe9a0, { emissive: 0xaa9040 })), Math.sin(a) * 22.6, 20.95, Math.cos(a) * 22.6)); }
  // legs: six thin angled struts
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6, c = Math.cos(a), s = Math.sin(a);
    g.add(limb([s * 20.5, 0, c * 20.5], [s * 15.2, 15.6, c * 15.2], 0.45, white, 6));
    g.add(place(new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 1.6), concD), s * 20.5, 0.25, c * 20.5));
    cols.push([s * 20.5 - 0.9, s * 20.5 + 0.9, c * 20.5 - 0.9, c * 20.5 + 0.9, 14]);
  }
  // lobby annex at the front, under the disc
  bb(g, -6, 6, 0, 4.4, 3.6, 11, mat('stuccoGrey'), mat('roofTar'), 6);
  bb(g, -6.4, 6.4, 4.4, 4.9, 3.4, 11.4, conc, conc, 3);
  wins(g, '+z', 11, [-4, 4], [2.4], { sx: 1.2, sy: 1.9, c: '#dcdad0' });
  doors(g, '+z', 11, [0], 2.4, 3.1, '#2a3a44');
  wins(g, '+x', 6, [7.5], [2.4], {}); wins(g, '-x', -6, [7.5], [2.4], {});
  // service annex at the back
  bb(g, -5, 5, 0, 3.4, -11, -4.2, concD, mat('roofTar'), 4);
  doors(g, '-z', -11, [-2.5], 2.2, 2.8, '#555e58'); wins(g, '-z', -11, [2.5], [2], { sx: 1.2, sy: 1.6 });
  g.add(place(cylT(0.35, 0.35, 5, 6, steel, 1), 3.5, 5.5, -9));
  signOn(g, 'НАУЧНО-ИССЛЕДОВАТЕЛЬСКИЙ ИНСТИТУТ', 11.5, 1.1, '+z', 11, 0, 4.0 + 1.1, { bg: '#1c3a5a' });
  // access bridge into the tower
  bb(g, -1.2, 1.2, 4.9, 5.3, 0, 4, conc, conc, 3);
  cols.push([-4.2, 4.2, -4.2, 4.2, 26], [-6, 6, 3.6, 11, 4.4], [-5, 5, -11, -4.2, 3.4]);
  return size(g, 46, 46, 26, cols);
}

// =====================================================================================================
// 5. Matenadaran (Yerevan): basalt cube with an 8-column portico, great stairs, Mashtots and scribes
// =====================================================================================================
export function matenadaran() {
  const g = G(), bas = mat('s4b_basalt'), conc = mat('concrete'), roof = mat('roofTar'), concD = mat('concreteDark'), cols = [];
  const bronze = color(0x6b7a5c), stone = mat('granite');
  // podium
  bb(g, -27, 27, 0, 3, -22, 8, bas, bas, 5);
  bb(g, -27.6, 27.6, 2.6, 3.2, -22.6, 8.6, conc, conc, 3);
  // main body (with attic cube) and flanking wings
  bb(g, -27, 27, 3, 20, -22, 2, bas, roof, 5);
  bb(g, -27.5, 27.5, 20, 20.8, -22.5, 2.5, conc, conc, 3);
  bb(g, -20, 20, 20.8, 24, -20, -4, bas, roof, 5);
  bb(g, -20.4, 20.4, 23.8, 24.3, -20.4, -3.6, conc, conc, 3);
  bb(g, -27, -16, 3, 20, 2, 7, bas, roof, 5); bb(g, 16, 27, 3, 20, 2, 7, bas, roof, 5);
  bb(g, -27.5, -15.5, 20, 20.8, 2, 7.5, conc, conc, 3); bb(g, 15.5, 27.5, 20, 20.8, 2, 7.5, conc, conc, 3);
  // portico: entablature, 8 columns, ceiling
  bb(g, -17, 17, 17.2, 20.2, 2, 8, conc, roof, 3);
  bb(g, -17.4, 17.4, 20.2, 20.9, 2, 8.4, conc, conc, 3);
  for (let i = 0; i < 8; i++) {
    const x = -14 + i * 4;
    g.add(place(cylT(1.0, 1.1, 14.2, 10, conc, 3), x, 3 + 7.1, 7));
    g.add(place(boxT(2.5, 0.5, 2.5, conc, 2), x, 17.45 - 0.2, 7));
    g.add(place(boxT(2.4, 0.4, 2.4, conc, 2), x, 3.2, 7));
  }
  // recessed doors and tall slit windows
  g.add(tiledPlane(10, 11, 1, 1, mat('s4b_basalt'), 0, 8.5, 2.04).translateZ(0));
  doors(g, '+z', 2, [-3, 0, 3], 2.8, 5.8, '#4a3418');
  for (const d of g.children.slice(-3)) d.position.y += 3;
  wins(g, '+z', 2, [-12, -8, 8, 12], [8.5, 15], { sx: 1.1, sy: 3.4, c: '#c9bfa0' });
  wins(g, '+z', 7, [-24, -20, 20, 24], [8, 14], { sx: 1.1, sy: 3.4, c: '#c9bfa0' });
  // rear and sides: fixed windows, doors, utilities
  wins(g, '-z', -22, rng(-24, 24, 4), [8, 14], { sx: 1.1, sy: 3.4, c: '#c9bfa0' });
  wins(g, '-z', -20, rng(-16, 16, 4), [22.4], { sx: 1.1, sy: 1.8, c: '#c9bfa0' });
  wins(g, '+x', 27, rng(-18, -2, 4), [8, 14], { sx: 1.1, sy: 3.4, c: '#c9bfa0' });
  wins(g, '-x', -27, rng(-18, -2, 4), [8, 14], { sx: 1.1, sy: 3.4, c: '#c9bfa0' });
  wins(g, '+x', 27, [4.5], [8, 14], { sx: 1.1, sy: 3.4, c: '#c9bfa0' });
  wins(g, '-x', -27, [4.5], [8, 14], { sx: 1.1, sy: 3.4, c: '#c9bfa0' });
  doors(g, '-z', -22, [-14, 0, 14], 2.8, 3.4, '#35474a');
  for (const x of [-9, 9]) g.add(place(cylT(0.4, 0.4, 17, 6, color(0x8a9096), 2), x, 11.5, -22.6));
  bb(g, 18, 25, 3, 5.4, -25, -22, concD, roof, 3);       // boiler / loading bay at the back
  doors(g, '-z', -25, [21.5], 2.4, 2.2, '#555e58');
  // fire stair on the east side (zigzag)
  for (let i = 0; i < 10; i++) bb(g, 27, 28.4, 3 + i * 1.7, 4.2 + i * 1.7, -20 + i * 0.5, -19.4 + i * 0.5, concD, concD, 2);
  // roof clutter
  for (const x of [-12, -4, 4, 12]) { bb(g, x - 1.3, x + 1.3, 24, 25.2, -17, -13, concD, roof, 2); }
  g.add(place(cylT(0.08, 0.08, 6, 6, color(0x2a2d31), 1), 14, 27, -8));
  g.add(place(new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.3, 0.05), color(0xd8451e)), 15.3, 29.2, -8));
  // great stairs
  for (let i = 0; i < 10; i++) bb(g, -17, 17, 0, 3 - i * 0.3, 8, 8 + (i + 1) * 1.4, stone, stone, 3);
  for (const s of [-1, 1]) { bb(g, s * 17, s * 18.4, 0, 3.6, 8, 22, bas, bas, 3); g.add(place(cylT(0.55, 0.6, 4.4, 8, bas, 2), s * 17.7, 2.2, 22.6)); }
  // statue of Mesrop Mashtots on a plinth, with scribes
  for (const s of [-1, 1]) {
    const x = s * 23, z = 16;
    bb(g, x - 3, x + 3, 0, 1.2, z - 3, z + 3, bas, bas, 3);
    bb(g, x - 2.2, x + 2.2, 1.2, 4.2, z - 2.2, z + 2.2, bas, conc, 3);
    if (s < 0) {
      figure(g, x, 4.2, z - 0.2, 1.7, bronze, { seated: true, ry: 0 });
      figure(g, x + 1.7, 4.2, z + 0.9, 0.85, bronze, { ry: -0.5 });
      figure(g, x - 1.7, 4.2, z + 0.9, 0.85, bronze, { ry: 0.5 });
      cols.push([x - 3, x + 3, z - 3, z + 3, 8]);
    } else {
      figure(g, x - 1.0, 4.2, z, 1.1, bronze, { ry: 0.3 }); figure(g, x + 1.0, 4.2, z, 1.1, bronze, { ry: -0.3 });
      cols.push([x - 3, x + 3, z - 3, z + 3, 7.6]);
    }
  }
  signOn(g, 'ՄԱՏԵՆԱԴԱՐԱՆ', 14, 1.5, '+z', 2, 0, 18.6, { bg: '#2a2e32' });
  signOn(g, 'МАТЕНАДАРАН', 12, 1.2, '+z', 8.4, 22.5, 18.8, { bg: '#2a2e32' });
  cols.push([-27, 27, -25, 8.6, 24], [-17.5, 17.5, 8, 22, 3]);
  return size(g, 54, 47, 24, cols);
}

// =====================================================================================================
// 6. Linnahall (Tallinn): terraced stone amphitheatre rising over a concrete hall
// =====================================================================================================
export function linnahall() {
  const PL = 11.5;
  const g = G(), lime = mat('s4b_limestone'), lino = mat('s4b_lino'), conc = mat('concrete'), concD = mat('concreteDark'), roof = mat('roofTar'), gran = mat('granite');
  // plateau over the hall (terrace top) and the hall's side wings
  bb(g, -38, 38, 0, PL, -32, -4, lino, lime, 6, 6, concD);
  bb(g, -52, -34, 0, 8, -32, -2, lino, roof, 6, 6, concD); bb(g, 34, 52, 0, 8, -32, -2, lino, roof, 6, 6, concD);
  bb(g, -52.4, -33.6, 8, 8.5, -32.4, -1.6, conc, conc, 3); bb(g, 33.6, 52.4, 8, 8.5, -32.4, -1.6, conc, conc, 3);
  // terraces: 19 wide stone steps, narrowing as they climb
  const N = 18;
  for (let i = 0; i < N; i++) {
    const z1 = 32 - i * 2, z0 = z1 - 2, hgt = (PL / N) * (i + 1), half = 52 - 18 * (i / (N - 1)) * 0.95;
    bb(g, -half, half, 0, hgt, z0, z1, i % 2 ? gran : lime, lime, 4, 4);
  }
  // radial aisles (dark strips) and the stage apron
  for (const x of [-34, -17, 0, 17, 34]) for (let i = 0; i < N; i++) {
    const z1 = 32 - i * 2, hgt = (PL / N) * (i + 1), half = 52 - 18 * (i / (N - 1)) * 0.95;
    if (Math.abs(x) > half - 1.5) continue;
    bb(g, x - 0.5, x + 0.5, hgt, hgt + 0.05, z1 - 2, z1, concD, concD, 2);
  }
  // flanking stone cheek-walls
  for (const s of [-1, 1]) {
    bb(g, s * 52, s * 54, 0, 3, -2, 31, gran, gran, 3);
    bb(g, s * 50, s * 52, 0, 5, -32, -2, concD, concD, 3);
  }
  // angular roofs and hexagonal lantern on the plateau
  for (const x of [-26, 26]) {
    const rf = gableRoof(20, 16, 3.6, 0.5, mat('metalRoof', { double: true }), conc, 3); rf.position.set(x, PL, -17); rf.rotation.y = x < 0 ? 0 : 0; g.add(rf);
    bb(g, x - 10, x + 10, PL, 10.9, -25.5, -8.5, conc, conc, 3);
  }
  const lanternBase = G(); lanternBase.position.set(0, PL, -18); g.add(lanternBase);
  lanternBase.add(place(cylT(8, 9, 1.4, 6, conc, 3), 0, 0.7, 0));
  lanternBase.add(place(cylT(7.2, 7.2, 2.6, 6, mat('glass'), 3), 0, 2.7, 0));
  const cone = new THREE.Mesh(new THREE.ConeGeometry(8.4, 2.0, 6), conc); cone.position.y = 5.0; lanternBase.add(cone);
  lanternBase.add(place(cylT(0.1, 0.1, 3, 6, color(0x2a2d31), 1), 0, 7.0, 0));
  // wing + hall front windows (shatterable) and signs
  wins(g, '+z', -2, [-47, -43, -39, 39, 43, 47], [3, 6], { sx: 1.5, sy: 2.2, c: '#dcdad0' });
  wins(g, '+z', -4, [-30, -22, 22, 30], [4, 8], { sx: 1.5, sy: 2.2, c: '#dcdad0', fixed: true });
  doors(g, '+z', -2, [-49.5, 49.5], 2.4, 3.2, '#35474a');
  signOn(g, 'ЛИННАХОЛЛ', 14, 1.5, '+z', -2, -43, 6.6 + 0.4, { bg: '#1c3a5a' });
  signOn(g, 'ЛИННАХОЛЛ', 14, 1.5, '+z', -2, 43, 6.6 + 0.4, { bg: '#1c3a5a' });
  // back of the hall: slits, fixed windows, loading docks, pipes
  for (const x of rng(-48, 48, 12)) wins(g, '-z', -32, [x], [3, 6.5], { sx: 1.6, sy: 2.4, c: '#dcdad0' });
  doors(g, '-z', -32, [-30, -12, 8, 30], 3.4, 4.2, '#555e58');
  bb(g, -34, 34, 0.4, 1.0, -34, -32, concD, concD, 3);
  for (const x of [-20, 18, 44]) { g.add(place(cylT(0.5, 0.5, 9, 8, color(0xa8afb0), 2), x, 4.5, -33)); }
  signOn(g, 'КОНЦЕРТНЫЙ ЗАЛ', 18, 1.5, '-z', -32, -3, 9.2, { bg: '#7a1c14' });
  wins(g, '-x', -52, rng(-26, -8, 6), [3, 6], {}); wins(g, '+x', 52, rng(-26, -8, 6), [3, 6], {});
  // flagpoles on the plateau corners
  for (const x of [-36, 36]) { g.add(place(cylT(0.1, 0.1, 8, 6, color(0xcfcfcf), 1), x, 14.5, -6)); g.add(place(new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 0.05), color(0xc0261d)), x + 1.3, 17.5, -6)); }
  return size(g, 104, 64, 15);
}
