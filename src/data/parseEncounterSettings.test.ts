import { describe, expect, it } from 'vitest';
import { parseEncounterSettings } from './parseEncounterSettings';

const VALID = { minEnemiesPerRoom: 2, maxEnemiesPerRoom: 4, spawnClearanceTiles: 4 };

const errorOf = (raw: unknown): string => {
  const outcome = parseEncounterSettings(raw);
  if (outcome.ok) throw new Error('expected parsing to fail');
  return outcome.error;
};

describe('parseEncounterSettings', () => {
  it('parses valid settings', () => {
    expect(parseEncounterSettings(VALID)).toEqual({ ok: true, value: VALID });
  });

  it('allows a room population of zero, for an empty room', () => {
    expect(parseEncounterSettings({ ...VALID, minEnemiesPerRoom: 0 }).ok).toBe(true);
  });

  it('rejects a maximum below the minimum', () => {
    expect(errorOf({ ...VALID, maxEnemiesPerRoom: 1 })).toContain('maxEnemiesPerRoom');
  });

  it('rejects fractional or negative counts', () => {
    expect(errorOf({ ...VALID, minEnemiesPerRoom: 1.5 })).toContain('minEnemiesPerRoom');
    expect(errorOf({ ...VALID, spawnClearanceTiles: -1 })).toContain('spawnClearanceTiles');
  });

  it('rejects a non-object', () => {
    expect(errorOf([VALID])).toContain('object');
  });
});
