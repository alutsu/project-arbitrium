import type { UpgradeData } from '../data/UpgradeData';
import type { WeaponData } from '../data/WeaponData';

const NO_CHANGE = 1;
const NOTHING_EXTRA = 0;

/**
 * Fits a Module to a weapon, returning the modified weapon (GDD 2.4).
 *
 * Modifiers are declarative numbers on `UpgradeData`, so this stays a single generic
 * transform rather than a conditional that grows per Module (CLAUDE.md 3.2). A Module
 * whose effect is *behavioural* rather than numeric — Phase Blade passing through
 * walls, for instance — will need a registered strategy keyed by id; none of those are
 * implementable until combat exists.
 */
export function applyUpgrade(weapon: WeaponData, upgrade: UpgradeData): WeaponData {
  const base = {
    damage: weapon.damage * (upgrade.damageMultiplier ?? NO_CHANGE),
    knockbackForce: weapon.knockbackForce * (upgrade.knockbackMultiplier ?? NO_CHANGE),
  };

  if (weapon.type === 'Ranged') {
    return {
      ...weapon,
      ...base,
      projectileCount: weapon.projectileCount + (upgrade.extraProjectiles ?? NOTHING_EXTRA),
    };
  }
  // Extra projectiles are meaningless on a melee weapon, and the tag rules keep a
  // projectile Module off one, so they are simply not applied here.
  return { ...weapon, ...base };
}
