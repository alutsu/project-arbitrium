import { describe, expect, it } from 'vitest';
import type { PlayerStats } from '../data/PlayerStats';
import { PlayerMovement } from './PlayerMovement';

const STATS: PlayerStats = { moveSpeedPixelsPerSecond: 200, parleyMovementPenalty: 0.3 };
const movement = new PlayerMovement(STATS);

const magnitudeOf = (velocity: { x: number; y: number }): number =>
  Math.hypot(velocity.x, velocity.y);

describe('PlayerMovement', () => {
  it('stands still with no axis input', () => {
    expect(movement.resolveVelocity({ moveAxes: { x: 0, y: 0 }, isParleying: false })).toEqual({
      x: 0,
      y: 0,
    });
  });

  it('moves at the base speed on a cardinal axis', () => {
    const velocity = movement.resolveVelocity({ moveAxes: { x: 1, y: 0 }, isParleying: false });
    expect(velocity.x).toBeCloseTo(200);
    expect(velocity.y).toBeCloseTo(0);
  });

  it('normalizes diagonal input so it does not outrun a cardinal', () => {
    const diagonal = movement.resolveVelocity({ moveAxes: { x: 1, y: 1 }, isParleying: false });
    expect(magnitudeOf(diagonal)).toBeCloseTo(200);
    expect(diagonal.x).toBeCloseTo(200 / Math.SQRT2);
    expect(diagonal.y).toBeCloseTo(200 / Math.SQRT2);
  });

  it('normalizes a partial axis magnitude up to full speed', () => {
    const velocity = movement.resolveVelocity({ moveAxes: { x: 0.5, y: 0 }, isParleying: false });
    expect(velocity.x).toBeCloseTo(200);
  });

  it('keeps every direction at the same speed', () => {
    const directions = [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
      { x: 1, y: 1 },
      { x: -1, y: 1 },
      { x: 1, y: -1 },
      { x: -1, y: -1 },
    ];
    for (const moveAxes of directions) {
      const velocity = movement.resolveVelocity({ moveAxes, isParleying: false });
      expect(magnitudeOf(velocity)).toBeCloseTo(200);
    }
  });

  it('applies the parley movement penalty while bargaining (GDD 2.2.1)', () => {
    const velocity = movement.resolveVelocity({ moveAxes: { x: 1, y: 0 }, isParleying: true });
    expect(velocity.x).toBeCloseTo(140);
  });

  it('applies the parley penalty to diagonals too', () => {
    const velocity = movement.resolveVelocity({ moveAxes: { x: -1, y: 1 }, isParleying: true });
    expect(magnitudeOf(velocity)).toBeCloseTo(140);
  });

  it('reads the penalty from stats rather than hardcoding it', () => {
    const halfSpeed = new PlayerMovement({
      moveSpeedPixelsPerSecond: 200,
      parleyMovementPenalty: 0.5,
    });
    const velocity = halfSpeed.resolveVelocity({ moveAxes: { x: 1, y: 0 }, isParleying: true });
    expect(velocity.x).toBeCloseTo(100);
  });
});
