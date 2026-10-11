// First-person weapons as real (low-poly) 3D models, drawn in their own scene on top of the world,
// Quake / Duke 3D style. Seen from behind and above, so they foreshorten like Doom's weapons do.
import * as THREE from 'three';
import { RoundedBoxGeometry } from '../vendor/RoundedBoxGeometry.js';
import { makeCanvas, toTexture, mulberry } from './textures.js';

// ---------- materials ----------
function makeMaterials() {
  const scuff = toTexture(makeCanvas(64, 64, (g) => {
    const r = mulberry(3);
    g.fillStyle = '#fff'; g.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 380; i++) { g.fillStyle = `rgba(0,0,0,${0.05 + r() * 0.22})`; g.fillRect((r() * 64) | 0, (r() * 64) | 0, 1 + ((r() * 4) | 0), 1); }
  }));
  const grain = toTexture(makeCanvas(32, 128, (g) => {
    const r = mulberry(8);
    g.fillStyle = '#b0733a'; g.fillRect(0, 0, 32, 128);
    for (let i = 0; i < 70; i++) { g.fillStyle = r() < 0.5 ? 'rgba(60,28,8,0.35)' : 'rgba(255,200,130,0.18)'; g.fillRect((r() * 32) | 0, (r() * 128) | 0, 1, 6 + ((r() * 40) | 0)); }
  }));
  const S = (color, metalness, roughness, map) => new THREE.MeshStandardMaterial({ color, metalness, roughness, map: map || null });
  return {
    steel: S(0x7a828d, 0.9, 0.34, scuff),
    blued: S(0x353a43, 0.9, 0.3, scuff),
    poly: S(0x2a2d33, 0.15, 0.55, scuff),
    wood: S(0xc78443, 0.0, 0.5, grain),
    brass: S(0xd9ad45, 1.0, 0.28),
    skin: S(0xc29478, 0.0, 0.62),
    sleeve: new THREE.MeshLambertMaterial({ color: 0x4a563d }),
    cuff: new THREE.MeshLambertMaterial({ color: 0x232a1c }),
    blade: S(0xc8d0da, 1.0, 0.16),
    leather: S(0x4a2d1a, 0.0, 0.7),
    dark: new THREE.MeshBasicMaterial({ color: 0x050607 }),
  };
}

// ---------- small helpers ----------
const rbox = (w, h, d, r, m) => new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.max(0.0004, Math.min(r, w / 2 - 0.0003, h / 2 - 0.0003, d / 2 - 0.0003))), m);
const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
const at = (o, x, y, z) => { o.position.set(x, y, z); return o; };
// cylinder along -Z starting at z=0; rFar is the far (-z) radius
function zcyl(rFar, rNear, len, m, seg = 16) {
  const g = new THREE.CylinderGeometry(rFar, rNear, len, seg);
  g.rotateX(-Math.PI / 2); g.translate(0, 0, -len / 2);
  return new THREE.Mesh(g, m);
}
function capsule(r, len, m) { return new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 4, 10), m); }
// capsule lying along Z, centred
function zcap(r, len, m) { const c = capsule(r, len, m); c.rotation.x = Math.PI / 2; const g = new THREE.Group(); g.add(c); return g; }
function limb(a, b, r0, r1, m) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), len = d.length();
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, len, 14), m);
  mesh.position.copy(A).addScaledVector(d, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return mesh;
}
// forearm with sleeve and cuff, from the wrist backwards/downwards off screen
function arm(M, wrist, dir, len = 0.5, r = 0.03) {
  const g = new THREE.Group();
  const end = [wrist[0] + dir[0] * len, wrist[1] + dir[1] * len, wrist[2] + dir[2] * len];
  const cuffStart = [wrist[0] + dir[0] * 0.06, wrist[1] + dir[1] * 0.06, wrist[2] + dir[2] * 0.06];
  g.add(limb(wrist, cuffStart, r * 0.85, r * 0.9, M.skin));
  g.add(limb(cuffStart, [cuffStart[0] + dir[0] * 0.025, cuffStart[1] + dir[1] * 0.025, cuffStart[2] + dir[2] * 0.025], r * 1.12, r * 1.12, M.cuff));
  g.add(limb([cuffStart[0] + dir[0] * 0.025, cuffStart[1] + dir[1] * 0.025, cuffStart[2] + dir[2] * 0.025], end, r * 1.2, r * 1.5, M.sleeve));
  return g;
}
function flashSprite(tex) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, transparent: true }));
  s.renderOrder = 20; s.visible = false;
  return s;
}
function makeFlashTexture() {
  return toTexture(makeCanvas(128, 128, (g) => {
    const rg = g.createRadialGradient(64, 64, 2, 64, 64, 62);
    rg.addColorStop(0, 'rgba(255,250,200,1)'); rg.addColorStop(0.25, 'rgba(255,200,70,0.95)'); rg.addColorStop(0.55, 'rgba(255,90,20,0.55)'); rg.addColorStop(1, 'rgba(180,30,0,0)');
    g.fillStyle = rg; g.fillRect(0, 0, 128, 128);
    // jagged star spikes, Doom-style
    g.fillStyle = 'rgba(255,225,120,0.95)';
    const r = mulberry(5);
    g.beginPath();
    for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2, rr = i % 2 ? 20 + r() * 10 : 44 + r() * 18; g.lineTo(64 + Math.cos(a) * rr, 64 + Math.sin(a) * rr); }
    g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,230,1)'; g.beginPath(); g.arc(64, 64, 13, 0, 7); g.fill();
  }), false);
}

// ---------- models. Each: { group, muzzle(Object3D), base:{pos,rot}, update?(st) } ----------
function buildPistol(M) {
  const g = new THREE.Group();
  g.add(at(rbox(0.034, 0.034, 0.2, 0.005, M.blued), 0, 0.017, -0.1));          // slide
  g.add(at(rbox(0.013, 0.0035, 0.19, 0.001, M.steel), 0, 0.0345, -0.1));        // top flat
  for (let i = 0; i < 6; i++) for (const s of [-1, 1]) g.add(at(box(0.0025, 0.024, 0.0035, M.poly), s * 0.0172, 0.016, -0.014 - i * 0.0075));
  for (const s of [-1, 1]) { g.add(at(rbox(0.0075, 0.009, 0.009, 0.001, M.blued), s * 0.0125, 0.0385, -0.012)); g.add(at(box(0.0022, 0.0022, 0.001, M.brass), s * 0.0125, 0.0392, -0.0075)); }
  g.add(at(rbox(0.005, 0.009, 0.007, 0.001, M.blued), 0, 0.0385, -0.192)); g.add(at(box(0.0022, 0.0022, 0.001, M.brass), 0, 0.0392, -0.1885));
  g.add(at(box(0.0012, 0.012, 0.045, M.dark), 0.0175, 0.026, -0.085));           // ejection port
  g.add(at(zcyl(0.0075, 0.0075, 0.014, M.steel), 0, 0.013, -0.2));              // barrel muzzle
  g.add(at(new THREE.Mesh(new THREE.CircleGeometry(0.0048, 12), M.dark), 0, 0.013, -0.2145));
  g.add(at(rbox(0.032, 0.024, 0.17, 0.004, M.poly), 0, -0.012, -0.09));          // frame
  g.add(at(box(0.004, 0.012, 0.055, M.poly), 0, -0.03, -0.12));                   // trigger guard
  g.add(at(box(0.004, 0.012, 0.004, M.poly), 0, -0.022, -0.095));
  const grip = rbox(0.036, 0.1, 0.052, 0.006, M.poly); grip.position.set(0, -0.078, -0.012); grip.rotation.x = -0.2; g.add(grip);
  // right hand: back of hand + knuckles under/behind the slide, thumb left, trigger finger right
  const back = rbox(0.058, 0.044, 0.085, 0.015, M.skin); back.position.set(0.004, -0.05, 0.026); back.rotation.x = -0.1; g.add(back);
  for (let i = 0; i < 4; i++) g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.0085, 10, 8), M.skin), -0.02 + i * 0.0135, -0.03, -0.012));
  const th = zcap(0.0095, 0.05, M.skin); th.position.set(-0.029, -0.004, -0.032); th.rotation.y = 0.12; g.add(th);
  const tf = zcap(0.0085, 0.05, M.skin); tf.position.set(0.026, -0.006, -0.045); tf.rotation.y = -0.1; g.add(tf);
  g.add(arm(M, [0.006, -0.065, 0.06], [0.03, -0.28, 0.96], 0.5, 0.03));
  const muzzle = new THREE.Object3D(); muzzle.position.set(0, 0.014, -0.225); g.add(muzzle);
  return { group: g, muzzle, flash: 0.12, pos: [0.05, -0.14, -0.3], rot: [0.4, 0.07, 0], recoil: 1 };
}

function buildShotgun(M) {
  const g = new THREE.Group();
  g.add(at(rbox(0.05, 0.062, 0.22, 0.008, M.blued), 0, 0.0, -0.11));            // receiver
  g.add(at(box(0.0012, 0.014, 0.05, M.dark), 0.0255, 0.008, -0.09));              // ejection port
  g.add(at(rbox(0.014, 0.003, 0.2, 0.001, M.steel), 0, 0.0315, -0.11));
  const barrel = zcyl(0.0165, 0.0175, 0.46, M.steel, 18); barrel.position.set(0, 0.014, -0.22); g.add(barrel);
  const mag = zcyl(0.0135, 0.0135, 0.34, M.blued, 14); mag.position.set(0, -0.02, -0.22); g.add(mag);
  g.add(at(rbox(0.006, 0.003, 0.44, 0.001, M.steel), 0, 0.0335, -0.44));         // vent rib
  for (const z of [-0.5, -0.66]) g.add(at(zcyl(0.02, 0.02, 0.012, M.poly), 0, 0.0, z)); // barrel clamps
  g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.0035, 8, 6), M.brass), 0, 0.034, -0.675)); // bead sight
  g.add(at(new THREE.Mesh(new THREE.CircleGeometry(0.0155, 14), M.dark), 0, 0.014, -0.6805));
  // pump forearm (slides) + left hand
  const pump = new THREE.Group(); pump.position.set(0, -0.014, -0.34);
  pump.add(rbox(0.056, 0.05, 0.19, 0.014, M.wood));
  for (let i = 0; i < 6; i++) pump.add(at(box(0.058, 0.0015, 0.004, M.poly), 0, 0.0, -0.075 + i * 0.0125 + 0.0));
  for (let i = 0; i < 4; i++) pump.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.0105, 10, 8), M.skin), 0.014 + i * 0.001, 0.027, -0.045 + i * 0.026)); // knuckles over the top
  const lthumb = zcap(0.0105, 0.06, M.skin); lthumb.position.set(-0.036, 0.012, -0.03); lthumb.rotation.y = 0.2; pump.add(lthumb);
  const lback = rbox(0.055, 0.032, 0.09, 0.012, M.skin); lback.position.set(0.0, 0.032, 0.02); pump.add(lback);
  pump.add(arm(M, [-0.01, 0.03, 0.06], [-0.5, -0.4, 0.77], 0.55, 0.024));
  g.add(pump);
  // right hand on the grip + trigger guard
  const grip = rbox(0.04, 0.1, 0.05, 0.01, M.wood); grip.position.set(0.0, -0.075, 0.02); grip.rotation.x = -0.3; g.add(grip);
  g.add(at(box(0.004, 0.012, 0.05, M.poly), 0, -0.04, -0.03));
  const rback = rbox(0.06, 0.046, 0.09, 0.016, M.skin); rback.position.set(0.006, -0.065, 0.075); g.add(rback);
  for (let i = 0; i < 4; i++) g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.0088, 10, 8), M.skin), -0.02 + i * 0.0135, -0.044, 0.02));
  const rthumb = zcap(0.0098, 0.055, M.skin); rthumb.position.set(-0.03, 0.026, 0.0); g.add(rthumb);
  g.add(arm(M, [0.012, -0.085, 0.12], [0.2, -0.35, 0.91], 0.5, 0.026));
  const muzzle = new THREE.Object3D(); muzzle.position.set(0, 0.014, -0.7); g.add(muzzle);
  return { group: g, muzzle, flash: 0.26, pos: [0.035, -0.14, -0.3], rot: [0.3, 0.04, 0], recoil: 2.2, pump, pumpZ: -0.34 };
}

function buildChaingun(M) {
  const g = new THREE.Group();
  g.add(at(rbox(0.11, 0.075, 0.24, 0.012, M.blued), 0, -0.05, -0.12));             // housing (below the barrel axis)
  g.add(at(rbox(0.07, 0.01, 0.2, 0.004, M.steel), 0, -0.0095, -0.12));
  g.add(at(rbox(0.04, 0.018, 0.1, 0.004, M.poly), 0, 0.012, -0.09));
  const spinner = new THREE.Group(); spinner.position.set(0, 0.0, -0.24); g.add(spinner);
  for (let k = 0; k < 3; k++) {
    const a = (k * Math.PI * 2) / 3 + Math.PI / 6;
    const b = zcyl(0.011, 0.0125, 0.5, M.steel, 14); b.position.set(Math.cos(a) * 0.027, Math.sin(a) * 0.027, 0); spinner.add(b);
    const tip = at(new THREE.Mesh(new THREE.CircleGeometry(0.0085, 10), M.dark), Math.cos(a) * 0.027, Math.sin(a) * 0.027, -0.5005); spinner.add(tip);
  }
  for (const z of [-0.12, -0.3, -0.48]) spinner.add(at(zcyl(0.046, 0.046, 0.014, M.poly, 18), 0, 0, z));
  const hub = zcyl(0.02, 0.02, 0.5, M.poly, 12); spinner.add(hub);
  // ammo belt feeding in from the left
  const belt = new THREE.Group();
  for (let i = 0; i < 9; i++) {
    const c = zcyl(0.007, 0.007, 0.034, M.brass, 8); c.rotation.set(0, Math.PI / 2, 0); c.position.set(-0.06 - i * 0.011, -0.005 - i * 0.016, -0.08 - Math.sin(i * 0.5) * 0.01);
    belt.add(c);
    const l = box(0.012, 0.004, 0.036, M.poly); l.position.set(-0.06 - i * 0.011, -0.005 - i * 0.016, -0.08); belt.add(l);
  }
  g.add(belt);
  // hand under the housing (palm up from below, fingers wrapped)
  g.add(at(rbox(0.07, 0.05, 0.1, 0.018, M.skin), 0.01, -0.105, 0.0));
  for (let i = 0; i < 4; i++) g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.0105, 10, 8), M.skin), -0.018 + i * 0.0145, -0.08, -0.05));
  const lt = zcap(0.011, 0.055, M.skin); lt.position.set(-0.052, -0.06, -0.03); g.add(lt);
  g.add(arm(M, [0.01, -0.115, 0.04], [0.05, -0.3, 0.95], 0.55, 0.03));
  const muzzle = new THREE.Object3D(); muzzle.position.set(0, 0, -0.76); g.add(muzzle);
  return { group: g, muzzle, flash: 0.2, pos: [0.0, -0.13, -0.38], rot: [0.28, 0.0, 0], recoil: 0.7, spinner };
}

function buildSabre(M) {
  const g = new THREE.Group();
  // blade: extruded curved profile, axis along +Y
  const sh = new THREE.Shape();
  sh.moveTo(-0.012, 0); sh.lineTo(-0.013, 0.2); sh.quadraticCurveTo(-0.011, 0.5, 0.045, 0.78); sh.lineTo(0.052, 0.8); sh.quadraticCurveTo(0.016, 0.5, 0.016, 0.2); sh.lineTo(0.014, 0);
  sh.lineTo(-0.012, 0);
  const bg = new THREE.ExtrudeGeometry(sh, { depth: 0.006, bevelEnabled: true, bevelThickness: 0.0015, bevelSize: 0.0015, bevelSegments: 1 });
  bg.translate(0, 0, -0.003);
  const blade = new THREE.Mesh(bg, M.blade); blade.position.y = 0.02; g.add(blade);
  g.add(at(box(0.0015, 0.5, 0.0072, M.steel), 0.0015, 0.28, 0));                   // fuller
  // guard (brass) + grip + pommel
  g.add(at(rbox(0.1, 0.012, 0.022, 0.004, M.brass), 0.0, 0.016, 0));
  g.add(at(rbox(0.012, 0.03, 0.026, 0.004, M.brass), -0.05, 0.03, 0));
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.0145, 0.0125, 0.12, 12), M.leather); grip.position.y = -0.05; g.add(grip);
  for (let i = 0; i < 8; i++) g.add(at(new THREE.Mesh(new THREE.TorusGeometry(0.0138, 0.0013, 4, 12), M.dark), 0, -0.1 + i * 0.0135, 0)).rotation.x = Math.PI / 2;
  g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.0165, 10, 8), M.brass), 0, -0.118, 0));
  // fist wrapped round the grip
  const fist = rbox(0.042, 0.065, 0.048, 0.015, M.skin); fist.position.set(0.0, -0.05, 0.005); g.add(fist);
  for (let i = 0; i < 4; i++) { const f = capsule(0.0085, 0.03, M.skin); f.rotation.z = Math.PI / 2; f.position.set(0.0, -0.025 - i * 0.0135, -0.02); g.add(f); }
  const th = capsule(0.0105, 0.04, M.skin); th.position.set(-0.012, -0.012, -0.015); th.rotation.x = 0.4; g.add(th);
  g.add(arm(M, [0.0, -0.1, 0.01], [0.15, -0.55, 0.82], 0.6, 0.028));
  g.scale.setScalar(0.72);
  const muzzle = new THREE.Object3D(); g.add(muzzle);
  return { group: g, muzzle, flash: 0, pos: [0.12, -0.17, -0.5], rot: [-0.9, 0.25, -0.35], recoil: 0, sabre: true };
}

export class WeaponView {
  constructor(renderer) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(58, 16 / 9, 0.01, 6);
    // cool sky above, warm sunset band at the horizon, dark ground: metal picks up believable reflections
    const envTex = toTexture(makeCanvas(256, 128, (g) => {
      const gr = g.createLinearGradient(0, 0, 0, 128);
      gr.addColorStop(0, '#9fb0d0'); gr.addColorStop(0.42, '#c9c0c8'); gr.addColorStop(0.5, '#f0b078'); gr.addColorStop(0.56, '#6a5448'); gr.addColorStop(1, '#1c1815');
      g.fillStyle = gr; g.fillRect(0, 0, 256, 128);
      g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(40, 20, 60, 10); g.fillRect(160, 34, 50, 8);
    }), false);
    envTex.mapping = THREE.EquirectangularReflectionMapping;
    const pm = new THREE.PMREMGenerator(renderer);
    this.env = pm.fromEquirectangular(envTex).texture;
    this.scene.environment = this.env;
    this.scene.add(this.camera);
    this.scene.add(new THREE.AmbientLight(0xa08c80, 0.5));
    const key = new THREE.DirectionalLight(0xffcf9a, 2.2); key.position.set(-0.6, 1, 0.7); this.scene.add(key);
    const rim = new THREE.DirectionalLight(0x7f8fc0, 0.9); rim.position.set(0.8, 0.3, -0.5); this.scene.add(rim);
    this.light = new THREE.PointLight(0xffa040, 0, 1.2); this.scene.add(this.light);
    const M = makeMaterials();
    const ft = makeFlashTexture();
    this.models = { pistol: buildPistol(M), shotgun: buildShotgun(M), chaingun: buildChaingun(M), sabre: buildSabre(M) };
    for (const [id, m] of Object.entries(this.models)) {
      m.root = new THREE.Group(); m.root.add(m.group); m.root.visible = false;
      if (m.flash) { m.sprite = flashSprite(ft); m.sprite.scale.setScalar(m.flash); m.muzzle.add(m.sprite); }
      this.camera.add(m.root);
      m.id = id;
    }
    for (const mm of Object.values(M)) if (mm.isMeshStandardMaterial) { mm.envMap = this.env; mm.envMapIntensity = mm.metalness > 0.5 ? 1.25 : 0.3; }
    this.current = 'pistol';
  }
  resize(aspect) { this.camera.aspect = aspect; this.camera.updateProjectionMatrix(); }

  // st: { id, bob, bobAmp, flash, swing, pump, spin, lower }
  update(st) {
    const cur = this.models[st.id];
    for (const m of Object.values(this.models)) m.root.visible = m === cur;
    const r = cur.root, [px, py, pz] = cur.pos, [rx, ry, rz] = cur.rot;
    const bx = Math.sin(st.bob) * 0.007 * st.bobAmp, by = Math.abs(Math.cos(st.bob)) * 0.006 * st.bobAmp;
    const k = st.flash * cur.recoil;
    r.position.set(px + bx, py - by - st.lower * 0.3, pz + k * 0.03);
    r.rotation.set(rx + k * 0.12 + st.lower * 0.5, ry, rz);
    if (cur.sabre) {
      const s = st.swing;
      if (s >= 0) {
        const e = 1 - (1 - s) * (1 - s);
        r.position.set(px + 0.1 - e * 0.35, py + Math.sin(s * Math.PI) * 0.04 - st.lower * 0.3, pz - Math.sin(s * Math.PI) * 0.08);
        r.rotation.set(rx + Math.sin(s * Math.PI) * 0.4, ry - e * 1.5, rz + e * 0.9);
      }
    }
    if (cur.pump) cur.pump.position.z = cur.pumpZ + st.pump * 0.075;
    if (cur.spinner) cur.spinner.rotation.z = st.spin;
    if (cur.sprite) {
      cur.sprite.visible = st.flash > 0.05;
      cur.sprite.material.opacity = Math.min(1, st.flash * 1.4);
      cur.sprite.material.rotation = (st.shotN * 1.7) % 6.28;
      cur.sprite.scale.setScalar(cur.flash * (0.75 + st.flash * 0.5));
    }
    if (cur.sprite && st.flash > 0.05) {
      cur.muzzle.getWorldPosition(this.light.position);
      this.camera.worldToLocal(this.light.position);
      this.light.intensity = st.flash * 2.2;
    } else this.light.intensity = 0;
  }
}
