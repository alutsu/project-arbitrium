import { err, type Result } from '../core/Result';
import type { RoomTemplate } from '../dungeon/RoomTemplate';
import { DATA_KEYS, ROOM_TEMPLATE_IDS, roomCacheKey } from './dataKeys';
import { GameDatabase } from './GameDatabase';
import type { JsonSource } from './JsonSource';
import { parseBargainData } from './parseBargainData';
import { parseDungeonSettings } from './parseDungeonSettings';
import { parseRoomTemplate } from './parseRoomTemplate';
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

  const bargain = parseBargainData(source.read(DATA_KEYS.bargain));
  if (!bargain.ok) return err(bargain.error);

  const dungeon = parseDungeonSettings(source.read(DATA_KEYS.dungeon));
  if (!dungeon.ok) return err(dungeon.error);

  const roomTemplates: RoomTemplate[] = [];
  for (const id of ROOM_TEMPLATE_IDS) {
    const template = parseRoomTemplate(source.read(roomCacheKey(id)), id);
    if (!template.ok) return err(template.error);
    roomTemplates.push(template.value);
  }

  return GameDatabase.create({
    weapons: weapons.value,
    upgrades: upgrades.value,
    playerStats: playerStats.value,
    bargain: bargain.value,
    dungeon: dungeon.value,
    roomTemplates,
  });
}
