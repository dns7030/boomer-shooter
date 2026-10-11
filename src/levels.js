// Level registry. Each build(scene) returns colliders, spawn data and level rules (see level.js).
import { buildLevel as buildMuscovy } from './level.js';
import { buildSoviet } from './level_soviet.js';

export const LEVELS = [
  { id: 'muscovy', name: 'Muscovy Street', era: '1550s — hold the street', build: buildMuscovy },
  { id: 'soviet', name: 'Soviet Avenue', era: '1970s — fight to the Motherland monument', build: buildSoviet },
];
