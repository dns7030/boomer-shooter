// First-person weapon art, painted procedurally each frame onto a small canvas.
// Weapons are drawn in a local frame (origin bottom-centre, barrel along -Y, tapering for perspective)
// and the whole thing is tilted toward the crosshair, Doom/Duke style.
export const VIEW_W = 200, VIEW_H = 180;

const grd = (g, x0, y0, x1, y1, stops) => {
  const r = g.createLinearGradient(x0, y0, x1, y1);
  for (const [o, c] of stops) r.addColorStop(o, c);
  return r;
};
const quad = (g, pts, fill) => {
  g.fillStyle = fill; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath(); g.fill();
};

const STEEL = [[0, '#0b0c0f'], [0.22, '#2c3036'], [0.46, '#8a929e'], [0.58, '#4a5059'], [0.85, '#1b1e23'], [1, '#08090b']];
const BLUED = [[0, '#07080a'], [0.25, '#1d2026'], [0.48, '#59606b'], [0.6, '#2a2e35'], [1, '#050607']];
const WOOD = [[0, '#2a170a'], [0.28, '#6d3f1c'], [0.5, '#a5672d'], [0.7, '#6a3d1b'], [1, '#26140a']];
const BRASS = [[0, '#5a4210'], [0.4, '#e0b84a'], [0.7, '#9a7420'], [1, '#4a3510']];

// tapered tube from near (bottom) to far (top)
function tube(g, xN, yN, wN, xF, yF, wF, stops = STEEL) {
  const x0 = Math.min(xN - wN / 2, xF - wF / 2), x1 = Math.max(xN + wN / 2, xF + wF / 2);
  quad(g, [[xN - wN / 2, yN], [xN + wN / 2, yN], [xF + wF / 2, yF], [xF - wF / 2, yF]], grd(g, x0, 0, x1, 0, stops));
}
function band(g, y, w, h, x = 0, stops = BRASS) { g.fillStyle = grd(g, x - w / 2, 0, x + w / 2, 0, stops); g.fillRect(x - w / 2, y, w, h); }

const SKIN = [[0, '#5e3a24'], [0.25, '#b57c58'], [0.5, '#dfa87f'], [0.78, '#a86f4c'], [1, '#5a3622']];
function sleeve(g, cx, top, w, h) {
  g.fillStyle = grd(g, cx - w / 2, 0, cx + w / 2, 0, [[0, '#14180f'], [0.3, '#4a553e'], [0.62, '#363f2c'], [1, '#12150d']]);
  g.fillRect(cx - w / 2, top, w, h);
  g.fillStyle = '#10130b'; g.fillRect(cx - w / 2, top, w, 5);
  g.fillStyle = 'rgba(255,255,255,0.07)';
  for (let y = top + 10; y < top + h; y += 9) g.fillRect(cx - w / 2 + 3, y, w - 9, 1);
  g.fillStyle = 'rgba(0,0,0,0.25)';
  for (let y = top + 14; y < top + h; y += 9) g.fillRect(cx - w / 2 + 6, y, w - 14, 1);
}
// back of a hand with knuckles (fingers wrap over the weapon)
function hand(g, cx, top, w, h, n = 4) {
  g.fillStyle = grd(g, cx - w / 2, 0, cx + w / 2, 0, SKIN);
  g.beginPath(); g.roundRect(cx - w / 2, top, w, h, [w * 0.32, w * 0.32, 4, 4]); g.fill();
  for (let i = 0; i < n; i++) {
    const x = cx - w / 2 + (w * (i + 0.5)) / n;
    g.fillStyle = grd(g, x - w / (n * 2), 0, x + w / (n * 2), 0, SKIN);
    g.beginPath(); g.ellipse(x, top + 2, w / (n * 2) - 0.6, 5.5, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(40,20,10,0.5)'; g.fillRect(x + w / (n * 2) - 1, top + 3, 1, 9);
  }
  g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(cx - w / 2 + 2, top + h - 6, w - 4, 6);
}
function thumb(g, x, y, w, h, rot) {
  g.save(); g.translate(x, y); g.rotate(rot);
  g.fillStyle = grd(g, -w / 2, 0, w / 2, 0, SKIN);
  g.beginPath(); g.ellipse(0, 0, w / 2, h / 2, 0, 0, 7); g.fill();
  g.fillStyle = '#ead0b8'; g.beginPath(); g.ellipse(0, -h / 2 + 2, w / 2 - 1.5, 2.2, 0, 0, 7); g.fill();
  g.restore();
}

function flash(g, x, y, size, a) {
  if (a <= 0) return;
  g.save(); g.globalAlpha = Math.min(1, a * 1.3);
  const glow = g.createRadialGradient(x, y, 1, x, y, size * 1.25);
  glow.addColorStop(0, 'rgba(255,240,170,0.95)'); glow.addColorStop(0.5, 'rgba(255,150,40,0.45)'); glow.addColorStop(1, 'rgba(255,100,20,0)');
  g.fillStyle = glow; g.fillRect(x - size * 1.3, y - size * 1.3, size * 2.6, size * 2.6);
  const pts = [];
  for (let i = 0; i < 14; i++) { const r = i % 2 ? size * 0.35 : size * (0.8 + 0.2 * ((i * 7) % 3) / 2); const ang = (i / 14) * Math.PI * 2; pts.push([x + Math.cos(ang) * r, y + Math.sin(ang) * r * 0.85]); }
  quad(g, pts, '#ffb43a');
  quad(g, pts.map(([px, py]) => [x + (px - x) * 0.55, y + (py - y) * 0.55]), '#fff2b8');
  g.restore();
}

const ART = {
  pistol(g, o) {
    sleeve(g, 0, 40, 62, 120);
    // slide: flat top face + dark side walls (viewed from behind and above)
    quad(g, [[-16, -8], [-11, -80], [-14, -76], [-20, -4]], '#1a1d22');
    quad(g, [[16, -8], [11, -80], [14, -76], [20, -4]], '#111316');
    quad(g, [[-16, -8], [16, -8], [11, -80], [-11, -80]], grd(g, 0, -8, 0, -80, [[0, '#6a717c'], [0.5, '#4b515b'], [1, '#353a42']]));
    g.fillStyle = 'rgba(255,255,255,0.28)'; g.fillRect(-16, -8, 1.5, 4); g.fillRect(-11, -80, 1, 4);
    quad(g, [[-3, -9], [3, -9], [2, -78], [-2, -78]], 'rgba(0,0,0,0.28)');       // centre rib
    g.fillStyle = '#0a0b0d'; g.fillRect(7, -62, 6, 12);                          // ejection port
    g.fillStyle = 'rgba(255,255,255,0.18)'; for (let y = -12; y > -36; y -= 4) { g.fillRect(-19, y, 3, 1); }
    // sights
    g.fillStyle = '#0a0b0d'; g.fillRect(-14, -17, 8, 8); g.fillRect(6, -17, 8, 8);
    g.fillStyle = '#e8e4d0'; g.fillRect(-11, -14, 2, 3); g.fillRect(9, -14, 2, 3);
    g.fillStyle = '#0a0b0d'; g.fillRect(-2.5, -86, 5, 8); g.fillStyle = '#e8e4d0'; g.fillRect(-0.5, -85, 2, 2);
    // front of slide / muzzle
    g.fillStyle = '#08090b'; g.fillRect(-11, -80, 22, 3);
    g.fillStyle = '#000'; g.beginPath(); g.ellipse(0, -79, 4, 1.4, 0, 0, 7); g.fill();
    // frame / grip + hand wrapped around it
    quad(g, [[-22, 8], [22, 8], [20, -6], [-20, -6]], '#16181c');
    hand(g, 0, 0, 52, 70, 4);
    thumb(g, -27, -4, 14, 26, -0.15);       // thumb alongside the slide
    thumb(g, 26, -6, 12, 24, 0.15);          // trigger finger
    flash(g, 0, -90, 30, o.fire);
  },
  shotgun(g, o) {
    sleeve(g, 0, 46, 62, 120);
    // barrel + magazine tube
    tube(g, 0, -30, 18, 0, -112, 9);
    tube(g, 2, -34, 11, 2, -92, 7, BLUED);
    g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(-1, -112, 2, 80);
    g.fillStyle = '#050607'; g.beginPath(); g.ellipse(0, -113, 5.5, 2, 0, 0, 7); g.fill();
    g.fillStyle = '#e0d6b0'; g.fillRect(-1, -118, 2.5, 6);                   // bead sight
    band(g, -96, 12, 3, 0, STEEL); band(g, -60, 15, 3, 0, STEEL);
    // receiver
    quad(g, [[-17, 8], [17, 8], [14, -34], [-14, -34]], grd(g, -17, 0, 17, 0, BLUED));
    g.fillStyle = '#0c0d10'; g.fillRect(8, -28, 5, 14);                       // ejection port
    g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(-1, -34, 2, 40);
    // pump forearm (slides)
    const py = o.pump * 14;
    quad(g, [[-18, -34 + py], [18, -34 + py], [13, -66 + py], [-13, -66 + py]], grd(g, -18, 0, 18, 0, WOOD));
    g.fillStyle = 'rgba(0,0,0,0.4)'; for (let y = -40; y > -64; y -= 8) g.fillRect(-16 + (-y - 38) * 0.1, y + py, 32 - (-y - 38) * 0.2, 1);
    // left hand gripping the pump from above
    hand(g, -1, -48 + py, 36, 34, 4);
    thumb(g, -22, -44 + py, 9, 24, -0.3);
    thumb(g, 19, -40 + py, 7, 18, 0.25);
    // right hand on the grip
    hand(g, 4, -6, 40, 46, 4);
    thumb(g, -20, -2, 10, 24, -0.25);
    flash(g, 0, -122, 40, o.fire);
  },
  chaingun(g, o) {
    sleeve(g, 14, 60, 56, 100);
    // barrel cluster: three barrels orbiting the axis
    const R = 11, a0 = o.spin * 0.6;
    const bs = [0, 1, 2].map((k) => {
      const a = a0 + (k * Math.PI * 2) / 3;
      return { x: Math.cos(a) * R, d: Math.sin(a) };
    }).sort((p, q) => p.d - q.d);
    for (const b of bs) tube(g, b.x, -34, 13, b.x * 0.5, -108, 8, STEEL);
    band(g, -64, 40, 4, 0, STEEL); band(g, -98, 28, 3, 0, BLUED);
    g.fillStyle = '#050607'; g.beginPath(); g.ellipse(0, -108, 10, 3, 0, 0, 7); g.fill();
    // housing
    quad(g, [[-27, 8], [27, 8], [22, -38], [-22, -38]], grd(g, -27, 0, 27, 0, BLUED));
    g.fillStyle = 'rgba(255,255,255,0.14)'; g.fillRect(-20, -34, 40, 2); g.fillRect(-2, -38, 4, 44);
    g.fillStyle = '#050607'; g.fillRect(-14, -26, 28, 3); g.fillRect(-14, -14, 28, 3);
    // ammo belt feeding from the left
    for (let i = 0; i < 6; i++) { band(g, -4 - i * 7, 9, 5, -36 - i * 3, BRASS); g.fillStyle = '#5a3a18'; g.fillRect(-40 - i * 3, -2 - i * 7, 3, 5); }
    // hands
    hand(g, 18, -6, 36, 50, 4);
    thumb(g, -4, -2, 10, 24, 0.2);
    flash(g, 0, -114, 34, o.fire);
  },
  sabre(g, o) {
    const s = o.swing;
    const ang = s < 0 ? -0.2 : 1.05 - 2.9 * (1 - (1 - s) * (1 - s));
    sleeve(g, 24, 56, 54, 100);
    g.save();
    g.translate(s < 0 ? 22 : 26 - Math.sin(s * Math.PI) * 14, -4);
    g.rotate(ang);
    // blade (curved shashka), long and slightly forward-curved
    const blade = [[-3, -16], [-4, -50], [-1, -90], [7, -122], [4, -90], [5, -50], [5, -16]];
    quad(g, blade, grd(g, -4, 0, 7, 0, [[0, '#3a414a'], [0.4, '#dfe6ee'], [0.55, '#9aa4b0'], [1, '#4a525c']]));
    g.fillStyle = 'rgba(30,36,44,0.8)'; g.fillRect(2, -110, 1, 92);       // fuller
    g.fillStyle = 'rgba(255,255,255,0.85)'; g.fillRect(-2, -108, 1, 90);  // edge glint
    // guard + grip
    quad(g, [[-11, -16], [11, -16], [9, -11], [-9, -11]], grd(g, -11, 0, 11, 0, BRASS));
    g.fillStyle = grd(g, -5, 0, 5, 0, [[0, '#1a0f08'], [0.5, '#4f3220'], [1, '#150b06']]); g.fillRect(-4, -11, 9, 30);
    g.fillStyle = 'rgba(0,0,0,0.5)'; for (let y = -8; y < 16; y += 4) g.fillRect(-4, y, 9, 1);
    quad(g, [[-6, 19], [6, 19], [7, 25], [-7, 25]], grd(g, -7, 0, 7, 0, BRASS));
    // fist wrapped around the grip
    g.fillStyle = grd(g, -9, 0, 9, 0, SKIN); g.beginPath(); g.roundRect(-10, -6, 20, 22, 6); g.fill();
    for (let i = 0; i < 4; i++) { g.fillStyle = grd(g, -9, 0, 9, 0, SKIN); g.beginPath(); g.ellipse(0, -2 + i * 5, 10, 3, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(40,20,10,.45)'; g.fillRect(-9, -4 + i * 5, 19, 1); }
    thumb(g, -9, -8, 8, 16, 0.5);
    g.restore();
  },
};

export function drawWeapon(g, id, o) {
  g.clearRect(0, 0, VIEW_W, VIEW_H);
  g.save();
  const lean = id === 'sabre' ? 0 : -0.12;
  g.translate(Math.round(o.ox) + (id === 'sabre' ? 112 : 126), Math.round(o.oy) + VIEW_H - 46);
  g.rotate(lean + (o.fire > 0 ? 0.015 * o.fire : 0));
  ART[id](g, { pump: 0, spin: 0, ...o });
  g.restore();
}
