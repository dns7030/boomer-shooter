// Neo level: Shanghai. The Bund (north-south boulevard, grand old banks on its west side) meets Nanjing Road (the pedestrian
// shopping street, running west). The Neo pagoda stands on the Bund promenade where the street meets it, facing down Nanjing Road.
// East of the promenade is the Huangpu river (walled off); the Pudong skyline stands far across it.
import * as THREE from 'three';
import * as SH from '../buildings6sh.js';
import { buildCity } from './citylevel.js';
import { neoTowerShanghai } from './neotower.js';

export function buildNeoShanghai(scene) {
  const X0 = -110, X1 = 100, ZN = -87.5, ZS = 87.5, RIVER = 93;
  return buildCity(scene, {
    seed: 1843, X0, X1, ZN, ZS,
    sky: 'neo_skyHaze', fog: [0xdbe4e8, 170, 1500], hemi: [0xd8e4f0, 0xa8a898, 1.85], sun: [1.9, 0xfff4e0], sunDisc: true, sunSize: 520,
    ground: [
      ['grass', -9, -1200, 1200, -1200, 1200, 8],
      ['paving', -8, X0, 92, ZN, ZS, 5],
      ['asphalt', -7, 41, 61, ZN, ZS],                // the Bund boulevard
      ['pavingDark', -7, X0, 41, -9, 9, 4],           // Nanjing Road (pedestrian street)
      ['pavingDark', -6, 61, 92, -ZS, ZS, 4],         // the promenade
      ['water', -7, RIVER, 900, -500, 500, 8],
      ['paving', -8, 300, 900, -500, 500, 8],
    ],
    base: { x: 76, z: 0, f: 'W' }, tower: neoTowerShanghai, start: { x: 46, z: 0, yaw: -Math.PI / 2 },
    bossType: 'jadewyrm',
    blocked: [[RIVER, X1 + 20, ZN - 20, ZS + 20]],
    walkable: (x) => x < 92,
    buildings: [
      // the Bund, west side of the boulevard (fronts face east, toward the river)
      ['hsbc', () => SH.hsbcBank(), 27, -28, 'E', 0.8],
      ['customs', () => SH.customsHouse(), 27, -63, 'E', 0.7],
      ['peace', () => SH.peaceHotel(), 27, 27, 'E', 0.8],
      ['lobby', () => SH.bundLobbyHall(), 26, 59, 'E', 0.75],
      ['boc', () => SH.bankOfChina(), 28, 83, 'E', 0.35],
      // Nanjing Road frontage (north side faces south, south side faces north)
      ['dept', () => SH.deptStoreDeco(), -6, -23, 'S', 0.8],
      ['shopN1', () => SH.oldShopRow({ variant: 0 }), -43, -18, 'S', 0.9],
      ['shopN2', () => SH.oldShopRow({ variant: 1 }), -80, -18, 'S', 0.9],
      ['shopS1', () => SH.oldShopRow({ variant: 1 }), -6, 18, 'N', 0.9],
      ['shopS2', () => SH.oldShopRow({ variant: 0 }), -43, 18, 'N', 0.9],
      ['shopS3', () => SH.oldShopRow({ variant: 1 }), -80, 18, 'N', 0.9],
      // lilong alleys behind the street frontage: rows facing each other across a ~7 m lane
      ['lilN1', () => SH.shikumenRow(), -5, -43, 'N', 0.9], ['lilN2', () => SH.shikumenRow(), -5, -62, 'S', 0.9],
      ['lilN3', () => SH.shikumenRow(), -42, -43, 'N', 0.9], ['lilN4', () => SH.shikumenRow(), -42, -62, 'S', 0.9],
      ['lilN5', () => SH.shikumenRow(), -79, -43, 'N', 0.9], ['lilN6', () => SH.shikumenRow(), -79, -62, 'S', 0.9],
      ['lilS1', () => SH.shikumenRow(), -5, 43, 'S', 0.9], ['lilS2', () => SH.shikumenRow(), -5, 62, 'N', 0.9],
      ['lilS3', () => SH.shikumenRow(), -42, 43, 'S', 0.9], ['lilS4', () => SH.shikumenRow(), -42, 62, 'N', 0.9],
      ['lilS5', () => SH.shikumenRow(), -79, 43, 'S', 0.9], ['lilS6', () => SH.shikumenRow(), -79, 62, 'N', 0.9],
      ['lilN7', () => SH.shikumenRow(), -42, -80, 'S', 0.9], ['lilS7', () => SH.shikumenRow(), -42, 80, 'N', 0.9],
      ['lilN8', () => SH.shikumenRow(), -79, -80, 'S', 0.9], ['lilS8', () => SH.shikumenRow(), -79, 80, 'N', 0.9],
      ['lilN9', () => SH.shikumenRow(), -5, -80, 'S', 0.9], ['lilS9', () => SH.shikumenRow(), -5, 80, 'N', 0.9],
    ],
    skyline: [
      // beyond the western wall: more old Shanghai
      [() => SH.oldShopRow({ variant: 0 }), -145, -20, 'E', 1.1], [() => SH.shikumenRow(), -150, 30, 'E', 1.1], [() => SH.deptStoreDeco(), -150, 70, 'E', 1],
      [() => SH.bundBank({ variant: 1 }), -140, -70, 'E', 1], [() => SH.peaceHotel(), 10, -120, 'S', 1.1], [() => SH.bundBank({ variant: 2 }), -50, 125, 'N', 1.1],
      // Pudong across the river
      [() => SH.orientalPearl(), 300, -60, 'W', 1.5], [() => SH.shanghaiTower(), 330, 10, 'W', 1.6], [() => SH.jinMao(), 320, 60, 'W', 1.5],
      [() => SH.swfc(), 345, 105, 'W', 1.5], [() => SH.pudongTower({ variant: 0 }), 300, -130, 'W', 1.3], [() => SH.pudongTower({ variant: 1 }), 290, 150, 'W', 1.4],
      [() => SH.pudongTower({ variant: 2 }), 360, -30, 'W', 1.4], [() => SH.pudongTower({ variant: 3 }), 350, 70, 'W', 1.3], [() => SH.pudongTower({ variant: 1 }), 380, -110, 'W', 1.5],
      [() => SH.cruiseBoat(), 145, -40, 'S', 1], [() => SH.junkBoat(), 160, 40, 'S', 1], [() => SH.cruiseBoat(), 190, 90, 'N', 1],
    ],
    halls: [{ name: 'lobby', W: 46, D: 34, H: 20, items: [[-6, 6, 'w_plasma'], [8, -6, 'neo'], [8, 8, 'gas'], [-8, -8, 'cells']] }],
    decor(c) {
      const { scene, rnd, free, box, put, clip } = c;
      const gate = SH.nanjingGate(); put(gate, -62, 0, 'E', { s: 0.8 }); clip(gate);
      const tram = SH.touristTram(); put(tram, -22, 4.2, 'S', { solid: false }); clip(tram);
      const bull = SH.bundBull(); put(bull, 72, -30, 'W', { s: 1 }); clip(bull);
      for (let z = ZN + 10; z < ZS; z += 20) { const r = SH.promenadeRail(); put(r, 91.2, z, 'E', {}); clip(r); }
      for (let z = ZN + 10; z < ZS; z += 16) { if (Math.abs(z) < 10) continue; const l = SH.bundLamp(); l.position.set(88, 0, z); scene.add(l); box(87.8, 88.2, z - 0.2, z + 0.2, 5); }
      for (let z = ZN + 8; z < ZS; z += 13) for (const x of [43, 59]) { if (Math.abs(z) < 11 || !free(x, z, 1.2)) continue; const t = SH.planeTree(); t.position.set(x, 0, z); t.rotation.y = rnd() * 6; scene.add(t); box(x - 0.4, x + 0.4, z - 0.4, z + 0.4, 6); }
      for (let x = -100; x < 40; x += 18) { const s = SH.neonSignPole(); s.position.set(x, 0, rnd() < 0.5 ? -7 : 7); scene.add(s); box(s.position.x - 0.5, s.position.x + 0.5, s.position.z - 0.4, s.position.z + 0.4, 6); }
      for (let x = -96; x < 36; x += 22) { const l = SH.lanternString(); l.position.set(x, 0, 0); scene.add(l); }
    },
  });
}
