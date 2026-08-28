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
import shippedBoss from '../../public/data/rooms/boss.json';
import shippedForge from '../../public/data/rooms/forge.json';
import shippedEncounter from '../../public/data/encounter.json';
import shippedEnemies from '../../public/data/enemies.json';
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
  [DATA_KEYS.enemies]: shippedEnemies,
  [DATA_KEYS.encounter]: shippedEncounter,
  [roomCacheKey('arena')]: shippedArena,
  [roomCacheKey('pillars')]: shippedPillars,
  [roomCacheKey('corridor-ns')]: shippedCorridorNs,
  [roomCacheKey('corridor-ew')]: shippedCorridorEw,
  [roomCacheKey('chamber-north')]: shippedChamberNorth,
  [roomCacheKey('chamber-south')]: shippedChamberSouth,
  [roomCacheKey('chamber-east')]: shippedChamberEast,
  [roomCacheKey('chamber-west')]: shippedChamberWest,
  [roomCacheKey('forge')]: shippedForge,
  [roomCacheKey('boss')]: shippedBoss,
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

  it('puts exactly one Forge on the floor, and never at the entrance (GDD 2.4)', () => {
    const { dungeon } = buildFloor();
    const forges = dungeon.rooms.filter((room) => room.template.tags.includes('Forge'));
    expect(forges).toHaveLength(1);
    expect(forges[0]?.coordinate).not.toEqual(dungeon.start);
  });

  it('puts exactly one Boss room at the furthest reach of the floor (GDD 2.2.2)', () => {
    const { dungeon } = buildFloor();
    const bosses = dungeon.rooms.filter((room) => room.template.tags.includes('Boss'));
    expect(bosses).toHaveLength(1);

    const gapTo = (room: { coordinate: { x: number; y: number } }): number =>
      Math.abs(room.coordinate.x) + Math.abs(room.coordinate.y);
    const furthest = Math.max(...dungeon.rooms.map(gapTo));
    expect(bosses[0] === undefined ? -1 : gapTo(bosses[0])).toBe(furthest);
  });

  it('never puts the Forge and the Boss in the same room', () => {
    const { dungeon } = buildFloor();
    const both = dungeon.rooms.filter(
      (room) => room.template.tags.includes('Boss') && room.template.tags.includes('Forge'),
    );
    expect(both).toEqual([]);
    expect(dungeon.rooms.filter((r) => r.template.tags.includes('Forge'))).toHaveLength(1);
  });

  it('leaves the Forge reachable', () => {
    const { dungeon } = buildFloor();
    const forge = dungeon.rooms.find((room) => room.template.tags.includes('Forge'));
    expect(forge?.connections.length).toBeGreaterThan(0);
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
