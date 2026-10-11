// Weapon definitions. Era-appropriate hardware for fighting lizards in 1550s Muscovy.
export const AMMO = {
  powder: { name: 'POWDER', max: 150, start: 36 },
  shot: { name: 'SHOT', max: 40, start: 10 },
};

export const WEAPONS = [
  { id: 'sabre', name: 'Shashka', melee: true, cooldown: 0.5, damage: 45, range: 2.7 },
  { id: 'pistol', name: 'Flintlock Pistol', cooldown: 0.4, damage: 30, pellets: 1, spread: 0.004, ammo: 'powder', use: 1, sfx: 'pistol', kick: 0.03 },
  { id: 'blunder', name: 'Blunderbuss', cooldown: 0.95, damage: 11, pellets: 9, spread: 0.075, ammo: 'shot', use: 1, sfx: 'blunder', kick: 0.08 },
  { id: 'skorostrel', name: 'Skorostrel Organ Gun', cooldown: 0.1, damage: 11, pellets: 1, spread: 0.03, ammo: 'powder', use: 1, sfx: 'skor', kick: 0.012 },
];
