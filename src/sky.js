// One sun for every level: a glowing disc in the sky, in the direction the sunlight comes from.
import * as THREE from 'three';
import { tex } from './textures.js';

export const SUN_DIR = new THREE.Vector3(0.32, 0.5, -0.8).normalize();

export function addSun(scene, distance, size) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex('sun'), fog: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  s.scale.set(size, size, 1);
  s.renderOrder = -9;
  scene.add(s);
  return { update(camPos) { s.position.copy(camPos).addScaledVector(SUN_DIR, distance); } };
}

export function addSunlight(scene, intensity = 1.6, color = 0xfff2dc) {
  const l = new THREE.DirectionalLight(color, intensity);
  l.position.copy(SUN_DIR).multiplyScalar(200);
  scene.add(l);
  return l;
}
