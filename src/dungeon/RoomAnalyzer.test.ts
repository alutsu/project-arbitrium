import { describe, expect, it } from 'vitest';
import { RoomAnalyzer } from './RoomAnalyzer';
import type { RoomTemplate, RoomTemplateId } from './RoomTemplate';
import type { TileKind } from './TileKind';

const WALL = 2;
const FLOOR = 1;

/** Builds a template from an ASCII picture; '#' is wall, '.' is floor. */
const room = (rows: readonly string[]): RoomTemplate => ({
  id: 'test' as RoomTemplateId,
  widthInTiles: rows[0]?.length ?? 0,
  heightInTiles: rows.length,
  tileWidth: 40,
  tileHeight: 40,
  tiles: rows.flatMap((row) => Array.from(row).map((cell) => (cell === '#' ? WALL : FLOOR))),
  exits: [{ direction: 'North', tileX: 1, tileY: 1 }],
  tags: ['Arena'],
});

const analyzer = new RoomAnalyzer();
const kindsIn = (rows: readonly string[]): ((x: number, y: number) => TileKind | undefined) => {
  const analysis = analyzer.analyze(room(rows));
  return (x, y) => analysis.kindAt({ x, y });
};

describe('RoomAnalyzer', () => {
  it('treats a tile free of adjacent walls as Open', () => {
    const kind = kindsIn(['#####', '#...#', '#...#', '#...#', '#####']);
    expect(kind(2, 2)).toBe('Open');
  });

  it('treats a tile against one wall as Cover', () => {
    const kind = kindsIn(['#######', '#.....#', '#.....#', '#######']);
    expect(kind(3, 1)).toBe('Cover');
    expect(kind(3, 2)).toBe('Cover');
  });

  it('treats two perpendicular walls as a Corner', () => {
    const kind = kindsIn(['#####', '#...#', '#...#', '#...#', '#####']);
    expect(kind(1, 1)).toBe('Corner');
    expect(kind(3, 1)).toBe('Corner');
    expect(kind(1, 3)).toBe('Corner');
    expect(kind(3, 3)).toBe('Corner');
  });

  it('does not call a corridor tile a Corner, since its walls are parallel', () => {
    const kind = kindsIn(['###', '#.#', '#.#', '#.#', '###']);
    expect(kind(1, 2)).toBe('Cover');
  });

  it('reports a wall tile as having no kind at all', () => {
    const kind = kindsIn(['###', '#.#', '###']);
    expect(kind(0, 0)).toBeUndefined();
  });

  it('lists only walkable tiles', () => {
    const analysis = analyzer.analyze(room(['#####', '#...#', '#...#', '#####']));
    expect(analysis.walkable).toHaveLength(6);
  });

  it('groups tiles by kind so spawning can query them', () => {
    const analysis = analyzer.analyze(room(['#####', '#...#', '#...#', '#...#', '#####']));
    expect(analysis.tilesOf('Corner')).toHaveLength(4);
    expect(analysis.tilesOf('Cover')).toHaveLength(4);
    expect(analysis.tilesOf('Open')).toHaveLength(1);
  });

  it('finds cover beside a free-standing pillar, away from the walls', () => {
    const analysis = analyzer.analyze(
      room(['#######', '#.....#', '#..#..#', '#.....#', '#######']),
    );
    // Beside the pillar: one adjacent wall, so cover rather than a corner.
    expect(analysis.kindAt({ x: 2, y: 2 })).toBe('Cover');
    expect(analysis.kindAt({ x: 4, y: 2 })).toBe('Cover');
    // The room's own corners are still corners.
    expect(analysis.kindAt({ x: 1, y: 1 })).toBe('Corner');
  });

  it('finds a corner in the elbow of an L-shaped pillar', () => {
    const analysis = analyzer.analyze(
      room(['########', '#......#', '#..##..#', '#...#..#', '#......#', '########']),
    );
    // Tucked into the elbow: a wall north and a wall east.
    expect(analysis.kindAt({ x: 3, y: 3 })).toBe('Corner');
  });
});
