// Level registry. Each build(scene) returns colliders, spawn data and level rules (see level.js).
import { buildLevel as buildMuscovy } from './level.js';
import { buildSoviet } from './level_soviet.js';
import { resetWindows, getWindows } from './geo.js';

// wrap every build so the level also reports its breakable windows
const withWindows = (build) => (scene) => { resetWindows(); const L = build(scene); L.windows = getWindows(); return L; };

export const LEVELS = [
  { id: 'muscovy', name: 'Muscovy Street', era: '1550s — hold the street', build: withWindows(buildMuscovy) },
  { id: 'soviet', name: 'Soviet Avenue', era: '1970s — fight to the Motherland monument', build: withWindows(buildSoviet) },
];
