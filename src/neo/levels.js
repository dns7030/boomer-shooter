// Level registry for the Neo game (neo.html). Each build(scene) returns colliders, spawn data and rules (see level_moscow.js).
import { buildNeoMoscow } from './level_moscow.js';
import { buildNeoSeattle } from './level_seattle.js';
import { buildNeoTokyo } from './level_tokyo.js';
import { buildNeoShanghai } from './level_shanghai.js';
import { buildNeoRio } from './level_rio.js';
import { buildNeoDubai } from './level_dubai.js';
import { resetWindows, getWindows } from '../geo.js';

const withWindows = (build) => (scene) => { resetWindows(); const L = build(scene); L.windows = getWindows(); return L; };

export const NEO_LEVELS = [
  { id: 'moscow', name: 'Moscow', era: 'Stalinist skyline — defend Neo', track: 0, build: withWindows(buildNeoMoscow) },
  { id: 'seattle', name: 'Seattle', era: 'Rainy grey city — defend Neo', track: 2, build: withWindows(buildNeoSeattle) },
  { id: 'dubai', name: 'Dubai', era: 'Golden desert metropolis — defend Neo', track: 1, build: withWindows(buildNeoDubai) },
  { id: 'shanghai', name: 'Shanghai', era: 'The Bund and Nanjing Road — defend Neo', track: 1, build: withWindows(buildNeoShanghai) },
  { id: 'tokyo', name: 'Tokyo', era: 'Neon dusk in Shibuya — defend Neo', track: 2, build: withWindows(buildNeoTokyo) },
  { id: 'rio', name: 'Rio de Janeiro', era: 'Carnival on the beach — defend Neo', track: 3, build: withWindows(buildNeoRio) },
];
