import { describe, expect, it } from 'vitest';
import { isWithinSwing, type Swing } from './isWithinSwing';

const swing = (aimRadians: number): Swing => ({
  origin: { x: 100, y: 100 },
  aimRadians,
  swingArc: 90,
  reachPixels: 60,
});

const AIMING_RIGHT = swing(0);
const AIMING_UP = swing(-Math.PI / 2);

describe('isWithinSwing', () => {
  it('connects with a target straight ahead, inside reach', () => {
    expect(isWithinSwing(AIMING_RIGHT, { x: 140, y: 100 })).toBe(true);
  });

  it('misses a target beyond reach', () => {
    expect(isWithinSwing(AIMING_RIGHT, { x: 200, y: 100 })).toBe(false);
  });

  it('connects across the width of the arc', () => {
    // 45 degrees either side of the aim is the edge of a 90 degree arc.
    expect(isWithinSwing(AIMING_RIGHT, { x: 130, y: 129 })).toBe(true);
    expect(isWithinSwing(AIMING_RIGHT, { x: 130, y: 71 })).toBe(true);
  });

  it('misses a target beside the player, outside the arc', () => {
    expect(isWithinSwing(AIMING_RIGHT, { x: 100, y: 150 })).toBe(false);
  });

  it('misses a target behind the player', () => {
    expect(isWithinSwing(AIMING_RIGHT, { x: 60, y: 100 })).toBe(false);
  });

  it('follows the aim rather than assuming a direction', () => {
    expect(isWithinSwing(AIMING_UP, { x: 100, y: 60 })).toBe(true);
    expect(isWithinSwing(AIMING_UP, { x: 140, y: 100 })).toBe(false);
  });

  it('handles an aim that wraps past PI without losing the arc', () => {
    const wrapped = swing(Math.PI - 0.05);
    expect(isWithinSwing(wrapped, { x: 60, y: 103 })).toBe(true);
  });

  it('connects with a target standing on the player', () => {
    expect(isWithinSwing(AIMING_RIGHT, { x: 100, y: 100 })).toBe(true);
  });
});
