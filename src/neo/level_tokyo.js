// Neo level: Tokyo at dusk. A Shibuya-style scramble crossing with the Neo tower in the middle, neon towers, izakaya rows, a
// pachinko parlour you can walk into, Godzilla hotel, pagoda, Kaminarimon gate, elevated railway. Tokyo Tower and Skytree far away.
import * as THREE from 'three';
import * as T from '../buildings6tk.js';
import { buildCity } from './citylevel.js';
import { neoTowerTokyo } from './neotower.js';

export function buildNeoTokyo(scene) {
  const X0 = -110, X1 = 110, ZN = -87.5, ZS = 87.5;
  return buildCity(scene, {
    seed: 1603, X0, X1, ZN, ZS,
    sky: 'neo_skyDusk', fog: [0x2b2656, 90, 780], hemi: [0x8a86d0, 0x3a3048, 1.7], sun: [0.7, 0xb8a8ff], sunDisc: false,
    ground: [
      ['grass', -9, -1200, 1200, -1200, 1200, 8],
      ['pavingDark', -8, X0, X1, ZN, ZS, 4],
      ['asphalt', -7, -12, 12, ZN, ZS], ['asphalt', -7, X0, X1, -12, 12],
      ['paving', -5, -22, 22, -22, 22, 4],
    ],
    base: { x: 0, z: 0 }, tower: neoTowerTokyo, start: { x: 0, z: 30, yaw: 0 },
    bossType: 'kaiju',
    buildings: [
      // north-east block (fronts face the east-west avenue, i.e. south)
      ['pachinko', () => T.pachinkoParlor(), 38, -28, 'S', 0.9],
      ['neonA', () => T.neonTower({ variant: 0 }), 68, -25, 'S', 0.9],
      ['neonB', () => T.neonTower({ variant: 1 }), 92, -25, 'S', 0.9],
      ['izakayaA', () => T.izakayaRow(), 38, -52, 'S', 0.9],
      ['godzilla', () => T.godzillaHotel(), 72, -58, 'S', 0.7],
      ['mall', () => T.cylinderMall(), 98, -58, 'S', 0.7],
      // north-west
      ['konbiniA', () => T.konbini(), -24, -22, 'S', 0.9],
      ['capsuleA', () => T.capsuleHotel(), -48, -28, 'S', 0.8],
      ['neonC', () => T.neonTower({ variant: 2 }), -76, -26, 'S', 0.9],
      ['housesA', () => T.japaneseHouseRow(), -98, -24, 'S', 0.7],
      ['pagoda', () => T.pagoda(), -40, -58, 'S', 0.9],
      ['izakayaB', () => T.izakayaRow(), -76, -52, 'S', 0.9],
      // south-east (fronts face north)
      ['izakayaC', () => T.izakayaRow(), 38, 24, 'N', 0.9],
      ['neonD', () => T.neonTower({ variant: 1 }), 64, 26, 'N', 0.9],
      ['konbiniB', () => T.konbini(), 88, 22, 'N', 0.9],
      ['capsuleB', () => T.capsuleHotel(), 45, 56, 'N', 0.9],
      ['neonE', () => T.neonTower({ variant: 0 }), 76, 58, 'N', 0.9],
      ['housesB', () => T.japaneseHouseRow(), 100, 56, 'N', 0.7],
      // south-west
      ['neonF', () => T.neonTower({ variant: 0 }), -26, 28, 'N', 0.9],
      ['godzilla2', () => T.godzillaHotel(), -52, 40, 'N', 0.6],
      ['mallB', () => T.cylinderMall(), -80, 40, 'N', 0.65],
      ['izakayaD', () => T.izakayaRow(), -98, 18, 'N', 0.8],
      ['capsuleC', () => T.capsuleHotel(), -30, 62, 'N', 0.8],
      // the gates and the railway
      ['kaminari', () => T.kaminarimon(), 0, -62, 'S', 0.8],
      ['torii', () => T.torii(), 0, 62, 'S', 1],
      ['rail1', () => T.elevatedTrack(), -66, -78, 'S', 1], ['rail2', () => T.elevatedTrack(), -22, -78, 'S', 1],
      ['rail3', () => T.elevatedTrack(), 22, -78, 'S', 1], ['rail4', () => T.elevatedTrack(), 66, -78, 'S', 1],
      ['screenA', () => T.giantScreen(), -60, 15, 'N', 1], ['screenB', () => T.giantScreen(), 60, -15, 'S', 1],
    ],
    skyline: [
      [() => T.tokyoTower(), -60, -170, 'S', 1.1], [() => T.skytreeTower(), 140, -190, 'S', 1],
      [() => T.neonTower({ variant: 0 }), -150, -40, 'E', 1.2], [() => T.neonTower({ variant: 1 }), -150, 30, 'E', 1.2], [() => T.neonTower({ variant: 2 }), 150, -30, 'W', 1.2],
      [() => T.neonTower({ variant: 1 }), 150, 40, 'W', 1.2], [() => T.cylinderMall(), 40, 130, 'N', 1], [() => T.godzillaHotel(), -40, 135, 'N', 0.9], [() => T.capsuleHotel(), 120, 120, 'N', 1],
    ],
    halls: [{ name: 'pachinko', W: 36, D: 24, H: 18, items: [[0, 8, 'w_plasma'], [0, -8, 'neo'], [-12, 0, 'gas'], [12, 0, 'cells'], [-5, 8, 'neo'], [5, -8, 'gas']] }],
    decor(c) {
      const { scene, rnd, free, box, put, clip } = c;
      const drop = (g, x, z, rot, hw) => { g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g); if (hw) box(x - hw, x + hw, z - hw, z + hw, 4); clip(g); };
      for (const [x, z] of [[-14, -14], [14, -14], [-14, 14], [14, 14]]) drop(T.crossingLights(), x, z, 0, 0.5);
      for (let x = X0 + 10; x < X1; x += 16) for (const z of [-14.5, 14.5]) if (free(x, z, 1.5) && Math.abs(x) > 24) { if (rnd() < 0.5) drop(T.vendingMachine({ variant: (x | 0) % 4 }), x, z, z < 0 ? 0 : Math.PI, 0.6); else drop(T.paperLanternPost(), x, z, 0, 0.4); }
      // utility poles: contiguous runs along the avenue edges, 16 m apart, wires joined pole to pole (isolated poles are skipped)
      for (const x of [-14.5, 14.5]) {
        const zs = []; for (let z = ZN + 12; z < ZS - 6; z += 16) zs.push(z);
        let run = [];
        const flush = () => { if (run.length >= 2) run.forEach((z, i) => drop(T.utilityPole({ span: 16, sides: [i > 0 ? 1 : 0, i < run.length - 1 ? -1 : 0].filter(Boolean) }), x, z, Math.PI / 2, 0.5)); run = []; };
        for (const z of zs) { if (Math.abs(z) > 22 && free(x, z, 1.5)) run.push(z); else flush(); }
        flush();
      }
      for (let i = 0; i < 16; i++) { const x = X0 + 12 + rnd() * (X1 - X0 - 24), z = ZN + 12 + rnd() * (ZS - ZN - 24); if (free(x, z, 3) && Math.hypot(x, z) > 30) drop(T.sakuraTree(), x, z, rnd() * 6, 0.5); }
      for (const [x, z] of [[-30, 15.5], [30, -15.5], [-70, 15.5], [70, 15.5]]) if (free(x, z, 2)) drop(T.ramenCart(), x, z, 0, 1.2);
    },
  });
}
