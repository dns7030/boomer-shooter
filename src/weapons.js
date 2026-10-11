// Weapon definitions. Slots work like Doom: press a number again to cycle weapons that share it.
export const AMMO = {
  bullets: { name: 'BULLETS', max: 200, start: 40 },
  shells: { name: 'SHELLS', max: 50, start: 12 },
  rockets: { name: 'ROCKETS', max: 40, start: 0 },
  grenades: { name: 'GRENADES', max: 30, start: 0 },
  cells: { name: 'CELLS', max: 200, start: 0 },
  fuel: { name: 'FUEL', max: 300, start: 0 },
};

// kind: 'melee' | 'hitscan' | 'projectile' | 'flame' | 'rail'
export const WEAPONS = [
  { id: 'sabre', name: 'Shashka', slot: 1, kind: 'melee', melee: true, cooldown: 0.5, damage: 45, range: 2.7 },
  { id: 'pistol', name: 'Pistol', slot: 2, kind: 'hitscan', cooldown: 0.38, damage: 30, pellets: 1, spread: 0.004, ammo: 'bullets', use: 1, sfx: 'pistol', kick: 0.03, starter: 20 },
  { id: 'shotgun', name: 'Pump Shotgun', slot: 3, kind: 'hitscan', cooldown: 0.72, damage: 11, pellets: 9, spread: 0.075, ammo: 'shells', use: 1, sfx: 'shotgun', kick: 0.08, starter: 8 },
  { id: 'ssg', name: 'Super Shotgun', slot: 3, kind: 'hitscan', cooldown: 1.15, damage: 12, pellets: 20, spread: 0.12, ammo: 'shells', use: 2, sfx: 'ssg', kick: 0.14, starter: 10 },
  { id: 'chaingun', name: 'Chaingun', slot: 4, kind: 'hitscan', cooldown: 0.085, damage: 11, pellets: 1, spread: 0.035, ammo: 'bullets', use: 1, sfx: 'chaingun', kick: 0.012, auto: true, starter: 40 },
  { id: 'rocket', name: 'Rocket Launcher', slot: 5, kind: 'projectile', cooldown: 0.85, ammo: 'rockets', use: 1, sfx: 'rocket', kick: 0.11, starter: 6,
    shot: { type: 'rocket', speed: 34, radius: 5.5, damage: 130 } },
  { id: 'grenade', name: 'Grenade Launcher', slot: 5, kind: 'projectile', cooldown: 0.7, ammo: 'grenades', use: 1, sfx: 'grenade', kick: 0.07, starter: 6,
    shot: { type: 'grenade', speed: 19, radius: 4.5, damage: 95, gravity: 16, fuse: 1.7, bounce: 0.5 } },
  { id: 'plasma', name: 'Plasma Rifle', slot: 6, kind: 'projectile', cooldown: 0.09, ammo: 'cells', use: 1, sfx: 'plasma', kick: 0.01, auto: true, starter: 40,
    shot: { type: 'plasma', speed: 52, radius: 1.8, damage: 22 } },
  { id: 'flamer', name: 'Flamethrower', slot: 7, kind: 'flame', cooldown: 0.05, ammo: 'fuel', use: 1, sfx: 'flame', kick: 0.004, auto: true, starter: 120, range: 9, damage: 5 },
  { id: 'rail', name: 'Railgun', slot: 8, kind: 'rail', cooldown: 1.1, damage: 170, ammo: 'cells', use: 6, sfx: 'rail', kick: 0.1, starter: 18 },
  { id: 'bfg', name: 'BFG 9000', slot: 9, kind: 'projectile', cooldown: 1.7, ammo: 'cells', use: 25, sfx: 'bfg', kick: 0.14, starter: 50,
    shot: { type: 'bfg', speed: 17, radius: 11, damage: 380 } },
];
export const WEAPON_INDEX = Object.fromEntries(WEAPONS.map((w, i) => [w.id, i]));
export const SLOTS = 9;
