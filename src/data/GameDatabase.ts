import { err, ok, type Result } from '../core/Result';
import type { PlayerStats } from './PlayerStats';
import type { UpgradeData, UpgradeId } from './UpgradeData';
import type { WeaponData, WeaponId } from './WeaponData';

/**
 * The validated game data (GDD 9.1). Phaser-free: it is built from parsed records,
 * never from a scene or a cache, so it is testable in isolation (CLAUDE.md 3.5).
 *
 * Lookups throw on an unknown id. That is a programmer error — a typo in a spawn
 * table, not a runtime condition to recover from (CLAUDE.md 4.4).
 */
export class GameDatabase {
  private constructor(
    private readonly weaponsById: ReadonlyMap<WeaponId, WeaponData>,
    private readonly upgradesById: ReadonlyMap<UpgradeId, UpgradeData>,
    public readonly playerStats: PlayerStats,
  ) {}

  public static create(
    weapons: readonly WeaponData[],
    upgrades: readonly UpgradeData[],
    playerStats: PlayerStats,
  ): Result<GameDatabase> {
    const weaponsById = new Map<WeaponId, WeaponData>();
    for (const weapon of weapons) {
      if (weaponsById.has(weapon.id)) {
        return err(`duplicate weapon id "${weapon.id}"`);
      }
      weaponsById.set(weapon.id, weapon);
    }

    const upgradesById = new Map<UpgradeId, UpgradeData>();
    for (const upgrade of upgrades) {
      if (upgradesById.has(upgrade.id)) {
        return err(`duplicate upgrade id "${upgrade.id}"`);
      }
      upgradesById.set(upgrade.id, upgrade);
    }

    return ok(new GameDatabase(weaponsById, upgradesById, playerStats));
  }

  public get weapons(): readonly WeaponData[] {
    return [...this.weaponsById.values()];
  }

  public get upgrades(): readonly UpgradeData[] {
    return [...this.upgradesById.values()];
  }

  public weapon(id: WeaponId): WeaponData {
    const weapon = this.weaponsById.get(id);
    if (weapon === undefined) {
      throw new Error(`Unknown weapon id "${id}"`);
    }
    return weapon;
  }

  public upgrade(id: UpgradeId): UpgradeData {
    const upgrade = this.upgradesById.get(id);
    if (upgrade === undefined) {
      throw new Error(`Unknown upgrade id "${id}"`);
    }
    return upgrade;
  }
}
