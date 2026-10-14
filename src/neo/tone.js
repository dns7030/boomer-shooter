// Calms the colours of a group of buildings: less saturation, a little darker, dimmer glow, and (optionally) lower contrast in the
// painted textures (no harsh black/white or neon-on-black patterns). Textures are copied, never changed, so other levels are unaffected.
import * as THREE from 'three';

export function makeTone({ sat = 0.6, light = 0.93, glow = 0.62, contrast = 1 } = {}) {
  const mats = new Map(), texs = new Map(), hsl = {};
  function calmTexture(t) {
    if (!t || !t.image || !t.image.getContext) return t;
    if (texs.has(t.uuid)) return texs.get(t.uuid);
    const src = t.image, c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
    const g = c.getContext('2d'); g.drawImage(src, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height), a = d.data;
    let mean = 0, n = 0; for (let i = 0; i < a.length; i += 4) { mean += 0.3 * a[i] + 0.59 * a[i + 1] + 0.11 * a[i + 2]; n++; } mean /= Math.max(1, n);
    for (let i = 0; i < a.length; i += 4) {
      const l = 0.3 * a[i] + 0.59 * a[i + 1] + 0.11 * a[i + 2];
      for (let k = 0; k < 3; k++) { let v = (l + (a[i + k] - l) * sat) * light; v = mean + (v - mean) * contrast; a[i + k] = Math.max(0, Math.min(255, v)); }
    }
    g.putImageData(d, 0, 0);
    const nt = new THREE.CanvasTexture(c); nt.wrapS = t.wrapS; nt.wrapT = t.wrapT; nt.magFilter = t.magFilter; nt.minFilter = t.minFilter;
    nt.repeat.copy(t.repeat); nt.offset.copy(t.offset); nt.colorSpace = t.colorSpace; nt.anisotropy = t.anisotropy; nt.generateMipmaps = t.generateMipmaps;
    texs.set(t.uuid, nt); return nt;
  }
  function calmMaterial(m) {
    if (mats.has(m.uuid)) return mats.get(m.uuid);
    const c = m.clone();
    const calm = (col, lf) => { col.getHSL(hsl); col.setHSL(hsl.h, hsl.s * sat, Math.min(1, hsl.l * lf)); };
    if (c.color) calm(c.color, c.isMeshBasicMaterial ? glow + 0.2 : light);
    if (c.emissive && c.emissive.getHex() !== 0) { calm(c.emissive, glow); if (c.emissiveIntensity) c.emissiveIntensity *= glow; }
    if (c.map) c.map = calmTexture(c.map);
    if (c.emissiveMap) c.emissiveMap = calmTexture(c.emissiveMap);
    mats.set(m.uuid, c); return c;
  }
  const tone = (root) => { root.traverse((o) => { if (o.isMesh && o.material && !o.isInstancedMesh) o.material = Array.isArray(o.material) ? o.material.map(calmMaterial) : calmMaterial(o.material); }); return root; };
  return (RAW) => { const out = {}; for (const [k, fn] of Object.entries(RAW)) if (typeof fn === 'function') out[k] = (...a) => tone(fn(...a)); return out; };
}
