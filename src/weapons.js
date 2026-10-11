// Weapon definitions.
export const AMMO = {
  powder: { name: 'BULLETS', max: 150, start: 36 },
  shot: { name: 'SHELLS', max: 40, start: 10 },
};

export const WEAPONS = [
  { id: 'sabre', name: 'Shashka', melee: true, cooldown: 0.5, damage: 45, range: 2.7 },
  { id: 'pistol', name: 'Pistol', cooldown: 0.38, damage: 30, pellets: 1, spread: 0.004, ammo: 'powder', use: 1, sfx: 'pistol', kick: 0.03 },
  { id: 'shotgun', name: 'Pump Shotgun', cooldown: 0.9, damage: 11, pellets: 9, spread: 0.075, ammo: 'shot', use: 1, sfx: 'blunder', kick: 0.08 },
  { id: 'chaingun', name: 'Chaingun', cooldown: 0.1, damage: 11, pellets: 1, spread: 0.03, ammo: 'powder', use: 1, sfx: 'skor', kick: 0.012, auto: true },
];
