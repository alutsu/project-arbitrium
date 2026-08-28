import { describe, expect, it } from 'vitest';
import { SeededRng } from '../core/SeededRng';
import { DATA_KEYS, roomCacheKey } from '../data/dataKeys';
import type { JsonSource } from '../data/JsonSource';
import { loadGameData } from '../data/loadGameData';
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
import { DungeonGenerator } from './DungeonGenerator';
import { coordinateKey } from './GridCoordinate';

const entries: Readonly<Record<string, unknown>> = {
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
};

const source: JsonSource = { read: (key) => entries[key] };

const buildFloor = () => {
  const data = loadGameData(source);
  if (!data.ok) throw new Error(data.error);
  const floor = new DungeonGenerator({
    templates: data.value.roomTemplates,
    rng: new SeededRng(data.value.dungeon.seed),
    roomCount: data.value.dungeon.roomsPerFloor,
  }).generate();
  if (!floor.ok) throw new Error(floor.error);
  return { dungeon: floor.value, settings: data.value.dungeon };
};

describe('the shipped floor', () => {
  it('has the number of rooms the settings ask for', () => {
    const { dungeon, settings } = buildFloor();
    expect(dungeon.rooms).toHaveLength(settings.roomsPerFloor);
  });

  it('rebuilds identically from the shipped seed', () => {
    const shape = (): string[] =>
      buildFloor()
        .dungeon.rooms.map(
          (room) =>
            `${coordinateKey(room.coordinate)} ${room.template.id} [${room.connections.join('|')}]`,
        )
        .sort();
    expect(shape()).toEqual(shape());
  });

  it('lets the player leave the entrance', () => {
    const { dungeon } = buildFloor();
    const entrance = dungeon.roomAt(dungeon.start);
    expect(entrance?.connections.length).toBeGreaterThan(0);
  });

  it('connects every room mutually', () => {
    const { dungeon } = buildFloor();
    const links = dungeon.rooms.flatMap((room) =>
      room.connections.map((direction) => dungeon.neighbourOf(room.coordinate, direction)),
    );
    expect(links.length).toBeGreaterThan(0);
    expect(links.filter((room) => room === undefined)).toEqual([]);
  });
});
