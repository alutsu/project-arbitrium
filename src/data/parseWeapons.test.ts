import { describe, expect, it } from 'vitest';
import { parseWeapons } from './parseWeapons';

const RANGED = {
  id: 'rusty_pistol',
  name: 'Rusty Pistol',
  type: 'Ranged',
  tags: ['Ranged', 'Projectile', 'Light'],
  spriteKey: 'weapon_rusty_pistol',
  damage: 6,
  attackRate: 4,
  knockbackForce: 40,
  goldValue: 25,
  projectileSpriteKey: 'projectile_bullet',
  projectileSpeed: 520,
  projectileCount: 1,
  spreadDegrees: 3,
  rangePixels: 500,
};

const MELEE = {
  id: 'chipped_sabre',
  name: 'Chipped Sabre',
  type: 'Melee',
  tags: ['Melee', 'Blade', 'Light'],
  spriteKey: 'weapon_chipped_sabre',
  damage: 11,
  attackRate: 2.2,
  knockbackForce: 90,
  goldValue: 30,
  swingArc: 100,
  lungeAmount: 28,
  reachPixels: 62,
};

/** Builds a copy without one field, to prove the parser requires it. */
const omit = (source: Readonly<Record<string, unknown>>, key: string): Record<string, unknown> =>
  Object.fromEntries(Object.entries(source).filter(([name]) => name !== key));

const errorOf = (raw: unknown): string => {
  const outcome = parseWeapons(raw);
  if (outcome.ok) throw new Error('expected parsing to fail');
  return outcome.error;
};

describe('parseWeapons', () => {
  it('parses a ranged weapon with its projectile fields', () => {
    const outcome = parseWeapons([RANGED]);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    const [weapon] = outcome.value;
    expect(weapon?.type).toBe('Ranged');
    if (weapon?.type !== 'Ranged') return;
    expect(weapon.projectileCount).toBe(1);
  });

  it('parses a melee weapon with its swing fields', () => {
    const outcome = parseWeapons([MELEE]);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    const [weapon] = outcome.value;
    if (weapon?.type !== 'Melee') throw new Error('expected a melee weapon');
    expect(weapon.swingArc).toBe(100);
  });

  it('rejects anything that is not an array', () => {
    expect(errorOf({ weapons: [] })).toContain('array');
  });

  it('rejects a ranged weapon with no range', () => {
    expect(errorOf([{ ...RANGED, rangePixels: 0 }])).toContain('range');
  });

  it('rejects a melee weapon that reaches nothing', () => {
    expect(errorOf([{ ...MELEE, reachPixels: 0 }])).toContain('reachPixels');
  });

  it('rejects a ranged weapon missing its projectile fields', () => {
    expect(errorOf([omit(RANGED, 'projectileSpeed')])).toContain('projectileSpeed');
  });

  it('rejects a melee weapon carrying projectile fields instead of swing fields', () => {
    expect(errorOf([{ ...omit(MELEE, 'swingArc'), projectileSpeed: 400 }])).toContain('swingArc');
  });

  it('rejects a weapon that cannot be sold', () => {
    expect(errorOf([{ ...RANGED, goldValue: 0 }])).toContain('goldValue');
    expect(errorOf([omit(RANGED, 'goldValue')])).toContain('goldValue');
  });

  it('rejects an unknown tag', () => {
    expect(errorOf([{ ...RANGED, tags: ['Ranged', 'Cursed'] }])).toContain('tags');
  });

  it('rejects a weapon whose tags disagree with its type', () => {
    expect(errorOf([{ ...MELEE, tags: ['Blade', 'Light'] }])).toContain('"Melee" tag');
    expect(errorOf([{ ...MELEE, tags: ['Melee', 'Ranged', 'Blade'] }])).toContain('"Ranged" tag');
  });

  it('names the offending index so a bad file is findable', () => {
    expect(errorOf([RANGED, { ...MELEE, damage: 'heaps' }])).toContain('weapons[1]');
  });
});
