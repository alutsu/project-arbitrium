import { describe, expect, it } from 'vitest';
import shippedArena from '../../public/data/rooms/arena.json';
import shippedBargain from '../../public/data/bargain.json';
import shippedChamberEast from '../../public/data/rooms/chamber-east.json';
import shippedChamberNorth from '../../public/data/rooms/chamber-north.json';
import shippedChamberSouth from '../../public/data/rooms/chamber-south.json';
import shippedChamberWest from '../../public/data/rooms/chamber-west.json';
import shippedCorridorEw from '../../public/data/rooms/corridor-ew.json';
import shippedCorridorNs from '../../public/data/rooms/corridor-ns.json';
import shippedDungeon from '../../public/data/dungeon.json';
import shippedPillars from '../../public/data/rooms/pillars.json';
import shippedPlayer from '../../public/data/player.json';
import shippedUpgrades from '../../public/data/upgrades.json';
import shippedWeapons from '../../public/data/weapons.json';
import { DATA_KEYS, ROOM_TEMPLATE_IDS, roomCacheKey } from './dataKeys';
import type { JsonSource } from './JsonSource';
import { loadGameData } from './loadGameData';

/** The JSON below is imported from public/, so a broken data file fails the suite. */
class StubSource implements JsonSource {
  public constructor(private readonly entries: Readonly<Record<string, unknown>>) {}
  public read(key: string): unknown {
    return this.entries[key];
  }
}

const shippedSource = new StubSource({
  [DATA_KEYS.weapons]: shippedWeapons,
  [DATA_KEYS.upgrades]: shippedUpgrades,
  [DATA_KEYS.playerStats]: shippedPlayer,
  [DATA_KEYS.bargain]: shippedBargain,
  [DATA_KEYS.dungeon]: shippedDungeon,
  [roomCacheKey('arena')]: shippedArena,
  [roomCacheKey('pillars')]: shippedPillars,
  [roomCacheKey('corridor-ns')]: shippedCorridorNs,
  [roomCacheKey('corridor-ew')]: shippedCorridorEw,
  [roomCacheKey('chamber-north')]: shippedChamberNorth,
  [roomCacheKey('chamber-south')]: shippedChamberSouth,
  [roomCacheKey('chamber-east')]: shippedChamberEast,
  [roomCacheKey('chamber-west')]: shippedChamberWest,
});

describe('loadGameData', () => {
  it('loads the data files that ship with the game', () => {
    const outcome = loadGameData(shippedSource);
    if (!outcome.ok) throw new Error(outcome.error);
    expect(outcome.value.weapons.length).toBeGreaterThan(0);
    expect(outcome.value.upgrades.length).toBeGreaterThan(0);
  });

  it('ships every room template listed in the manifest, and they all validate', () => {
    const outcome = loadGameData(shippedSource);
    if (!outcome.ok) throw new Error(outcome.error);
    expect(outcome.value.roomTemplates).toHaveLength(ROOM_TEMPLATE_IDS.length);
    for (const template of outcome.value.roomTemplates) {
      expect(template.exits.length).toBeGreaterThan(0);
      expect(template.tiles).toHaveLength(template.widthInTiles * template.heightInTiles);
    }
  });

  it('ships enough branching templates to build a floor', () => {
    const outcome = loadGameData(shippedSource);
    if (!outcome.ok) throw new Error(outcome.error);
    const branching = outcome.value.roomTemplates.filter((t) => t.exits.length >= 2);
    expect(branching.length).toBeGreaterThan(1);
  });

  it('ships the Aggro Delay and late multiplier the GDD specifies (4.1.1)', () => {
    const outcome = loadGameData(shippedSource);
    if (!outcome.ok) throw new Error(outcome.error);
    expect(outcome.value.bargain.settings.aggroDelayMs).toBe(1500);
    expect(outcome.value.bargain.settings.lateCostMultiplier).toBe(1.5);
  });

  it('ships the movement values the GDD specifies (3.3.1)', () => {
    const outcome = loadGameData(shippedSource);
    if (!outcome.ok) throw new Error(outcome.error);
    expect(outcome.value.playerStats.parleyMovementPenalty).toBe(0.3);
    expect(outcome.value.playerStats.moveSpeedPixelsPerSecond).toBe(220);
  });

  it('ships at least one weapon of each type, so both paths have data', () => {
    const outcome = loadGameData(shippedSource);
    if (!outcome.ok) throw new Error(outcome.error);
    const types = new Set(outcome.value.weapons.map((w) => w.type));
    expect(types).toEqual(new Set(['Ranged', 'Melee']));
  });

  it('reports the first failure and does not build a partial database', () => {
    const broken = new StubSource({
      [DATA_KEYS.weapons]: shippedWeapons,
      [DATA_KEYS.upgrades]: 'not an array',
      [DATA_KEYS.playerStats]: shippedPlayer,
      [DATA_KEYS.bargain]: shippedBargain,
      [DATA_KEYS.dungeon]: shippedDungeon,
    });
    const outcome = loadGameData(broken);
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.error).toContain('upgrades.json');
  });

  it('fails when a data file is missing from the source entirely', () => {
    const outcome = loadGameData(new StubSource({}));
    expect(outcome.ok).toBe(false);
  });
});
