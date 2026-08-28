import { describe, expect, it } from 'vitest';
import type { PlayerStats } from '../config/playerStats';
import { PLAYER_STATS } from '../config/playerStats';
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

  it('moves at full speed on a cardinal axis', () => {
    const velocity = movement.resolveVelocity({ moveAxes: { x: 1, y: 0 }, isParleying: false });
    expect(velocity).toEqual({ x: 200, y: 0 });
  });

  it('does not let a diagonal outrun a cardinal', () => {
    const diagonal = movement.resolveVelocity({ moveAxes: { x: 1, y: 1 }, isParleying: false });
    expect(magnitudeOf(diagonal)).toBeCloseTo(200);
    expect(diagonal.x).toBeCloseTo(200 / Math.SQRT2);
    expect(diagonal.y).toBeCloseTo(200 / Math.SQRT2);
  });

  it('preserves a partial analog tilt as partial speed', () => {
    const velocity = movement.resolveVelocity({ moveAxes: { x: 0.5, y: 0 }, isParleying: false });
    expect(magnitudeOf(velocity)).toBeCloseTo(100);
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

  it('keeps the shipped parley penalty at the value the GDD specifies', () => {
    expect(PLAYER_STATS.parleyMovementPenalty).toBe(0.3);
  });
});
