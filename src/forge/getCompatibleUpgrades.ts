import type { UpgradeData } from '../data/UpgradeData';
import type { WeaponData } from '../data/WeaponData';

/**
 * The Modules that may be fitted to this weapon (GDD 2.4.1, 9.1): it must carry every
 * `requiredTag` and none of the `forbiddenTags`.
 *
 * This is the whole compatibility system. It is data, not code: a new Module becomes
 * available by adding a row to `upgrades.json` (CLAUDE.md 3.2).
 */
export function getCompatibleUpgrades(
  weapon: WeaponData,
  upgrades: readonly UpgradeData[],
): readonly UpgradeData[] {
  return upgrades.filter(
    (upgrade) =>
      upgrade.requiredTags.every((tag) => weapon.tags.includes(tag)) &&
      !upgrade.forbiddenTags.some((tag) => weapon.tags.includes(tag)),
  );
}
