import { describe, expect, it } from 'vitest';
import { SeededRng } from './SeededRng';

describe('SeededRng', () => {
  it('replays the same sequence for the same seed', () => {
    const first = new SeededRng(1234);
    const second = new SeededRng(1234);
    const a = Array.from({ length: 20 }, () => first.nextInt(1000));
    const b = Array.from({ length: 20 }, () => second.nextInt(1000));
    expect(a).toEqual(b);
  });

  it('produces different sequences for different seeds', () => {
    const first = new SeededRng(1);
    const second = new SeededRng(2);
    expect(Array.from({ length: 20 }, () => first.nextInt(1000))).not.toEqual(
      Array.from({ length: 20 }, () => second.nextInt(1000)),
    );
  });

  it('stays inside the requested range', () => {
    const rng = new SeededRng(99);
    for (let draw = 0; draw < 500; draw++) {
      const value = rng.nextInt(7);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(7);
    }
  });

  it('always returns zero for a single-item range', () => {
    const rng = new SeededRng(5);
    expect([rng.nextInt(1), rng.nextInt(1), rng.nextInt(1)]).toEqual([0, 0, 0]);
  });

  it('refuses an empty range rather than returning nonsense', () => {
    expect(() => new SeededRng(1).nextInt(0)).toThrow();
    expect(() => new SeededRng(1).nextInt(-3)).toThrow();
  });
});
