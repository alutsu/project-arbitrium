import { describe, expect, it } from 'vitest';
import { sealUnusedDoors } from './sealUnusedDoors';
import type { RoomTemplate, RoomTemplateId } from './RoomTemplate';

const WIDTH = 5;
const HEIGHT = 5;
const FLOOR = 1;
const WALL = 2;

/** A 5x5 room walled all round, with a one-tile door gap on each side. */
const template = (): RoomTemplate => {
  const tiles: number[] = [];
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const border = x === 0 || y === 0 || x === WIDTH - 1 || y === HEIGHT - 1;
      tiles.push(border ? WALL : FLOOR);
    }
  }
  tiles[0 * WIDTH + 2] = FLOOR; // north gap
  tiles[4 * WIDTH + 2] = FLOOR; // south gap
  tiles[2 * WIDTH + 0] = FLOOR; // west gap
  tiles[2 * WIDTH + 4] = FLOOR; // east gap

  return {
    id: 'test' as RoomTemplateId,
    widthInTiles: WIDTH,
    heightInTiles: HEIGHT,
    tileWidth: 40,
    tileHeight: 40,
    tiles,
    exits: [
      { direction: 'North', tileX: 2, tileY: 1 },
      { direction: 'South', tileX: 2, tileY: 3 },
      { direction: 'West', tileX: 1, tileY: 2 },
      { direction: 'East', tileX: 3, tileY: 2 },
    ],
    tags: ['Arena'],
  };
};

const at = (tiles: readonly number[], x: number, y: number): number | undefined =>
  tiles[y * WIDTH + x];

describe('sealUnusedDoors', () => {
  it('walls up every doorway when nothing is connected', () => {
    const sealed = sealUnusedDoors(template(), []);
    expect(at(sealed, 2, 0)).toBe(WALL);
    expect(at(sealed, 2, 4)).toBe(WALL);
    expect(at(sealed, 0, 2)).toBe(WALL);
    expect(at(sealed, 4, 2)).toBe(WALL);
  });

  it('leaves a connected doorway open', () => {
    const sealed = sealUnusedDoors(template(), ['North', 'East']);
    expect(at(sealed, 2, 0)).toBe(FLOOR);
    expect(at(sealed, 4, 2)).toBe(FLOOR);
    expect(at(sealed, 2, 4)).toBe(WALL);
    expect(at(sealed, 0, 2)).toBe(WALL);
  });

  it('leaves the floor inside the room alone', () => {
    const sealed = sealUnusedDoors(template(), []);
    expect(at(sealed, 2, 2)).toBe(FLOOR);
    expect(at(sealed, 1, 1)).toBe(FLOOR);
  });

  it('does not mutate the template it was given', () => {
    const original = template();
    sealUnusedDoors(original, []);
    expect(at(original.tiles, 2, 0)).toBe(FLOOR);
  });
});
