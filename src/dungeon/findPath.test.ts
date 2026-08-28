import { describe, expect, it } from 'vitest';
import { findPath } from './findPath';
import { NavigationGrid } from './NavigationGrid';
import type { RoomTemplate, RoomTemplateId } from './RoomTemplate';

const WALL = 2;
const FLOOR = 1;

const gridFrom = (rows: readonly string[]): NavigationGrid => {
  const template: RoomTemplate = {
    id: 'test' as RoomTemplateId,
    widthInTiles: rows[0]?.length ?? 0,
    heightInTiles: rows.length,
    tileWidth: 40,
    tileHeight: 40,
    tiles: rows.flatMap((row) => Array.from(row).map((cell) => (cell === '#' ? WALL : FLOOR))),
    exits: [{ direction: 'North', tileX: 1, tileY: 1 }],
    tags: ['Arena'],
  };
  return NavigationGrid.fromTemplate(template);
};

const OPEN = ['#####', '#...#', '#...#', '#...#', '#####'];
const SPLIT = ['#######', '#..#..#', '#..#..#', '#.....#', '#######'];
const SEALED = ['#####', '#.#.#', '#.#.#', '#.#.#', '#####'];

describe('findPath', () => {
  it('walks a straight line across open floor', () => {
    const path = findPath(gridFrom(OPEN), { x: 1, y: 1 }, { x: 3, y: 1 });
    expect(path).toEqual([
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 1 },
    ]);
  });

  it('returns just the tile when start and goal match', () => {
    expect(findPath(gridFrom(OPEN), { x: 2, y: 2 }, { x: 2, y: 2 })).toEqual([{ x: 2, y: 2 }]);
  });

  it('takes the shortest route, so the length is the manhattan distance plus one', () => {
    const path = findPath(gridFrom(OPEN), { x: 1, y: 1 }, { x: 3, y: 3 });
    expect(path).toHaveLength(5);
  });

  it('walks around a wall rather than through it', () => {
    const path = findPath(gridFrom(SPLIT), { x: 1, y: 1 }, { x: 5, y: 1 });
    expect(path).not.toBeNull();
    if (path === null) return;
    expect(path.every((tile) => !(tile.x === 3 && tile.y < 3))).toBe(true);
    // Round the bottom of the divider: 4 down-and-across plus 4 back up.
    expect(path).toHaveLength(9);
  });

  it('never steps onto a wall', () => {
    const grid = gridFrom(SPLIT);
    const path = findPath(grid, { x: 1, y: 1 }, { x: 5, y: 2 });
    if (path === null) throw new Error('expected a path');
    expect(path.every((tile) => grid.isWalkable(tile))).toBe(true);
  });

  it('reports no route when the goal is walled off', () => {
    expect(findPath(gridFrom(SEALED), { x: 1, y: 1 }, { x: 3, y: 1 })).toBeNull();
  });

  it('refuses a start or goal that is not walkable', () => {
    const grid = gridFrom(OPEN);
    expect(findPath(grid, { x: 0, y: 0 }, { x: 2, y: 2 })).toBeNull();
    expect(findPath(grid, { x: 2, y: 2 }, { x: 0, y: 0 })).toBeNull();
  });

  it('refuses a goal outside the room', () => {
    expect(findPath(gridFrom(OPEN), { x: 2, y: 2 }, { x: 99, y: 99 })).toBeNull();
  });

  it('joins consecutive tiles by a single orthogonal step', () => {
    const path = findPath(gridFrom(SPLIT), { x: 1, y: 1 }, { x: 5, y: 1 });
    if (path === null) throw new Error('expected a path');
    for (let index = 1; index < path.length; index++) {
      const previous = path[index - 1];
      const current = path[index];
      if (previous === undefined || current === undefined) throw new Error('gap in path');
      expect(Math.abs(current.x - previous.x) + Math.abs(current.y - previous.y)).toBe(1);
    }
  });
});
