// Level registry for the Neo game (neo.html). Each build(scene) returns colliders, spawn data and rules (see level_moscow.js).
import { buildNeoMoscow } from './level_moscow.js';
import { buildNeoDubai } from './level_dubai.js';
import { resetWindows, getWindows } from '../geo.js';

const withWindows = (build) => (scene) => { resetWindows(); const L = build(scene); L.windows = getWindows(); return L; };

export const NEO_LEVELS = [
  { id: 'moscow', name: 'Moscow', era: 'Stalinist skyline — defend the Neo node', track: 0, build: withWindows(buildNeoMoscow) },
  { id: 'dubai', name: 'Dubai', era: 'Golden desert metropolis — defend the Neo node', track: 1, build: withWindows(buildNeoDubai) },
];
