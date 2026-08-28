import { describe, expect, it } from 'vitest';
import type { PlayerStats } from '../config/playerStats';
import { PLAYER_STATS } from '../config/playerStats';
import { PlayerMovement } from './PlayerMovement';

const STATS: PlayerStats = { moveSpeedPixelsPerSecond: 200, parleyMovementPenalty: 0.3 };
const movement = new PlayerMovement(STATS);

/** One second of frames, so expected distances read as plain pixels-per-second. */
const ONE_SECOND_MS = 1000;
const HALF_SECOND_MS = 500;

const magnitudeOf = (displacement: { x: number; y: number }): number =>
  Math.hypot(displacement.x, displacement.y);

describe('PlayerMovement', () => {
  it('stands still with no axis input', () => {
    const displacement = movement.resolveDisplacement(
      { moveAxes: { x: 0, y: 0 }, isParleying: false },
      ONE_SECOND_MS,
    );
    expect(displacement).toEqual({ x: 0, y: 0 });
  });

  it('travels the base speed over one second on a cardinal axis', () => {
    const displacement = movement.resolveDisplacement(
      { moveAxes: { x: 1, y: 0 }, isParleying: false },
      ONE_SECOND_MS,
    );
    expect(displacement.x).toBeCloseTo(200);
    expect(displacement.y).toBeCloseTo(0);
  });

  it('scales the distance by the frame delta', () => {
    const displacement = movement.resolveDisplacement(
      { moveAxes: { x: 1, y: 0 }, isParleying: false },
      HALF_SECOND_MS,
    );
    expect(displacement.x).toBeCloseTo(100);
  });

  it('covers the same ground at any frame rate', () => {
    const intent = { moveAxes: { x: 1, y: 0 }, isParleying: false };
    const oneLongFrame = movement.resolveDisplacement(intent, 32);
    const twoShortFrames =
      movement.resolveDisplacement(intent, 16).x + movement.resolveDisplacement(intent, 16).x;
    expect(oneLongFrame.x).toBeCloseTo(twoShortFrames);
  });

  it('normalizes diagonal input so it does not outrun a cardinal', () => {
    const diagonal = movement.resolveDisplacement(
      { moveAxes: { x: 1, y: 1 }, isParleying: false },
      ONE_SECOND_MS,
    );
    expect(magnitudeOf(diagonal)).toBeCloseTo(200);
    expect(diagonal.x).toBeCloseTo(200 / Math.SQRT2);
    expect(diagonal.y).toBeCloseTo(200 / Math.SQRT2);
  });

  it('normalizes a partial axis magnitude up to full speed', () => {
    const displacement = movement.resolveDisplacement(
      { moveAxes: { x: 0.5, y: 0 }, isParleying: false },
      ONE_SECOND_MS,
    );
    expect(displacement.x).toBeCloseTo(200);
  });

  it('applies the parley movement penalty while bargaining (GDD 2.2.1)', () => {
    const displacement = movement.resolveDisplacement(
      { moveAxes: { x: 1, y: 0 }, isParleying: true },
      ONE_SECOND_MS,
    );
    expect(displacement.x).toBeCloseTo(140);
  });

  it('applies the parley penalty to diagonals too', () => {
    const displacement = movement.resolveDisplacement(
      { moveAxes: { x: -1, y: 1 }, isParleying: true },
      ONE_SECOND_MS,
    );
    expect(magnitudeOf(displacement)).toBeCloseTo(140);
  });

  it('reads the penalty from stats rather than hardcoding it', () => {
    const halfSpeed = new PlayerMovement({
      moveSpeedPixelsPerSecond: 200,
      parleyMovementPenalty: 0.5,
    });
    const displacement = halfSpeed.resolveDisplacement(
      { moveAxes: { x: 1, y: 0 }, isParleying: true },
      ONE_SECOND_MS,
    );
    expect(displacement.x).toBeCloseTo(100);
  });

  it('keeps the shipped parley penalty at the value the GDD specifies', () => {
    expect(PLAYER_STATS.parleyMovementPenalty).toBe(0.3);
  });
});
