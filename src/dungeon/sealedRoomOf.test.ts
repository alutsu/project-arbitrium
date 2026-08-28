import { describe, expect, it } from 'vitest';
import type { DungeonRoom } from './Dungeon';
import { RoomAnalyzer } from './RoomAnalyzer';
import type { RoomTemplate, RoomTemplateId } from './RoomTemplate';
import { sealedRoomOf } from './sealedRoomOf';

const WALL = 2;
const FLOOR = 1;
const WIDTH = 5;

/** A 5x5 room with a door gap on the north and south walls. */
const template = (): RoomTemplate => {
  const rows = ['##.##', '#...#', '#...#', '#...#', '##.##'];
  return {
    id: 'test' as RoomTemplateId,
    widthInTiles: WIDTH,
    heightInTiles: rows.length,
    tileWidth: 40,
    tileHeight: 40,
    tiles: rows.flatMap((row) => Array.from(row).map((cell) => (cell === '#' ? WALL : FLOOR))),
    exits: [
      { direction: 'North', tileX: 2, tileY: 1 },
      { direction: 'South', tileX: 2, tileY: 3 },
    ],
    tags: ['Arena'],
  };
};

const room = (connections: DungeonRoom['connections']): DungeonRoom => ({
  coordinate: { x: 0, y: 0 },
  template: template(),
  connections,
});

const analyzer = new RoomAnalyzer();

describe('sealedRoomOf', () => {
  it('walls up the doorway that leads nowhere', () => {
    const sealed = sealedRoomOf(room(['North']));
    expect(sealed.tiles[0 * WIDTH + 2]).toBe(FLOOR);
    expect(sealed.tiles[4 * WIDTH + 2]).toBe(WALL);
  });

  it('keeps everything else about the template', () => {
    const sealed = sealedRoomOf(room(['North']));
    expect(sealed.id).toBe('test');
    expect(sealed.exits).toHaveLength(2);
    expect(sealed.widthInTiles).toBe(WIDTH);
  });

  it('stops the analyzer treating a sealed doorway as somewhere to stand', () => {
    const target = room(['North']);
    const raw = analyzer.analyze(target.template);
    const sealed = analyzer.analyze(sealedRoomOf(target));

    // The raw template offers the southern gap as floor; the sealed room does not.
    expect(raw.kindAt({ x: 2, y: 4 })).toBeDefined();
    expect(sealed.kindAt({ x: 2, y: 4 })).toBeUndefined();
    expect(sealed.kindAt({ x: 2, y: 0 })).toBeDefined();
  });
});
