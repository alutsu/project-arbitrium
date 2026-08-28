import { describe, expect, it } from 'vitest';
import { SeededRng } from '../core/SeededRng';
import { DIRECTIONS, oppositeOf, stepFrom, type Direction } from './Direction';
import { DungeonGenerator } from './DungeonGenerator';
import type { DungeonRoom } from './Dungeon';
import { coordinateKey } from './GridCoordinate';
import type { RoomTemplate, RoomTemplateId } from './RoomTemplate';

const template = (id: string, exits: readonly Direction[]): RoomTemplate => ({
  id: id as RoomTemplateId,
  widthInTiles: 3,
  heightInTiles: 3,
  tileWidth: 40,
  tileHeight: 40,
  tiles: [2, 2, 2, 2, 1, 2, 2, 2, 2],
  exits: exits.map((direction) => ({ direction, tileX: 1, tileY: 1 })),
  tags: ['Arena'],
});

const ALL = template('arena', DIRECTIONS);
const NS = template('corridor-ns', ['North', 'South']);
const DEAD_ENDS = DIRECTIONS.map((direction) => template(`chamber-${direction}`, [direction]));
const TEMPLATES = [ALL, NS, ...DEAD_ENDS];

const generate = (seed: number, roomCount = 8) =>
  new DungeonGenerator({ templates: TEMPLATES, rng: new SeededRng(seed), roomCount }).generate();

describe('DungeonGenerator', () => {
  it('builds the same floor from the same seed (CLAUDE.md 6)', () => {
    const first = generate(20260828);
    const second = generate(20260828);
    if (!first.ok || !second.ok) throw new Error('generation failed');

    const shape = (rooms: readonly DungeonRoom[]): string[] =>
      rooms.map((room) => `${coordinateKey(room.coordinate)}:${room.template.id}`).sort();
    expect(shape(first.value.rooms)).toEqual(shape(second.value.rooms));
  });

  it('builds a different floor from a different seed', () => {
    const a = generate(1);
    const b = generate(2);
    if (!a.ok || !b.ok) throw new Error('generation failed');
    const shape = (rooms: readonly DungeonRoom[]): string[] =>
      rooms.map((room) => coordinateKey(room.coordinate)).sort();
    expect(shape(a.value.rooms)).not.toEqual(shape(b.value.rooms));
  });

  it('places exactly the requested number of rooms', () => {
    for (const seed of [1, 2, 3, 7, 99, 1234]) {
      const outcome = generate(seed, 10);
      if (!outcome.ok) throw new Error(outcome.error);
      expect(outcome.value.rooms).toHaveLength(10);
    }
  });

  it('never stacks two rooms on one grid cell', () => {
    const outcome = generate(4242, 12);
    if (!outcome.ok) throw new Error(outcome.error);
    const keys = outcome.value.rooms.map((room) => coordinateKey(room.coordinate));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('only records a connection when both rooms open onto it', () => {
    const outcome = generate(31337, 10);
    if (!outcome.ok) throw new Error(outcome.error);
    const dungeon = outcome.value;

    for (const room of dungeon.rooms) {
      for (const direction of room.connections) {
        const neighbour = dungeon.roomAt(stepFrom(room.coordinate, direction));
        expect(neighbour).toBeDefined();
        expect(neighbour?.connections).toContain(oppositeOf(direction));
      }
    }
  });

  it('leaves every room reachable from the start', () => {
    const outcome = generate(5150, 12);
    if (!outcome.ok) throw new Error(outcome.error);
    const dungeon = outcome.value;

    const seen = new Set<string>([coordinateKey(dungeon.start)]);
    const queue = [dungeon.start];
    const expand = (from: typeof dungeon.start): void => {
      const fresh = DIRECTIONS.map((direction) => dungeon.neighbourOf(from, direction))
        .filter((room) => room !== undefined)
        .filter((room) => !seen.has(coordinateKey(room.coordinate)));
      for (const room of fresh) {
        seen.add(coordinateKey(room.coordinate));
        queue.push(room.coordinate);
      }
    };
    while (queue.length > 0) {
      const current = queue.shift();
      if (current === undefined) break;
      expand(current);
    }
    expect(seen.size).toBe(dungeon.rooms.length);
  });

  it('reports failure instead of a short floor when the templates cannot branch', () => {
    const outcome = new DungeonGenerator({
      templates: [template('stub', ['North'])],
      rng: new SeededRng(1),
      roomCount: 6,
    }).generate();
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.error).toContain('branch');
  });

  it('rejects a request it cannot make sense of', () => {
    expect(
      new DungeonGenerator({ templates: TEMPLATES, rng: new SeededRng(1), roomCount: 0 }).generate()
        .ok,
    ).toBe(false);
    expect(
      new DungeonGenerator({ templates: [], rng: new SeededRng(1), roomCount: 4 }).generate().ok,
    ).toBe(false);
  });
});
