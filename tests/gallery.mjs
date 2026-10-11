// Gallery of building builders: puts each one on flat ground and screenshots it from 3 angles.
// usage: node tests/gallery.mjs <module e.g. src/buildings4a.js> <outdir> [exportName[:json-opts] ...]   (no names = every export that returns a THREE.Group)
import { launch } from './shot.mjs';
const [mod, out = '/tmp', ...names] = process.argv.slice(2);
const { page, browser, srv, errors } = await launch();
const list = await page.evaluate(async ({ mod, names }) => {
  const g = window.__game; g.loadLevel(0); g.begin(); document.getElementById('overlay').style.display = 'none'; g.wave.phase = 'idle'; g.state = 'frozen';
  g.scene.fog = null; g.scene.children.filter((o) => o.isMesh || o.isGroup || o.isInstancedMesh).forEach((o) => { if (o.parent === g.scene && !o.isSprite) o.visible = false; });
  const M = await import('/' + mod);
  const all = names.length ? names : Object.keys(M).filter((k) => typeof M[k] === 'function');
  window.__gal = { M, all }; return all;
}, { mod, names });
const fs = await import('fs');
for (const spec of list) {
  const [nm, opts] = spec.split(':');
  const r = await page.evaluate(async ({ nm, opts }) => {
    const { M } = window.__gal, g = window.__game, THREE = await import('three');
    let b; try { b = M[nm](opts ? JSON.parse(opts) : undefined); } catch (e) { return { err: String(e.stack || e) }; }
    if (!b || !b.isObject3D) return { err: 'not an Object3D' };
    if (window.__galObj) g.scene.remove(window.__galObj);
    g.scene.add(b); window.__galObj = b; b.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(b), sz = box.getSize(new THREE.Vector3());
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshBasicMaterial({ color: 0x6f8a4e })); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; g.scene.add(ground);
    let tris = 0; b.traverse((o) => { if (o.isMesh) tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; });
    return { size: [sz.x, sz.y, sz.z].map((v) => +v.toFixed(1)), ud: b.userData && { w: b.userData.w, d: b.userData.d, h: b.userData.h, cols: b.userData.cols && b.userData.cols.length }, tris: Math.round(tris), min: box.min.toArray().map((v) => +v.toFixed(1)) };
  }, { nm, opts });
  console.log(spec, JSON.stringify(r));
  if (r.err) continue;
  const R = Math.max(...r.size) * 0.9 + 8, H = Math.min(r.size[1] * 0.4, 14);
  for (const [tag, ang] of [['front', 0], ['side', 0.9], ['back', 2.6]]) {
    await page.evaluate(({ R, H, ang, hh }) => {
      const g = window.__game, p = g.p; const a = ang; p.x = Math.sin(a) * R; p.z = Math.cos(a) * R; p.y = 0; p.yaw = a; p.pitch = Math.atan2(-(H - 1.7) + hh, R) ;
      g.camera.position.set(p.x, H, p.z); g.camera.rotation.set(-0.06, a, 0); g.camera.updateMatrixWorld(true);
      g.p.y = H - 1.7; g.render();
    }, { R, H, ang, hh: 0 });
    await page.screenshot({ path: `${out}/${nm}-${tag}.png` });
  }
}
console.log(errors.filter((e) => !/willReadFrequently/.test(e)).join('\n') || 'no console errors');
await browser.close(); srv.close();
