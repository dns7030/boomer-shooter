// First-person weapon sprites drawn procedurally onto a small 2D canvas each frame.
export const VIEW_W = 160, VIEW_H = 120;

const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
const poly = (g, pts, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) g.lineTo(p[0], p[1]); g.closePath(); g.fill(); };

const SKIN = '#d9a37a';
function fist(g, x, y, w, h) {
  R(g, x, y, w, h, SKIN); R(g, x, y, w, 2, '#ecbd98'); R(g, x, y + h - 3, w, 3, '#a87650');
  for (let i = 1; i < 4; i++) R(g, x + (w * i) / 4, y + 2, 1, h - 6, '#a87650');
}
function sleeve(g, x, y, w, h) {
  R(g, x, y, w, h, '#9a1c1c'); R(g, x, y, w, 2, '#c8302a'); R(g, x, y, 2, h, '#c8302a'); R(g, x + w - 3, y, 3, h, '#6a1010');
  R(g, x, y, w, 4, '#e8d8a0');
}
function flash(g, x, y, size, a) {
  if (a <= 0) return;
  g.globalAlpha = Math.min(1, a * 1.4);
  const pts = [];
  for (let i = 0; i < 16; i++) { const r = i % 2 ? size * 0.42 : size; const ang = (i / 16) * Math.PI * 2; pts.push([x + Math.cos(ang) * r, y + Math.sin(ang) * r * 0.9]); }
  poly(g, pts, '#ff9a2a');
  const p2 = pts.map(([px, py]) => [x + (px - x) * 0.55, y + (py - y) * 0.55]);
  poly(g, p2, '#ffe9a0');
  g.globalAlpha = 1;
}

const ART = {
  sabre(g, o) {
    // swing: 0..1 progress, -1 idle
    const s = o.swing;
    const ang = s < 0 ? -0.18 : 1.0 - 2.7 * (1 - (1 - s) * (1 - s));
    const px = 120 - (s < 0 ? 0 : Math.sin(s * Math.PI) * 18), py = 112;
    sleeve(g, 104, 104, 46, 24);
    g.save(); g.translate(px, py); g.rotate(ang);
    poly(g, [[-3, -8], [-4, -34], [-2, -62], [6, -84], [4, -60], [5, -34], [4, -8]], '#c9d0d8');
    poly(g, [[-3, -8], [-4, -34], [-2, -62], [6, -84], [2, -62], [0, -34], [0, -8]], '#8d96a2');
    R(g, -1, -80, 1, 70, '#eef3f8');
    R(g, -10, -10, 20, 3, '#d9a62a'); R(g, -2, -8, 5, 18, '#4a2a10');
    fist(g, -8, 2, 17, 13);
    g.restore();
  },
  pistol(g, o) {
    sleeve(g, 62, 100, 48, 26);
    R(g, 80, 36, 9, 46, '#5b6068'); R(g, 80, 36, 2, 46, '#9aa1ab'); R(g, 87, 38, 2, 44, '#3b3f46');
    R(g, 79, 33, 11, 5, '#2a2d33');
    R(g, 76, 62, 17, 12, '#8a7a4a'); R(g, 76, 62, 17, 2, '#c8b878');
    R(g, 90, 54, 5, 10, '#3a3d44'); R(g, 93, 52, 3, 4, '#aaa');
    R(g, 76, 74, 17, 20, '#7a4a24'); R(g, 76, 74, 3, 20, '#9a6a3a'); R(g, 90, 74, 3, 20, '#4a2a10');
    fist(g, 70, 82, 30, 22);
    flash(g, 84.5, 28, 26, o.fire);
  },
  blunder(g, o) {
    sleeve(g, 52, 100, 62, 26);
    poly(g, [[64, 22], [106, 22], [95, 58], [75, 58]], '#9a7a30');
    poly(g, [[68, 22], [102, 22], [100, 28], [70, 28]], '#2a2d33');
    poly(g, [[64, 22], [70, 22], [78, 58], [75, 58]], '#c8a850');
    R(g, 76, 56, 18, 34, '#4a4e54'); R(g, 76, 56, 3, 34, '#8a919a');
    R(g, 74, 62, 22, 3, '#d9a62a'); R(g, 74, 78, 22, 3, '#d9a62a');
    R(g, 72, 88, 24, 22, '#6a4426'); R(g, 72, 88, 3, 22, '#8a6040');
    fist(g, 66, 66, 18, 14); fist(g, 70, 90, 28, 20);
    flash(g, 85, 16, 40, o.fire);
  },
  skorostrel(g, o) {
    sleeve(g, 52, 102, 62, 24);
    const sh = o.fire > 0 ? (o.shotN % 2 ? 1 : -1) : 0;
    for (let i = 0; i < 5; i++) {
      const x = 58 + i * 9;
      R(g, x, 30 + (i === o.shotN % 5 && o.fire > 0 ? 3 : 0) + sh, 8, 50, i % 2 ? '#6a7076' : '#585d64');
      R(g, x, 30 + sh, 2, 50, '#9aa1ab'); R(g, x + 6, 30 + sh, 2, 50, '#3b3f46'); R(g, x, 28 + sh, 8, 4, '#222');
    }
    R(g, 54, 74, 50, 12, '#6a4426'); R(g, 54, 74, 50, 2, '#8a6040'); R(g, 54, 56, 50, 3, '#d9a62a');
    R(g, 106, 70, 14, 4, '#444'); R(g, 118, 62, 4, 14, '#c9a060');
    fist(g, 70, 84, 36, 22);
    if (o.fire > 0) flash(g, 58 + (o.shotN % 5) * 9 + 4, 24, 22, o.fire);
  },
};

export function drawWeapon(g, id, o) {
  g.clearRect(0, 0, VIEW_W, VIEW_H);
  g.save();
  g.translate(Math.round(o.ox), Math.round(o.oy));
  ART[id](g, o);
  g.restore();
}
