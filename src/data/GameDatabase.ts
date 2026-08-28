import type { BargainData } from '../bargain/BargainData';
import type { DungeonSettings } from '../dungeon/DungeonSettings';
import type { RoomTemplate } from '../dungeon/RoomTemplate';
import type { EncounterSettings } from '../encounter/EncounterSettings';
import type { EnemyData } from '../enemy/EnemyData';
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
/** Everything the database is built from, as a named group rather than a long signature. */
export interface GameRecords {
  readonly weapons: readonly WeaponData[];
  readonly upgrades: readonly UpgradeData[];
  readonly playerStats: PlayerStats;
  readonly bargain: BargainData;
  readonly dungeon: DungeonSettings;
  readonly roomTemplates: readonly RoomTemplate[];
  readonly enemies: readonly EnemyData[];
  readonly encounter: EncounterSettings;
}

export class GameDatabase {
  private constructor(
    private readonly weaponsById: ReadonlyMap<WeaponId, WeaponData>,
    private readonly upgradesById: ReadonlyMap<UpgradeId, UpgradeData>,
    private readonly records: GameRecords,
  ) {}

  public static create(records: GameRecords): Result<GameDatabase> {
    const { weapons, upgrades } = records;
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

    // Cross-record check: a starting weapon naming nothing would only surface as an
    // undefined the first time a run began.
    if (!weaponsById.has(records.playerStats.startingWeaponId)) {
      return err(
        `player.json names a starting weapon "${records.playerStats.startingWeaponId}" that weapons.json does not define`,
      );
    }

    return ok(new GameDatabase(weaponsById, upgradesById, records));
  }

  public get playerStats(): PlayerStats {
    return this.records.playerStats;
  }

  public get bargain(): BargainData {
    return this.records.bargain;
  }

  public get dungeon(): DungeonSettings {
    return this.records.dungeon;
  }

  public get roomTemplates(): readonly RoomTemplate[] {
    return this.records.roomTemplates;
  }

  public get enemies(): readonly EnemyData[] {
    return this.records.enemies;
  }

  public get encounter(): EncounterSettings {
    return this.records.encounter;
  }

  public get weapons(): readonly WeaponData[] {
    return [...this.weaponsById.values()];
  }

  public get upgrades(): readonly UpgradeData[] {
    return [...this.upgradesById.values()];
  }

  /** The weapon a run begins with, proven to exist when the database was built. */
  public startingWeapon(): WeaponData {
    return this.weapon(this.records.playerStats.startingWeaponId);
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
