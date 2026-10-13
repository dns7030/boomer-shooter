// Level registry for the Neo game (neo.html). Each build(scene) returns colliders, spawn data and rules (see level_moscow.js).
import { buildNeoMoscow } from './level_moscow.js';
import { buildNeoSeattle } from './level_seattle.js';
import { buildNeoDubai } from './level_dubai.js';
import { resetWindows, getWindows } from '../geo.js';

const withWindows = (build) => (scene) => { resetWindows(); const L = build(scene); L.windows = getWindows(); return L; };

export const NEO_LEVELS = [
  { id: 'moscow', name: 'Moscow', era: 'Stalinist skyline — defend Neo', track: 0, build: withWindows(buildNeoMoscow) },
  { id: 'seattle', name: 'Seattle', era: 'Rainy grey city — defend Neo', track: 2, build: withWindows(buildNeoSeattle) },
  { id: 'dubai', name: 'Dubai', era: 'Golden desert metropolis — defend Neo', track: 1, build: withWindows(buildNeoDubai) },
];
