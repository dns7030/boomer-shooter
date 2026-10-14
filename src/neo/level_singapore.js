// Neo level: Singapore. Marina Bay waterfront (the bay lies to the north, walled off) with Marina Bay Sands and a business conference
// in full swing (booths, flags, LED walls, the conference hall can be entered), supertrees, ArtScience lotus, Peranakan shophouses, HDB blocks.
import * as SG from '../buildings6sg.js';
import { buildCity } from './citylevel.js';
import { neoTowerSingapore } from './neotower.js';

export function buildNeoSingapore(scene) {
  const X0 = -110, X1 = 110, ZN = -87.5, ZS = 87.5, WATER = -49;
  return buildCity(scene, {
    seed: 1819, X0, X1, ZN, ZS,
    sky: 'neo_skyTropic', fog: [0xd4ecf4, 230, 1700], hemi: [0xdcf0ff, 0xb8c0a0, 2.0], sun: [2.2, 0xfff0d8], sunDisc: true,
    ground: [
      ['grass', -9, -1200, 1200, -1200, 1200, 8],
      ['paving', -8, X0, X1, WATER, ZS, 5],
      ['asphalt', -7, X0, X1, 33, 43], ['asphalt', -7, X0, X1, 62.5, 70],
      ['pavingDark', -6, X0, X1, -44, -36, 4],
      ['water', -7, -900, 900, -900, WATER, 8],
      ['grass', -6, -108, -66, 44, 52, 6],
      // the island in the bay (far skyline): a seawall rim, a lawn and a plaza, with rounded-off corners
      ['pavingDark', -5, -52, 106, -150, -114, 4], ['pavingDark', -5, -40, 94, -174, -94, 4],
      ['grass', -4, -49, 103, -148, -116, 6], ['grass', -4, -37, 91, -171, -97, 6],
      ['paving', -3, -30, 80, -126, -106, 5],
    ],
    base: { x: -15, z: -22 }, tower: neoTowerSingapore, start: { x: -15, z: 6, yaw: 0 },
    bossType: 'merlizard',
    blocked: [[X0 - 20, X1 + 20, ZN - 20, WATER]],
    walkable: (x, z) => z > WATER + 1,
    buildings: [
      ['mbs', () => SG.marinaBaySands(), 45, 20, 'N', 0.6],
      ['conf', () => SG.mbsConferenceHall(), 50, -15, 'S', 0.7],
      ['museum', () => SG.artScienceMuseum(), 96, -14, 'S', 0.7],
      ['esplanade', () => SG.esplanade(), -62, -21, 'S', 0.6],
      ['raffles', () => SG.rafflesHotel(), -96, -6, 'E', 0.6],
      ['dome', () => SG.flowerDome(), 95, 30, 'N', 0.45],
      ['shop1', () => SG.shophouseRow({ variant: 0 }), -20, 24, 'N', 0.9],
      ['shop2', () => SG.shophouseRow({ variant: 1 }), -56, 24, 'N', 0.9],
      ['shop3', () => SG.shophouseRow({ variant: 2 }), -92, 24, 'N', 0.9],
      ['hdb1', () => SG.hdbBlock({ variant: 0 }), -88, 58, 'N', 0.7], ['hdb2', () => SG.hdbBlock({ variant: 1 }), -50, 58, 'N', 0.7],
      ['hdb3', () => SG.hdbBlock({ variant: 2 }), -12, 58, 'N', 0.7], ['hdb4', () => SG.hdbBlock({ variant: 0 }), 26, 58, 'N', 0.7], ['hdb5', () => SG.hdbBlock({ variant: 1 }), 64, 58, 'N', 0.7],
      ['hdb6', () => SG.hdbBlock({ variant: 2 }), -88, 78, 'N', 0.7], ['hdb7', () => SG.hdbBlock({ variant: 0 }), -50, 78, 'N', 0.7],
      ['hdb8', () => SG.hdbBlock({ variant: 1 }), -12, 78, 'N', 0.7], ['hdb9', () => SG.hdbBlock({ variant: 2 }), 26, 78, 'N', 0.7], ['hdb10', () => SG.hdbBlock({ variant: 0 }), 64, 78, 'N', 0.7],
      ['merlion', () => SG.merlion(), -48, -41, 'N', 1],
      ['boothA', () => SG.conferenceBooth({ variant: 0 }), 12, -22, 'S', 1], ['boothB', () => SG.conferenceBooth({ variant: 1 }), 12, -10, 'S', 1], ['boothC', () => SG.conferenceBooth({ variant: 2 }), 24, 0, 'S', 1],
      ['led1', () => SG.ledWall({ variant: 0 }), 26, -30, 'S', 0.9],
      ['reg1', () => SG.merlionRegDesk(), 38, 1, 'N', 1], ['reg2', () => SG.merlionRegDesk(), 62, 1, 'N', 1],
    ],
    skyline: [
      // everything that used to float in the sea now stands on the island (x -52..106, z -174..-94)
      [() => SG.fullertonHotel(), -8, -122, 'S', 1.1], [() => SG.helixBridge(), 48, -103, 'S', 1.1],
      [() => SG.singaporeFlyer(), 72, -134, 'S', 1], [() => SG.superTree({ variant: 1 }), 30, -152, 'S', 1.3],
      [() => SG.financeTower({ variant: 2 }), -12, -158, 'S', 1], [() => SG.financeTower({ variant: 0 }), 62, -162, 'S', 1],
      [() => SG.financeTower({ variant: 0 }), 140, -50, 'W', 1], [() => SG.financeTower({ variant: 1 }), 150, 10, 'W', 1], [() => SG.financeTower({ variant: 2 }), 140, 70, 'W', 1],
      [() => SG.financeTower({ variant: 3 }), -150, 40, 'E', 1], [() => SG.financeTower({ variant: 1 }), -150, -20, 'E', 1], [() => SG.financeTower({ variant: 0 }), -40, 130, 'N', 1],
      [() => SG.dragonBoat(), -40, -70, 'S', 1], [() => SG.bumboat(), 40, -80, 'E', 1], [() => SG.bumboat(), -80, -100, 'S', 1],
    ],
    halls: [{ name: 'conf', W: 60, D: 36, H: 18, items: [[0, 10, 'w_plasma'], [0, -10, 'neo'], [-4, 0, 'gas'], [5, 0, 'cells'], [-6, 12, 'neo'], [6, -12, 'gas']] }],
    decor(c) {
      const { scene, rnd, free, box, put, clip } = c;
      const drop = (g, x, z, rot, hw) => { g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g); if (hw) box(x - hw, x + hw, z - hw, z + hw, 5); clip(g); };
      for (let x = X0 + 10; x < X1 - 10; x += 20) { if (Math.abs(x + 48) < 14) continue; const r = SG.promenadeRail(); put(r, x, WATER + 0.8, 'S', {}); clip(r); }
      for (let x = X0 + 10; x < X1; x += 14) if (free(x, -37.5, 1)) drop(SG.bayLamp(), x, -37.5, 0, 0.3);
      for (const [x, z, v] of [[-100, -30, 0], [-80, 6, 1]]) { const t = SG.superTree({ variant: v }); put(t, x, z, 'S', {}); clip(t); }
      for (let i = 0; i < 26; i++) { const x = X0 + 10 + rnd() * (X1 - X0 - 20), z = WATER + 8 + rnd() * (ZS - WATER - 20); if (free(x, z, 3.5) && Math.hypot(x + 15, z + 22) > 30) drop(i % 3 ? SG.palm() : SG.rainTree(), x, z, rnd() * 6, 0.45); }
      for (let x = -100; x < 100; x += 14) for (const z of [32, 44]) if (free(x, z, 1.5) && rnd() < 0.5) drop(SG.palm(), x, z, rnd() * 6, 0.4);
      const flag1 = SG.flagRow({ arch: true }); put(flag1, 50, 4.5, 'N', { solid: false }); clip(flag1);
      const flag2 = SG.flagRow(); put(flag2, 20, -2, 'S', { solid: false }); clip(flag2);
    },
  });
}
