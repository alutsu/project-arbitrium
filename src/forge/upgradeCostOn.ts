import type { UpgradeData } from '../data/UpgradeData';

/** The 1.5 in `UpgradeCost = BaseCost * (CurrentFloor * 1.5)` (GDD 8.2). */
const FLOOR_COST_SCALE = 1.5;

/**
 * What a Module costs on a given floor (GDD 8.2). Deeper floors charge more, which is
 * what keeps selling weapons worthwhile as a run goes on.
 *
 * Rounded up, so a price is always a whole number of coins.
 */
export function upgradeCostOn(upgrade: UpgradeData, floor: number): number {
  return Math.ceil(upgrade.goldCost * (floor * FLOOR_COST_SCALE));
}
