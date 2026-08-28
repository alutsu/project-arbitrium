import { describe, expect, it } from 'vitest';
import { isAtExit } from './isAtExit';
import type { RoomExit } from './RoomTemplate';

const north: RoomExit = { direction: 'North', tileX: 16, tileY: 1 };
const south: RoomExit = { direction: 'South', tileX: 16, tileY: 16 };
const east: RoomExit = { direction: 'East', tileX: 30, tileY: 9 };
const west: RoomExit = { direction: 'West', tileX: 1, tileY: 9 };

describe('isAtExit', () => {
  it('triggers when standing on the door tile', () => {
    expect(isAtExit({ x: 16, y: 1 }, north)).toBe(true);
    expect(isAtExit({ x: 16, y: 16 }, south)).toBe(true);
    expect(isAtExit({ x: 30, y: 9 }, east)).toBe(true);
    expect(isAtExit({ x: 1, y: 9 }, west)).toBe(true);
  });

  it('still triggers when a long frame carried the player past the door tile', () => {
    expect(isAtExit({ x: 16, y: 0 }, north)).toBe(true);
    expect(isAtExit({ x: 16, y: 17 }, south)).toBe(true);
    expect(isAtExit({ x: 31, y: 9 }, east)).toBe(true);
    expect(isAtExit({ x: 0, y: 9 }, west)).toBe(true);
  });

  it('allows the full width of the doorway', () => {
    expect(isAtExit({ x: 15, y: 1 }, north)).toBe(true);
    expect(isAtExit({ x: 17, y: 1 }, north)).toBe(true);
  });

  it('does not trigger from beside the doorway', () => {
    expect(isAtExit({ x: 13, y: 1 }, north)).toBe(false);
    expect(isAtExit({ x: 20, y: 0 }, north)).toBe(false);
    expect(isAtExit({ x: 30, y: 4 }, east)).toBe(false);
  });

  it('does not trigger from short of the door', () => {
    expect(isAtExit({ x: 16, y: 2 }, north)).toBe(false);
    expect(isAtExit({ x: 16, y: 15 }, south)).toBe(false);
    expect(isAtExit({ x: 29, y: 9 }, east)).toBe(false);
    expect(isAtExit({ x: 2, y: 9 }, west)).toBe(false);
  });
});
