import { describe, expect, it } from 'vitest';
import { FloorProgress } from './FloorProgress';

const HERE = { x: 0, y: 0 };
const THERE = { x: 1, y: -2 };

describe('FloorProgress', () => {
  it('starts with nothing cleared or liquidated', () => {
    const progress = new FloorProgress();
    expect(progress.isCleared(HERE)).toBe(false);
    expect(progress.isLiquidated(HERE)).toBe(false);
    expect(progress.clearedCount).toBe(0);
  });

  it('remembers a cleared room by value, not by object identity', () => {
    const progress = new FloorProgress();
    progress.markCleared({ x: 0, y: 0 });
    expect(progress.isCleared({ x: 0, y: 0 })).toBe(true);
  });

  it('keeps rooms separate', () => {
    const progress = new FloorProgress();
    progress.markCleared(HERE);
    expect(progress.isCleared(THERE)).toBe(false);
  });

  it('tracks clearing and liquidating independently', () => {
    const progress = new FloorProgress();
    progress.markCleared(HERE);
    expect(progress.isLiquidated(HERE)).toBe(false);
    progress.markLiquidated(HERE);
    expect(progress.isLiquidated(HERE)).toBe(true);
  });

  it('does not double-count a room cleared twice', () => {
    const progress = new FloorProgress();
    progress.markCleared(HERE);
    progress.markCleared(HERE);
    expect(progress.clearedCount).toBe(1);
  });
});
