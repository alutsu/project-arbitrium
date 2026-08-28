import { err, type Result } from '../core/Result';
import { DATA_KEYS } from './dataKeys';
import { GameDatabase } from './GameDatabase';
import type { JsonSource } from './JsonSource';
import { parsePlayerStats } from './parsePlayerStats';
import { parseUpgrades } from './parseUpgrades';
import { parseWeapons } from './parseWeapons';

/**
 * Reads every data file from `source`, validates it, and assembles the database.
 * Returns the first failure rather than a half-built registry.
 */
export function loadGameData(source: JsonSource): Result<GameDatabase> {
  const weapons = parseWeapons(source.read(DATA_KEYS.weapons));
  if (!weapons.ok) return err(weapons.error);

  const upgrades = parseUpgrades(source.read(DATA_KEYS.upgrades));
  if (!upgrades.ok) return err(upgrades.error);

  const playerStats = parsePlayerStats(source.read(DATA_KEYS.playerStats));
  if (!playerStats.ok) return err(playerStats.error);

  return GameDatabase.create(weapons.value, upgrades.value, playerStats.value);
}
