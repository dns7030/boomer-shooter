// The Neo node: the glowing central building every city defends. Each city gets its own local style
// (neoTowerMoscow / neoTowerSeattle / neoTowerDubai) built on one shared damage framework:
//   • stage 0..4 = every 20 % of lost uptime: cracks and scorch marks spread, windows blow out, rubble piles up,
//     the crown tilts and finally falls apart, the green glow dims and flickers, smoke and fire pour out.
//   • T.add(mesh, { hideAt })  an intact piece that disappears at that stage;  T.broken(mesh, showAt)  a damage piece.
import * as THREE from 'three';
import { mat, color, boxT, cylT, place } from '../geo.js';
import { slab, tiledPlane, sign } from '../buildings2.js';
import { addPainters, mulberry } from '../textures.js';
import '../buildings5d.js';   // registers the s5d_* textures used by the Dubai and Seattle towers

export const NEO_GREEN = 0x00e599;
const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
addPainters({
  neo_crack(g, w, h) {      // jagged dark cracks on transparent
    g.clearRect(0, 0, w, h); const rnd = mulberry(901); g.strokeStyle = 'rgba(12,12,14,0.95)'; g.lineWidth = 2.2;
    for (let k = 0; k < 3; k++) { let x = 10 + rnd() * 44, y = 2; g.beginPath(); g.moveTo(x, y); while (y < h - 4) { x += (rnd() - 0.5) * 14; y += 6 + rnd() * 8; g.lineTo(x, y); if (rnd() < 0.3) { g.moveTo(x, y); g.lineTo(x + (rnd() - 0.5) * 22, y + 8); g.moveTo(x, y); } } g.stroke(); }
  },
  neo_scorch(g, w, h) {     // soot blotch
    g.clearRect(0, 0, w, h); const rnd = mulberry(902);
    for (let i = 0; i < 70; i++) { const x = 32 + (rnd() - 0.5) * 50, y = 32 + (rnd() - 0.5) * 50, r = 2 + rnd() * 7, d = Math.hypot(x - 32, y - 32); g.fillStyle = `rgba(10,8,8,${Math.max(0, 0.7 - d / 45)})`; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
  },
  neo_hole(g, w, h) {       // a blown-out window / breach: dark hole with a ragged edge and glowing embers
    g.clearRect(0, 0, w, h); const rnd = mulberry(903); g.fillStyle = '#0a0a0c'; g.beginPath();
    for (let i = 0; i < 14; i++) { const a = (i / 14) * 6.283, r = 20 + rnd() * 10; g.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r * 1.2); } g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,120,30,0.9)'; for (let i = 0; i < 9; i++) g.fillRect(20 + rnd() * 24, 22 + rnd() * 26, 2, 2);
  },
  neo_glass(g, w, h) {      // dark green glass with bright mullions
    R(g, 0, 0, 64, 64, '#07382c'); for (let i = 0; i < 64; i += 16) { R(g, i, 0, 2, 64, '#00e599'); R(g, 0, i, 64, 1, '#0a6a50'); } R(g, 0, 0, 64, 64, 'rgba(0,229,153,0.12)');
  },
});

export function makeNeoTower({ w, d, h, rectPad = 2, build }) {
  const g = new THREE.Group(), cols = [], stagesHide = [], stagesShow = [], tops = [], spinners = [], wobblers = [], smokePoints = [];
  const glow = new THREE.MeshBasicMaterial({ color: new THREE.Color(NEO_GREEN) });
  const glowBase = new THREE.Color(0, 0.8, 0.45);                      // HDR green so bloom picks it up
  const T = {
    g, w, d, h, cols, glow,
    add(mesh, { hideAt = 99 } = {}) { g.add(mesh); if (hideAt < 99) { mesh.userData.keep = true; stagesHide.push([mesh, hideAt]); } return mesh; },
    broken(mesh, showAt) { mesh.visible = false; mesh.userData.keep = true; g.add(mesh); stagesShow.push([mesh, showAt]); return mesh; },
    // a crown group that tilts a little at stage 3 and a lot at stage 4 (pivot = its own origin)
    top(group) { group.userData.keep = true; g.add(group); tops.push(group); group.traverse((o) => { if (o.isMesh) o.userData.keep = true; }); return group; },
    spin(obj, speed = 0.4) { obj.userData.keep = true; obj.userData.spinSpeed = speed; spinners.push(obj); return obj; },
    // a ring that rocks gently from side to side (no rotation about its own axis): the pivot group tilts about two horizontal axes
    wobble(pivot, amp = 0.26, speed = 0.8) { pivot.userData.keep = true; pivot.userData.wob = { amp, speed }; wobblers.push(pivot); return pivot; },
    smoke(x, y, z) { smokePoints.push(new THREE.Vector3(x, y, z)); },
  };
  build(T);
  // ---- shared damage overlays on the four faces ----
  const rnd = mulberry(7000 + Math.round(w * 13 + h));
  const faces = [{ ax: 'z', s: 1, len: w }, { ax: 'z', s: -1, len: w }, { ax: 'x', s: 1, len: d }, { ax: 'x', s: -1, len: d }];
  const crackM = new THREE.MeshBasicMaterial({ map: mat('neo_crack').map, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, depthWrite: false });
  const scorchM = new THREE.MeshBasicMaterial({ map: mat('neo_scorch').map, transparent: true, alphaTest: 0.05, side: THREE.DoubleSide, depthWrite: false });
  const holeM = new THREE.MeshBasicMaterial({ map: mat('neo_hole').map, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide });
  for (const f of faces) {
    for (let stage = 1; stage <= 4; stage++) {
      const n = [0, 2, 3, 4, 5][stage];
      for (let k = 0; k < n; k++) {
        const kind = rnd(); const mt = kind < 0.45 ? crackM : kind < 0.75 ? scorchM : holeM, sz = mt === crackM ? 5 + rnd() * 6 : mt === scorchM ? 4 + rnd() * 5 : 2.6 + rnd() * 2.4;
        if (mt === holeM && stage < 2) continue;
        const m = new THREE.Mesh(new THREE.PlaneGeometry(sz, mt === crackM ? sz * 1.6 : sz), mt);
        const u = (rnd() - 0.5) * f.len * 0.9, y = h * (0.1 + rnd() * 0.5);
        if (f.ax === 'z') { m.position.set(u, y, f.s * (d / 2 + 0.12)); m.rotation.y = f.s > 0 ? 0 : Math.PI; } else { m.position.set(f.s * (w / 2 + 0.12), y, u); m.rotation.y = f.s > 0 ? Math.PI / 2 : -Math.PI / 2; }
        T.broken(m, stage);
      }
    }
  }
  const rubbleM = color(0x6a6a6e);
  for (let stage = 2; stage <= 4; stage++) for (let k = 0; k < 6; k++) {
    const sz = 0.8 + rnd() * 1.6, m = new THREE.Mesh(new THREE.BoxGeometry(sz, sz * 0.7, sz), rubbleM), a = rnd() * 6.283, rr = Math.max(w, d) * 0.55 + rnd() * 4;
    m.position.set(Math.cos(a) * rr * (w / Math.max(w, d)) , sz * 0.3, Math.sin(a) * rr * (d / Math.max(w, d))); m.rotation.set(rnd(), rnd(), rnd()); T.broken(m, stage);
  }
  const DIM = [1, 0.8, 0.6, 0.4, 0.22], TILT = [0, 0, 0, 0.05, 0.16];
  let curStage = 0;
  function setStage(n) {
    curStage = n;
    for (const [m, at] of stagesHide) m.visible = n < at;
    for (const [m, at] of stagesShow) m.visible = n >= at;
    for (const t of tops) { t.rotation.z = TILT[n] * (t.userData.tiltDir || 1); t.rotation.x = TILT[n] * 0.4; }
  }
  function update(t, stage, alive) {
    const dim = DIM[stage] * (stage >= 2 ? 0.75 + 0.25 * Math.sin(t * 17 + Math.sin(t * 3.1) * 4) : 1) * (alive ? 1 : 0.1);
    glow.color.copy(glowBase).multiplyScalar(dim);
    for (const s of spinners) s.rotation.y += 0.016 * s.userData.spinSpeed * (1 - stage * 0.2);
    for (const w of wobblers) { const { amp, speed } = w.userData.wob; w.rotation.z = amp * Math.sin(t * speed); w.rotation.x = amp * 0.45 * Math.sin(t * speed * 0.7 + 1.3); }
  }
  setStage(0);
  g.userData = { w, d, h, cols: cols.length ? cols : [[-w / 2, w / 2, -d / 2, d / 2, h]], rect: { w: w + rectPad * 2, d: d + rectPad * 2 }, setStage, update, smokePoints, glow };
  return g;
}

// ---------- Moscow: a Stalinist stepped tower with green-glass strips, a glowing crown and a halo ----------
export function neoTowerMoscow() {
  return makeNeoTower({
    w: 30, d: 30, h: 66, rectPad: 3,
    build(T) {
      const conc = mat('concrete'), stalin = mat('stalin');
      // plinth + steps
      T.cols.push([-15, 15, -15, 15, 66], [-18, 18, -18, 18, 2.2]);
      T.add(boxT(36, 1.2, 36, mat('granite'), 3)).position.set(0, 0.6, 0);
      T.add(boxT(33, 0.8, 33, mat('granite'), 3)).position.set(0, 1.6, 0);
      const tiers = [{ w: 30, d: 30, h: 26 }, { w: 22, d: 22, h: 16 }, { w: 15, d: 15, h: 12 }];
      let y = 2;
      tiers.forEach((t, i) => {
        T.add(place(slab(t.w, t.h, t.d, stalin, mat('roofTar'), 6), 0, y + t.h / 2, 0));
        T.add(place(boxT(t.w + 1.4, 1.0, t.d + 1.4, conc, 2), 0, y + t.h + 0.5, 0));
        // glowing green glass strips on the corners and the middle of each face
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) T.add(place(new THREE.Mesh(new THREE.BoxGeometry(0.9, t.h - 1.5, 0.9), T.glow), sx * t.w / 2, y + t.h / 2, sz * t.d / 2));
        y += t.h + 1.0;
      });
      // the crown: spire, orb and halo ring (tilts and breaks apart as the node is hurt)
      const crown = new THREE.Group(); crown.position.set(0, y, 0);
      const spire = new THREE.Mesh(new THREE.ConeGeometry(4.2, 30, 8), new THREE.MeshBasicMaterial({ color: 0x08382c })); spire.position.y = 15; crown.add(spire);
      for (let i = 0; i < 4; i++) { const a = (i / 4) * 6.283 + 0.78; const rib = new THREE.Mesh(new THREE.BoxGeometry(0.4, 29, 0.4), T.glow); rib.position.set(Math.cos(a) * 1.9, 14.5, Math.sin(a) * 1.9); rib.rotation.z = -Math.cos(a) * 0.13; rib.rotation.x = Math.sin(a) * 0.13; crown.add(rib); }
      const orb = new THREE.Mesh(new THREE.SphereGeometry(2.4, 14, 10), T.glow); orb.position.y = 32.5; crown.add(orb);
      T.top(crown);
      const halo = new THREE.Mesh(new THREE.TorusGeometry(9, 0.45, 8, 40), T.glow); halo.rotation.x = Math.PI / 2.4; halo.position.set(0, y + 22, 0); T.add(halo, { hideAt: 4 }); T.spin(halo, 0.7);
      const halo2 = new THREE.Mesh(new THREE.TorusGeometry(6.5, 0.3, 8, 36), T.glow); halo2.rotation.x = Math.PI / 2.4 + 1.0; halo2.position.set(0, y + 22, 0); T.add(halo2, { hideAt: 3 }); T.spin(halo2, -1.0);
      // light beam to the sky
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 2.2, 160, 12, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(0, 0.9, 0.6), transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
      beam.position.set(0, y + 80, 0); T.add(beam, { hideAt: 3 });
      // entrance (faces +Z): a bright green gate and the sign
      T.add(place(new THREE.Mesh(new THREE.BoxGeometry(7, 9, 0.5), T.glow), 0, 6.5, 15.2));
      T.add(place(new THREE.Mesh(new THREE.BoxGeometry(5.4, 7.6, 0.6), color(0x04261c)), 0, 5.8, 15.25));
      const sg = sign('N E O', 16, 1.6, { bg: '#04261c', fg: '#00e599' }); sg.position.set(0, 12.8, 15.75); T.add(sg);
      T.smoke(-8, 20, 15.5); T.smoke(9, 28, -9); T.smoke(0, 52, 5);
    },
  });
}

// ---------- Dubai: a twisting golden-glass spire in the Burj tradition, ringed with green light ----------
export function neoTowerDubai() {
  return makeNeoTower({
    w: 26, d: 26, h: 90, rectPad: 3,
    build(T) {
      const gold = mat('s5d_goldclad'), glass = mat('s5d_glass');
      T.cols.push([-13, 13, -13, 13, 90], [-16, 16, -16, 16, 1.9]);
      T.add(boxT(32, 1.0, 32, mat('s5d_sandstone'), 3)).position.set(0, 0.5, 0);
      T.add(boxT(29, 0.8, 29, mat('s5d_sandstone'), 3)).position.set(0, 1.4, 0);
      let y = 1.8;
      const tiers = [{ s: 26, h: 22 }, { s: 22, h: 18 }, { s: 18, h: 16 }, { s: 14, h: 14 }, { s: 10, h: 12 }, { s: 6.5, h: 10 }];
      tiers.forEach((t, i) => {
        const m = new THREE.Group(); m.position.set(0, y, 0); m.rotation.y = i * 0.26;
        const body = new THREE.Mesh(new THREE.BoxGeometry(t.s, t.h, t.s), i % 2 ? gold : glass); body.position.y = t.h / 2; m.add(body);
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.7, t.h, 0.7), T.glow); st.position.set(sx * t.s / 2, t.h / 2, sz * t.s / 2); m.add(st); }
        const band = new THREE.Mesh(new THREE.BoxGeometry(t.s + 1.2, 0.8, t.s + 1.2), T.glow); band.position.y = t.h; m.add(band);
        T.add(m); y += t.h + 0.2;
      });
      const crown = new THREE.Group(); crown.position.set(0, y, 0);
      const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 1.1, 24, 8), gold); spire.position.y = 12; crown.add(spire);
      const orb = new THREE.Mesh(new THREE.SphereGeometry(1.8, 14, 10), T.glow); orb.position.y = 25; crown.add(orb);
      T.top(crown);
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 2.2, 160, 12, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(0, 0.9, 0.6), transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
      beam.position.set(0, y + 85, 0); T.add(beam, { hideAt: 3 });
      T.add(place(new THREE.Mesh(new THREE.BoxGeometry(7, 9, 0.5), T.glow), 0, 6.5, 13.2));
      T.add(place(new THREE.Mesh(new THREE.BoxGeometry(5.4, 7.6, 0.6), color(0x04261c)), 0, 5.8, 13.25));
      const sg = sign('N E O', 16, 1.6, { bg: '#04261c', fg: '#00e599' }); sg.position.set(0, 12.8, 13.75); T.add(sg);
      T.smoke(-8, 18, 13.5); T.smoke(9, 30, -9); T.smoke(0, 60, 5);
    },
  });
}

// ---------- Seattle: a Space-Needle-style saucer on a tapering tripod with a glowing green halo ----------
export function neoTowerSeattle() {
  return makeNeoTower({
    w: 22, d: 22, h: 80,
    build(T) {
      const steel = color(0xd9dde0), dark = color(0x2a3236), glass = mat('s5d_glass');
      T.add(boxT(26, 0.8, 26, mat('granite'), 3)).position.set(0, 0.4, 0);
      T.cols.push([-3, 3, -3, 3, 80], [-11, 11, -11, 11, 5]);
      const leg = (a) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.6, 40, 8), steel); m.position.set(Math.cos(a) * 5, 20, Math.sin(a) * 5); m.rotation.z = -Math.cos(a) * 0.17; m.rotation.x = Math.sin(a) * 0.17; return m; };
      for (let i = 0; i < 3; i++) T.add(leg(i * 2.094));
      const core = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 3.2, 60, 12), steel); core.position.y = 30; T.add(core);
      const ringG = new THREE.Mesh(new THREE.TorusGeometry(3.5, 0.25, 6, 24), T.glow); ringG.rotation.x = Math.PI / 2; ringG.position.y = 24; T.add(ringG, { hideAt: 3 });
      const crown = new THREE.Group(); crown.position.set(0, 60, 0);
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(11, 5, 3, 24), steel); disc.position.y = 0; crown.add(disc);
      const glassBand = new THREE.Mesh(new THREE.CylinderGeometry(10.2, 10.2, 4.2, 24, 1, true), glass); glassBand.position.y = 3.1; crown.add(glassBand);
      const roof = new THREE.Mesh(new THREE.CylinderGeometry(8, 11.5, 1.6, 24), steel); roof.position.y = 5.8; crown.add(roof);
      const glowRim = new THREE.Mesh(new THREE.TorusGeometry(11.3, 0.35, 6, 40), T.glow); glowRim.rotation.x = Math.PI / 2; glowRim.position.y = 1.4; crown.add(glowRim);
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.9, 16, 8), dark); mast.position.y = 14; crown.add(mast);
      const orb = new THREE.Mesh(new THREE.SphereGeometry(1.2, 12, 8), T.glow); orb.position.y = 22.5; crown.add(orb);
      T.top(crown);
      const halo = new THREE.Mesh(new THREE.TorusGeometry(14, 0.5, 8, 44), T.glow); halo.rotation.x = Math.PI / 2; halo.userData.keep = true;
      const haloPivot = new THREE.Group(); haloPivot.position.set(0, 56, 0); haloPivot.add(halo); T.add(haloPivot, { hideAt: 4 }); T.wobble(haloPivot, 0.26, 0.8);   // wider than the crown, so rocking never clips it
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 2.2, 180, 12, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(0, 0.9, 0.6), transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
      beam.position.set(0, 170, 0); T.add(beam, { hideAt: 3 });
      // entrance pavilion in FRONT of the tripod legs (they reach about 6 m out), so no pillar pokes through the door or sign
      T.add(place(new THREE.Mesh(new THREE.BoxGeometry(8, 7.4, 2.4), color(0x0b2a22)), 0, 3.7, 7.3));
      T.add(place(new THREE.Mesh(new THREE.BoxGeometry(6, 7, 0.5), T.glow), 0, 3.6, 8.65));
      T.add(place(new THREE.Mesh(new THREE.BoxGeometry(4.6, 6.2, 0.6), color(0x04261c)), 0, 3.1, 8.7));
      const sg = sign('N E O', 16, 1.6, { bg: '#04261c', fg: '#00e599' }); sg.position.set(0, 8.4, 8.6); T.add(sg);
      T.smoke(-3, 20, 3); T.smoke(3, 40, -3); T.smoke(0, 62, 5);
    },
  });
}
