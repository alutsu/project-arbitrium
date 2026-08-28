import { describe, expect, it } from 'vitest';
import { roomSeed } from './roomSeed';

describe('roomSeed', () => {
  it('gives the same room the same seed every time', () => {
    expect(roomSeed(1234, { x: 2, y: -3 })).toBe(roomSeed(1234, { x: 2, y: -3 }));
  });

  it('gives neighbouring rooms different seeds', () => {
    const here = roomSeed(1234, { x: 0, y: 0 });
    expect(roomSeed(1234, { x: 1, y: 0 })).not.toBe(here);
    expect(roomSeed(1234, { x: 0, y: 1 })).not.toBe(here);
    expect(roomSeed(1234, { x: -1, y: 0 })).not.toBe(here);
  });

  it('does not confuse a room with its transpose', () => {
    expect(roomSeed(7, { x: 3, y: 5 })).not.toBe(roomSeed(7, { x: 5, y: 3 }));
  });

  it('changes with the floor seed', () => {
    expect(roomSeed(1, { x: 2, y: 2 })).not.toBe(roomSeed(2, { x: 2, y: 2 }));
  });

  it('stays a usable unsigned integer', () => {
    for (const coordinate of [
      { x: 0, y: 0 },
      { x: -40, y: 31 },
      { x: 9999, y: -9999 },
    ]) {
      const seed = roomSeed(20260828, coordinate);
      expect(Number.isInteger(seed)).toBe(true);
      expect(seed).toBeGreaterThanOrEqual(0);
    }
  });
});
