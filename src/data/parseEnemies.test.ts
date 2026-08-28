import { describe, expect, it } from 'vitest';
import { parseEnemies } from './parseEnemies';

const GRUNT = {
  id: 'grunt',
  name: 'Grunt',
  tier: 'Normal',
  spriteKey: 'enemy_grunt',
  weight: 6,
  roomTags: ['Arena', 'Corridor'],
  prefers: ['Open', 'Cover'],
};

const errorOf = (raw: unknown): string => {
  const outcome = parseEnemies(raw);
  if (outcome.ok) throw new Error('expected parsing to fail');
  return outcome.error;
};

describe('parseEnemies', () => {
  it('parses an enemy with its room and tile preferences', () => {
    const outcome = parseEnemies([GRUNT]);
    if (!outcome.ok) throw new Error(outcome.error);
    expect(outcome.value[0]?.roomTags).toEqual(['Arena', 'Corridor']);
    expect(outcome.value[0]?.prefers).toEqual(['Open', 'Cover']);
  });

  it('rejects a roster that is not a non-empty array', () => {
    expect(errorOf({})).toContain('array');
    expect(errorOf([])).toContain('at least one enemy');
  });

  it('rejects an enemy that could never spawn', () => {
    expect(errorOf([{ ...GRUNT, weight: 0 }])).toContain('weight');
    expect(errorOf([{ ...GRUNT, roomTags: [] }])).toContain('roomTags');
    expect(errorOf([{ ...GRUNT, prefers: [] }])).toContain('prefers');
  });

  it('rejects unknown tiers, room tags and tile kinds', () => {
    expect(errorOf([{ ...GRUNT, tier: 'Mythic' }])).toContain('tier');
    expect(errorOf([{ ...GRUNT, roomTags: ['Cathedral'] }])).toContain('roomTags');
    expect(errorOf([{ ...GRUNT, prefers: ['Ceiling'] }])).toContain('prefers');
  });

  it('names the offending index', () => {
    expect(errorOf([GRUNT, { ...GRUNT, weight: 'lots' }])).toContain('enemies[1]');
  });
});
