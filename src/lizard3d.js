// A 3D lizard (built from primitives, posed in code) that is rendered at startup into 8-direction sprite sheets.
// The game then shows the right frame for the angle you view the lizard from, Doom-style, but with real 3D shading.
import * as THREE from 'three';
import { makeCanvas, toTexture, mulberry } from './textures.js';

export const FRAME = 128;                 // px per frame
export const ANGLES = 8;
// pose ids = rows in the atlas
export const POSE = { idle: 0, walk0: 1, walk1: 2, walk2: 3, walk3: 4, windup: 5, strike: 6, pain: 7, die0: 8, die1: 9, die2: 10, die3: 11, die4: 12 };
export const POSE_COUNT = 13;
export const SPRITE_SIZE = 2.8;           // world metres covered by one frame
export const SPRITE_FOOT = 0.08;           // metres of margin below the feet inside the frame

const PALETTE = {
  grunt: { skin: 0x76874c, belly: 0xc2b98c, dark: 0x3a4529, eye: 0xffc820, claw: 0xe0dac0 },
  spitter: { skin: 0x56777e, belly: 0xb6c0b2, dark: 0x2a3c44, eye: 0xff8a2a, claw: 0xd8dcd0 },
};

function scaleTexture(seed) {
  const r = mulberry(seed);
  return toTexture(makeCanvas(128, 128, (g) => {
    g.fillStyle = '#8a8a8a'; g.fillRect(0, 0, 128, 128);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const cx = x * 8 + (y % 2 ? 4 : 0) + (r() - 0.5) * 2, cy = y * 8 + (r() - 0.5) * 2, rad = 3.4 + r() * 1.2;
      const gr = g.createRadialGradient(cx, cy, 0.5, cx, cy, rad);
      gr.addColorStop(0, '#d8d8d8'); gr.addColorStop(0.7, '#9a9a9a'); gr.addColorStop(1, '#5a5a5a');
      g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, rad, 0, 7); g.fill();
    }
  }));
}

export function buildLizard(kind) {
  const P = PALETTE[kind], sp = kind === 'spitter';
  const tex = scaleTexture(sp ? 3 : 2);
  const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0.05, ...extra });
  const M = {
    skin: std(P.skin, { map: tex, bumpMap: tex, bumpScale: 1.2 }),
    belly: std(P.belly, { map: tex, bumpMap: tex, bumpScale: 0.8 }),
    dark: std(P.dark, { map: tex }),
    claw: std(P.claw, { roughness: 0.4 }),
    tooth: std(0xe8e4d0, { roughness: 0.35 }),
    mouth: std(0x5a1018, { roughness: 0.5 }),
    eye: new THREE.MeshBasicMaterial({ color: P.eye }),
    pupil: new THREE.MeshBasicMaterial({ color: 0x000000 }),
    armor: std(0x2a2e36, { metalness: 0.7, roughness: 0.4 }),
    glow: new THREE.MeshBasicMaterial({ color: 0x58e078 }),
  };
  const ell = (rx, ry, rz, m) => { const o = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 12), m); o.scale.set(rx, ry, rz); return o; };
  const cone = (r, h, m, seg = 6) => new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), m);
  const at = (o, x, y, z) => { o.position.set(x, y, z); return o; };
  const hang = (len, r, m) => { const g = new THREE.Group(); const c = new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(0.01, len - 2 * r), 4, 10), m); c.position.y = -len / 2; g.add(c); return g; };
  const claw = (m, len = 0.12) => { const c = cone(0.022, len, m, 5); c.rotation.x = Math.PI / 2; return c; };

  const root = new THREE.Group();
  const pelvis = new THREE.Group(); pelvis.position.y = 1.02; root.add(pelvis);
  pelvis.add(ell(0.3, 0.24, 0.32, M.skin));

  // torso
  const torso = new THREE.Group(); torso.position.set(0, 0.1, 0.02); pelvis.add(torso);
  torso.add(at(ell(0.42, 0.4, 0.36, M.skin), 0, 0.36, 0.04));
  torso.add(at(ell(0.3, 0.3, 0.12, M.belly), 0, 0.3, 0.3));
  for (let i = 0; i < 4; i++) torso.add(at(ell(0.26 - i * 0.015, 0.045, 0.06, M.dark), 0, 0.14 + i * 0.12, 0.38 - i * 0.015)); // belly plate seams
  for (let i = 0; i < 6; i++) torso.add(at(cone(0.06 - i * 0.004, 0.2 - i * 0.012, M.dark), 0, 0.72 - i * 0.1, -0.22 - i * 0.03)).rotation.x = -0.5; // dorsal spikes
  // neck + head
  const neck = new THREE.Group(); neck.position.set(0, 0.62, 0.18); torso.add(neck);
  const neckMesh = ell(0.17, 0.2, 0.2, M.skin); neckMesh.position.set(0, 0.06, 0.06); neck.add(neckMesh);
  const head = new THREE.Group(); head.position.set(0, 0.22, 0.14); head.scale.setScalar(1.28); neck.add(head);
  head.add(at(ell(0.17, 0.15, 0.2, M.skin), 0, 0, 0));
  head.add(at(ell(0.115, 0.075, 0.25, M.skin), 0, -0.035, 0.22));            // snout
  for (const sd of [-1, 1]) {
    head.add(at(ell(0.05, 0.03, 0.065, M.dark), sd * 0.1, 0.1, 0.1));          // brow ridge
    const eye = at(new THREE.Mesh(new THREE.SphereGeometry(0.044, 10, 8), M.eye), sd * 0.105, 0.065, 0.13); head.add(eye);
    head.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.05, 0.01), M.pupil), sd * 0.108, 0.065, 0.163));
    head.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.011, 6, 5), M.pupil), sd * 0.04, 0.02, 0.46)); // nostril
    for (let t = 0; t < 4; t++) { const th = cone(0.012, 0.055, M.tooth, 4); th.rotation.x = Math.PI; head.add(at(th, sd * (0.075 - t * 0.004), -0.085, 0.14 + t * 0.07)); }
  }
  for (let i = 0; i < 3; i++) head.add(at(cone(0.035, 0.16 - i * 0.02, M.dark), 0, 0.13 - i * 0.02, -0.08 - i * 0.07)).rotation.x = -1.0;   // crest
  if (!sp) for (const sd of [-1, 1]) { const h = cone(0.03, 0.2, M.claw, 5); h.rotation.set(-1.2, 0, sd * -0.5); head.add(at(h, sd * 0.16, 0.08, -0.08)); }   // horns
  const jaw = new THREE.Group(); jaw.position.set(0, -0.085, 0.05); head.add(jaw);
  jaw.add(at(ell(0.085, 0.04, 0.22, M.skin), 0, -0.02, 0.17));
  jaw.add(at(ell(0.06, 0.02, 0.17, M.mouth), 0, 0.012, 0.17));                 // red mouth floor
  for (const sd of [-1, 1]) for (let t = 0; t < 4; t++) { const th = cone(0.011, 0.045, M.tooth, 4); jaw.add(at(th, sd * 0.065, 0.03, 0.1 + t * 0.07)); }
  if (sp) {  // neck frill
    const frill = new THREE.Group(); frill.position.set(0, 0.02, -0.05); head.add(frill);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.1, 0.03, 16, 1), std(0x32282e)); disc.rotation.x = Math.PI / 2; disc.rotation.z = 0; frill.add(disc);
    for (let i = 0; i < 9; i++) { const a = -1.4 + (i / 8) * 2.8; const sp2 = cone(0.025, 0.2, M.claw, 4); sp2.position.set(Math.sin(a) * 0.36, Math.cos(a) * 0.28 + 0.0, -0.03); sp2.rotation.z = -a; frill.add(sp2); }
    frill.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.06, 0.035, 14), std(0x7a3a30)), 0, 0, -0.006)).rotation.x = Math.PI / 2;
  }

  // arms
  const arms = [-1, 1].map((sd) => {
    const sh = new THREE.Group(); sh.position.set(sd * 0.46, 0.55, 0.02); torso.add(sh);
    sh.add(ell(0.15, 0.15, 0.15, M.skin));
    const up = hang(0.42, 0.075, M.skin); sh.add(up);
    const fore = hang(0.42, 0.06, M.skin); fore.position.y = -0.42; up.add(fore);
    const hand = new THREE.Group(); hand.position.y = -0.44; fore.add(hand);
    hand.add(ell(0.07, 0.07, 0.06, M.skin));
    for (let i = 0; i < 3; i++) { const c = claw(M.claw, 0.15); c.rotation.x = 1.9; hand.add(at(c, (i - 1) * 0.045, -0.1, 0.03)); }
    return { sh, up, fore, hand };
  });
  // legs (digitigrade: thigh forward, shin back, foot flat)
  const legs = [-1, 1].map((sd) => {
    const hip = new THREE.Group(); hip.position.set(sd * 0.25, -0.02, 0); pelvis.add(hip);
    hip.add(at(ell(0.17, 0.2, 0.2, M.skin), 0, -0.12, 0.02));
    const thigh = hang(0.5, 0.12, M.skin); hip.add(thigh);
    const shin = hang(0.52, 0.085, M.skin); shin.position.y = -0.5; thigh.add(shin);
    const foot = new THREE.Group(); foot.position.y = -0.52; shin.add(foot);
    foot.add(at(ell(0.09, 0.05, 0.16, M.dark), 0, -0.03, 0.08));
    for (let i = 0; i < 3; i++) foot.add(at(claw(M.claw, 0.13), (i - 1) * 0.06, -0.04, 0.24));
    return { hip, thigh, shin, foot };
  });
  // tail: chain of segments
  const tail = []; { let parent = pelvis, z = -0.22, r = 0.17;
    for (let i = 0; i < 5; i++) {
      const seg = new THREE.Group(); seg.position.set(0, -0.02, z); parent.add(seg);
      const len = 0.34, m = ell(r, r * 0.9, len * 0.62, M.skin); m.position.z = -len * 0.45; seg.add(m);
      tail.push(seg); parent = seg; z = -len; r *= 0.78;
    }
  }

  // spitter extras: armour plate and a plasma gun in the right hand
  let gun = null;
  if (sp) {
    torso.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.46, 0.14), M.armor), 0, 0.38, 0.34));
    torso.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.04, 0.02), M.glow), 0, 0.46, 0.42));
    torso.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.04, 0.02), M.glow), 0, 0.3, 0.42));
    for (const a of arms) a.sh.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 0.24), M.armor), 0, 0.14, 0));
    gun = new THREE.Group(); gun.position.set(0, -0.02, 0.1); arms[1].hand.add(gun);
    gun.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.5), M.armor), 0, 0, 0.26));
    gun.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.3), M.dark), 0, 0.02, 0.62));
    gun.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), M.glow), 0, 0.02, 0.8));
  }
  return { root, pelvis, torso, neck, head, jaw, arms, legs, tail, gun, kind };
}

// ---------- poses ----------
const rest = () => ({
  lean: 0.32, headPitch: -0.12, headYaw: 0, jaw: 0.06, rootY: 0, rootZ: 0, tailYaw: 0, tailPitch: 0.1,
  armUp: [-0.3, -0.3], armOut: [0.12, -0.12], foreBend: [-0.8, -0.8],
  thigh: [-0.75, -0.75], shin: [1.3, 1.3], fall: 0, fallBack: 0,
});
function poseFor(kind, id) {
  const p = rest();
  const walk = (ph) => {
    const s = Math.sin(ph * Math.PI * 2), c = Math.cos(ph * Math.PI * 2);
    p.thigh = [-0.75 + 0.55 * s, -0.75 - 0.55 * s];
    p.shin = [1.3 + 0.7 * Math.max(0, s), 1.3 + 0.7 * Math.max(0, -s)];
    p.armUp = [-0.3 - 0.5 * -s, -0.3 - 0.5 * s];
    p.foreBend = [-0.8 - 0.3 * Math.max(0, -s), -0.8 - 0.3 * Math.max(0, s)];
    p.rootY = 0.05 * Math.abs(c); p.lean = 0.38; p.tailYaw = 0.25 * s; p.headYaw = -0.08 * s;
  };
  if (id >= POSE.walk0 && id <= POSE.walk3) walk((id - POSE.walk0) / 4);
  else if (id === POSE.windup) {
    if (kind === 'spitter') { p.lean = 0.12; p.armUp[1] = -1.55; p.foreBend[1] = -0.25; p.armOut[1] = -0.15; p.jaw = 0.3; p.headPitch = 0.05; }
    else { p.lean = -0.12; p.armUp = [-2.3, -2.3]; p.foreBend = [-0.5, -0.5]; p.armOut = [0.5, -0.5]; p.jaw = 0.85; p.headPitch = -0.4; p.rootZ = -0.1; }
  } else if (id === POSE.strike) {
    if (kind === 'spitter') { p.lean = -0.08; p.armUp[1] = -1.7; p.foreBend[1] = -0.1; p.jaw = 0.45; p.headPitch = -0.2; p.rootZ = -0.06; }
    else { p.lean = 0.78; p.armUp = [-1.25, -1.25]; p.foreBend = [-0.35, -0.35]; p.armOut = [0.15, -0.15]; p.jaw = 0.65; p.headPitch = 0.25; p.rootZ = 0.2; p.thigh = [-1.0, -1.0]; p.shin = [1.5, 1.5]; }
  } else if (id === POSE.pain) {
    p.lean = -0.32; p.headPitch = -0.6; p.jaw = 0.7; p.armUp = [-0.9, -0.9]; p.armOut = [0.95, -0.95]; p.foreBend = [-0.4, -0.4]; p.tailPitch = 0.4; p.rootZ = -0.08;
  } else if (id >= POSE.die0) {
    const t = [0.2, 0.42, 0.66, 0.88, 1][id - POSE.die0];
    p.lean = -0.1 - 0.4 * t; p.headPitch = -0.7 * t; p.jaw = 0.4 + 0.3 * t; p.armUp = [-0.4 + 0.3 * t, -0.4 + 0.3 * t]; p.armOut = [0.6 * t + 0.1, -0.6 * t - 0.1];
    p.foreBend = [-0.4, -0.4]; p.thigh = [-0.75 - 0.5 * t, -0.75 - 0.35 * t]; p.shin = [1.3 + 0.5 * t, 1.3 + 0.8 * t]; p.tailPitch = 0.2 + 0.3 * t;
    p.fall = t * 1.5; p.fallBack = t * 0.35;
  }
  return p;
}
export function applyPose(model, id) {
  const p = poseFor(model.kind, id), { root, pelvis, torso, neck, head, jaw, arms, legs, tail } = model;
  root.rotation.set(0, 0, 0); root.position.set(0, 0, 0);
  pelvis.position.set(0, 1.02 + p.rootY, p.rootZ);
  torso.rotation.x = p.lean;
  neck.rotation.x = p.headPitch * 0.4; head.rotation.set(p.headPitch * 0.6, p.headYaw, 0);
  jaw.rotation.x = p.jaw;
  arms.forEach((a, i) => { a.sh.rotation.set(p.armUp[i], 0, p.armOut[i]); a.fore.rotation.x = p.foreBend[i]; });
  legs.forEach((l, i) => { l.thigh.rotation.x = p.thigh[i]; l.shin.rotation.x = p.shin[i]; l.foot.rotation.x = -(p.thigh[i] + p.shin[i]); });
  tail.forEach((s, i) => { s.rotation.y = p.tailYaw * (0.5 + i * 0.35); s.rotation.x = p.tailPitch * 0.35; });
  if (p.fall) {
    root.rotation.z = p.fall; root.rotation.x = -p.fallBack;               // topple sideways (and a bit back) about the feet
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root), c = box.getCenter(new THREE.Vector3());
    root.position.y -= box.min.y - 0.02;                                    // rest on the ground
    if (p.fall > 1) { root.position.x -= c.x * 0.8; root.position.z -= c.z * 0.8; }
  }
}

// ---------- atlas rendering ----------
export function renderLizardAtlases(renderer) {
  const out = {};
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xfff6e8, 0x667058, 1.7));
  const key = new THREE.DirectionalLight(0xfff0dc, 3.2); key.position.set(-3, 5, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0x9ab8ff, 0.8); rim.position.set(4, 2, -4); scene.add(rim);
  const half = SPRITE_SIZE / 2, cy = -SPRITE_FOOT + half;
  const cam = new THREE.OrthographicCamera(-half, half, half, -half, 0.1, 40);
  const pitch = 0.17, dist = 12;
  cam.position.set(0, cy + dist * Math.sin(pitch), dist * Math.cos(pitch)); cam.lookAt(0, cy, 0);
  const W = FRAME * ANGLES, H = FRAME * POSE_COUNT;
  const prevRT = renderer.getRenderTarget(), prevClear = new THREE.Color(), prevAlpha = renderer.getClearAlpha(), prevAuto = renderer.autoClear;
  renderer.getClearColor(prevClear); renderer.autoClear = false;
  for (const kind of ['grunt', 'spitter']) {
    const model = buildLizard(kind); scene.add(model.root);
    const rt = new THREE.WebGLRenderTarget(W, H, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, generateMipmaps: false, samples: 0 });
    rt.texture.colorSpace = THREE.SRGBColorSpace;
    renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear();
    rt.scissorTest = true;
    for (let pose = 0; pose < POSE_COUNT; pose++) {
      applyPose(model, pose);
      for (let k = 0; k < ANGLES; k++) {
        model.root.rotation.y = (k * Math.PI * 2) / ANGLES;
        model.root.updateMatrixWorld(true);
        rt.viewport.set(k * FRAME, pose * FRAME, FRAME, FRAME); rt.scissor.set(k * FRAME, pose * FRAME, FRAME, FRAME);
        renderer.setRenderTarget(rt); renderer.clear(); renderer.render(scene, cam);
      }
    }
    scene.remove(model.root);
    out[kind] = { texture: rt.texture, target: rt };
  }
  renderer.setRenderTarget(prevRT); renderer.setClearColor(prevClear, prevAlpha); renderer.autoClear = prevAuto;
  return out;
}

// uv rectangle of a frame: [u0, v0, u1, v1]
export function frameUV(pose, angle) {
  return [angle / ANGLES, pose / POSE_COUNT, (angle + 1) / ANGLES, (pose + 1) / POSE_COUNT];
}
