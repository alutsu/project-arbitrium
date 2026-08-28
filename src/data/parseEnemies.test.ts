import { describe, expect, it } from 'vitest';
import { parseEnemies } from './parseEnemies';

const GRUNT = {
  id: 'grunt',
  name: 'Grunt',
  tier: 'Normal',
  spriteKey: 'enemy_grunt',
  weight: 6,
  vitality: 18,
  goldReward: 9,
  roomTags: ['Arena', 'Corridor'],
  prefers: ['Open', 'Cover'],
  behaviour: {
    kind: 'Melee',
    moveSpeedPixelsPerSecond: 95,
    damage: 7,
    attackRate: 0.9,
    reachPixels: 34,
  },
  canBargain: true,
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

  it('rejects an enemy that dies on spawn or pays a negative reward', () => {
    expect(errorOf([{ ...GRUNT, vitality: 0 }])).toContain('vitality');
    expect(errorOf([{ ...GRUNT, goldReward: -1 }])).toContain('goldReward');
  });

  it('rejects unknown tiers, room tags and tile kinds', () => {
    expect(errorOf([{ ...GRUNT, tier: 'Mythic' }])).toContain('tier');
    expect(errorOf([{ ...GRUNT, roomTags: ['Cathedral'] }])).toContain('roomTags');
    expect(errorOf([{ ...GRUNT, prefers: ['Ceiling'] }])).toContain('prefers');
  });

  it('parses a stationary ranged behaviour', () => {
    const turret = {
      ...GRUNT,
      id: 'turret',
      behaviour: {
        kind: 'StationaryRanged',
        damage: 5,
        attackRate: 0.7,
        projectileSpeed: 300,
        rangePixels: 340,
        blastRadiusPixels: 20,
      },
    };
    const outcome = parseEnemies([turret]);
    if (!outcome.ok) throw new Error(outcome.error);
    expect(outcome.value[0]?.behaviour.kind).toBe('StationaryRanged');
  });

  it('rejects a behaviour missing the fields its kind needs', () => {
    const noReach = { ...GRUNT, behaviour: { ...GRUNT.behaviour, reachPixels: 0 } };
    expect(errorOf([noReach])).toContain('reach');
    const noRange = {
      ...GRUNT,
      behaviour: {
        kind: 'StationaryRanged',
        damage: 5,
        attackRate: 1,
        projectileSpeed: 300,
        blastRadiusPixels: 20,
      },
    };
    expect(errorOf([noRange])).toContain('rangePixels');
  });

  it('rejects an enemy that cannot hurt anyone', () => {
    expect(errorOf([{ ...GRUNT, behaviour: { ...GRUNT.behaviour, damage: 0 } }])).toContain(
      'damage',
    );
  });

  it('parses a Blink behaviour', () => {
    const stalker = {
      ...GRUNT,
      id: 'stalker',
      behaviour: {
        kind: 'Blink',
        damage: 11,
        attackRate: 0.8,
        reachPixels: 36,
        blinkRate: 0.5,
        blinkStepTiles: 4,
      },
    };
    const outcome = parseEnemies([stalker]);
    if (!outcome.ok) throw new Error(outcome.error);
    expect(outcome.value[0]?.behaviour.kind).toBe('Blink');
  });

  it('treats an enemy as negotiable unless it says otherwise (GDD 2.2.2)', () => {
    const outcome = parseEnemies([GRUNT]);
    if (!outcome.ok) throw new Error(outcome.error);
    expect(outcome.value[0]?.canBargain).toBe(true);

    const boss = parseEnemies([{ ...GRUNT, canBargain: false }]);
    if (!boss.ok) throw new Error(boss.error);
    expect(boss.value[0]?.canBargain).toBe(false);
  });

  it('rejects a maxPerRoom below one', () => {
    expect(errorOf([{ ...GRUNT, maxPerRoom: 0 }])).toContain('maxPerRoom');
  });

  it('names the offending index', () => {
    expect(errorOf([GRUNT, { ...GRUNT, weight: 'lots' }])).toContain('enemies[1]');
  });
});
