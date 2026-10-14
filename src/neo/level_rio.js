// Neo level: Rio de Janeiro. Copacabana beachfront with the Neo saucer tower, Lapa arches, theatre, cathedral, samba club, Maracana,
// favela hills, Christ the Redeemer on Corcovado and Sugarloaf behind. Sea to the south (walled off).
import * as THREE from 'three';
import { addPainters } from '../textures.js';
import * as RAW from '../buildings6rj.js';
import { makeTone } from './tone.js';
import { buildCity } from './citylevel.js';
import { neoTowerRio } from './neotower.js';

// Rio's builders use very saturated colours and bright unlit lights; calm them down.
const R = makeTone({ sat: 0.6, light: 0.93, glow: 0.62 })(RAW);

const P = {
  rj_sand(g) { g.fillStyle = '#efd9a0'; g.fillRect(0, 0, 64, 64); let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647; for (let i = 0; i < 140; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,245,210,0.35)' : 'rgba(190,150,90,0.25)'; g.fillRect(r() * 64, r() * 64, 1 + r() * 2, 1); } },
  rj_wave(g) { g.fillStyle = '#f2f0ea'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#25252a'; for (let y = 0; y < 64; y += 16) { g.beginPath(); for (let x = 0; x <= 64; x += 2) g.lineTo(x, y + 8 + Math.sin((x / 64) * 6.283 * 1) * 5); for (let x = 64; x >= 0; x -= 2) g.lineTo(x, y + 16 + Math.sin((x / 64) * 6.283 * 1) * 5); g.closePath(); g.fill(); } },
  rj_road(g) { g.fillStyle = '#5d5b59'; g.fillRect(0, 0, 64, 64); let s = 11; const r = () => (s = (s * 16807) % 2147483647) / 2147483647; for (let i = 0; i < 90; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.1)'; g.fillRect(r() * 64, r() * 64, 2, 1); } },
};

export function buildNeoRio(scene) {
  const X0 = -110, X1 = 110, ZN = -87.5, ZS = 87.5;
  return buildCity(scene, {
    seed: 1565, X0, X1, ZN, ZS,
    sky: 'neo_skyTropic', fog: [0xcfe6f2, 260, 1900], hemi: [0xdff0ff, 0xc8b890, 2.0], sun: [2.3, 0xfff0d0], sunDisc: true,
    painters: P, painterSizes: {},
    ground: [
      ['grass', -9, -1200, 1200, -1200, 1200, 8],
      ['paving', -8, X0, X1, ZN, 26, 6],
      ['rj_road', -7, X0, X1, 24, 42, 8],
      ['rj_wave', -7, X0, X1, 42, 56, 8],
      ['rj_sand', -8, X0, X1, 56, 84, 10],
      ['water', -7, X0 - 300, X1 + 300, 84, 700, 8],
      ['paving', -5, -22, 22, -34, 8, 4],
    ],
    base: { x: 0, z: -12 }, tower: neoTowerRio, start: { x: 0, z: 32, yaw: 0 },
    bossType: 'carnival',
    blocked: [[X0, X1, 84, ZS + 20]],
    buildings: [
      ['theatro', () => R.theatroMunicipal(), -72, -62, 'S', 0.8],
      ['cathedral', () => R.metropolitanCathedral(), 72, -62, 'S', 0.7],
      ['lapa', () => R.arcosDaLapa(), -10, -76, 'S', 0.9],
      ['maracana', () => R.maracana(), 55, -30, 'S', 0.45],
      ['escadaria', () => R.escadariaSelaron(), -50, -28, 'S', 0.8],
      ['favelaW', () => R.favelaHill(), -98, -14, 'E', 0.8],
      ['favelaE', () => R.favelaHill(), 98, -14, 'W', 0.8],
      ['samba', () => R.sambaClubHall(), 62, 8, 'S', 0.8],
      ['stand', () => R.sambadromeStand(), -67, 8, 'S', 0.7],
      ['colA', () => R.colonialRow({ variant: 0 }), -24, 17, 'S', 0.75],
      ['colB', () => R.colonialRow({ variant: 1 }), 22, 17, 'S', 0.75],
      ['kioskA', () => R.copacabanaKiosk(), -40, 62, 'N', 1],
      ['kioskB', () => R.copacabanaKiosk(), 40, 66, 'N', 1],
      ['fruit', () => R.fruitStand(), 20, 36, 'N', 1],
    ],
    skyline: [
      [() => R.colonialRow({ variant: 2 }), -80, -96, 'S', 1.2],
      [() => R.colonialRow({ variant: 0 }), 20, -98, 'S', 1.2],
      [() => R.sambadromeStand(), 100, -100, 'S', 1],
    ],
    halls: [{ name: 'samba', W: 46, D: 34, H: 16, items: [[-4, 0, 'w_plasma'], [8, -8, 'neo'], [8, 6, 'gas'], [-4, 10, 'cells']] }],
    walkable: (x, z) => z < 84,
    decor(c) {
      const { scene, rnd, free, box, put, clip } = c;
      // mountains and the statue behind the city (far scenery)
      const cor = R.corcovadoMountain(); put(cor, 30, -250, 'S', { solid: false, s: 1.6 }); clip(cor);
      const chr = R.christRedeemer(); put(chr, 30, -250, 'S', { solid: false, s: 1.6 }); chr.position.y = 110 * 1.6 - 1; 
      const sug = R.sugarloaf(); put(sug, 190, -130, 'W', { solid: false, s: 1.3 }); clip(sug);
      // palms along the avenue and the promenade, umbrellas / volleyball on the beach, lamps
      const place = (g, x, z, rot = 0, solid = null) => { g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g); if (solid) box(x - solid, x + solid, z - solid, z + solid, 5); return g; };
      for (let x = X0 + 8; x < X1; x += 14) { if (free(x, 24.6, 1.5)) place(R.palmRio(), x, 24.6, rnd() * 6, 0.45); if (free(x + 7, 43, 1.5)) place(R.palmRio(), x + 7, 43, rnd() * 6, 0.45); }
      for (let i = 0; i < 14; i++) { const x = X0 + 10 + rnd() * (X1 - X0 - 20), z = 62 + rnd() * 18; if (free(x, z, 3)) place(R.beachUmbrella({ variant: i % 3 }), x, z, rnd() * 6, 0.25); }
      for (const x of [-12, 40]) place(R.volleyballNet(), x, 72, 0);
      for (const x of [-20, 26, 80]) place(R.surfboardStand(), x, 58, rnd() * 6);
      for (let x = X0 + 12; x < X1; x += 24) { if (free(x, 40.5, 1)) place(R.lampRio(), x, 40.5, 0, 0.3); }
      for (const [x, z, v] of [[-30, 33, 0], [30, 33, 1]]) { const f = R.carnivalFloat({ variant: v }); put(f, x, z, 'S', { s: 0.9 }); clip(f); }
      const pave = R.promenadePaving(); pave.position.set(0, 0.02, 49); scene.add(pave);
      for (const [x, z, r] of [[-60, 78, 0], [70, 80, 0]]) { const b = R.bayBoat(); b.position.set(x, 0, z + 14); b.rotation.y = r; scene.add(b); }
    },
  });
}
