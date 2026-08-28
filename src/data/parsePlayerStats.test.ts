import { describe, expect, it } from 'vitest';
import { parsePlayerStats } from './parsePlayerStats';

const STATS = { moveSpeedPixelsPerSecond: 220, parleyMovementPenalty: 0.3 };

const errorOf = (raw: unknown): string => {
  const outcome = parsePlayerStats(raw);
  if (outcome.ok) throw new Error('expected parsing to fail');
  return outcome.error;
};

describe('parsePlayerStats', () => {
  it('parses valid stats', () => {
    expect(parsePlayerStats(STATS)).toEqual({ ok: true, value: STATS });
  });

  it('rejects a non-object', () => {
    expect(errorOf([STATS])).toContain('object');
  });

  it('rejects a move speed that would leave the player unable to move', () => {
    expect(errorOf({ ...STATS, moveSpeedPixelsPerSecond: 0 })).toContain('greater than zero');
  });

  it('rejects a parley penalty outside the range that makes sense', () => {
    expect(errorOf({ ...STATS, parleyMovementPenalty: 1 })).toContain('below 1');
    expect(errorOf({ ...STATS, parleyMovementPenalty: -0.1 })).toContain('at least 0');
  });
});
