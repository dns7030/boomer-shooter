// Post-processing: soft bloom on bright things (flashes, fire, sun), light colour grading and a vignette.
import * as THREE from 'three';
import { EffectComposer } from '../vendor/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '../vendor/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from '../vendor/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from '../vendor/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../vendor/jsm/postprocessing/OutputPass.js';

const GradeShader = {
  uniforms: { tDiffuse: { value: null }, uVignette: { value: 0.32 }, uSat: { value: 1.08 }, uContrast: { value: 0.22 }, uLift: { value: 0.86 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uVignette, uSat, uContrast, uLift; varying vec2 vUv;
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      c.rgb = pow(max(c.rgb, vec3(0.0)), vec3(uLift));                      // lift the mid-tones so streets aren't murky next to the bright sky
      float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
      c.rgb = mix(vec3(l), c.rgb, uSat);                                   // a touch more colour
      vec3 s = clamp(c.rgb, 0.0, 1.0); s = s * s * (3.0 - 2.0 * s);       // gentle S-curve contrast
      c.rgb = mix(c.rgb, s, uContrast);
      c.rgb *= mix(vec3(0.97, 0.99, 1.04), vec3(1.04, 1.0, 0.95), clamp(l, 0.0, 1.0)); // cool shadows, warm highlights
      vec2 q = vUv - 0.5; float v = 1.0 - uVignette * smoothstep(0.25, 0.95, dot(q, q) * 2.0);
      c.rgb *= v;
      gl_FragColor = c;
    }`,
};

export class PostFX {
  constructor(renderer, scene, camera, wScene, wCamera, w, h) {
    this.composer = new EffectComposer(renderer);
    this.composer.setPixelRatio(1);
    this.composer.setSize(w, h);
    this.world = new RenderPass(scene, camera);
    this.weapon = new RenderPass(wScene, wCamera);
    this.weapon.clear = false; this.weapon.clearDepth = true;           // viewmodel drawn on top of the world
    this.bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.42, 0.45, 1.02);
    this.grade = new ShaderPass(GradeShader);
    this.output = new OutputPass();
    for (const p of [this.world, this.weapon, this.bloom, this.grade, this.output]) this.composer.addPass(p);
  }
  setScene(scene) { this.world.scene = scene; }
  setSize(w, h) { this.composer.setSize(w, h); this.bloom.resolution.set(w, h); }
  render() { this.composer.render(); }
  // quality: 0 = off, 1 = bloom + grade
  setEnabled(on) { this.bloom.enabled = on; this.grade.enabled = on; }
}
