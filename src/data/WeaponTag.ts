/**
 * Tags drive Forge compatibility: a Module lists the tags a weapon must have and the
 * tags it must not (GDD 2.4.1, 3.1.2).
 *
 * `Ranged` and `Melee` appear here as well as in `WeaponType` because the Module
 * table in GDD 2.4.2 constrains on them ("Phase Blade requires [Melee]"), and a
 * `requiredTags` list is an AND, so "Blade or Blunt" cannot express it. Every weapon
 * must carry the tag matching its own type; `parseWeapons` enforces that.
 */
export type WeaponTag =
  'Ranged' | 'Melee' | 'Projectile' | 'Hitscan' | 'Beam' | 'Heavy' | 'Light' | 'Blade' | 'Blunt';

export const WEAPON_TAGS: readonly WeaponTag[] = [
  'Ranged',
  'Melee',
  'Projectile',
  'Hitscan',
  'Beam',
  'Heavy',
  'Light',
  'Blade',
  'Blunt',
];
