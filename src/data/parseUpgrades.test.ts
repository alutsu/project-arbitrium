import { describe, expect, it } from 'vitest';
import { parseUpgrades } from './parseUpgrades';

const SPLIT_CHAMBER = {
  id: 'split_chamber',
  name: 'Split Chamber',
  goldCost: 45,
  iconKey: 'module_split_chamber',
  requiredTags: ['Projectile'],
  forbiddenTags: ['Melee'],
  extraProjectiles: 1,
};

/** Builds a copy without one field, to prove the parser requires it. */
const omit = (source: Readonly<Record<string, unknown>>, key: string): Record<string, unknown> =>
  Object.fromEntries(Object.entries(source).filter(([name]) => name !== key));

const errorOf = (raw: unknown): string => {
  const outcome = parseUpgrades(raw);
  if (outcome.ok) throw new Error('expected parsing to fail');
  return outcome.error;
};

describe('parseUpgrades', () => {
  it('parses a module with its constraints and modifiers', () => {
    const outcome = parseUpgrades([SPLIT_CHAMBER]);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.value[0]?.requiredTags).toEqual(['Projectile']);
    expect(outcome.value[0]?.extraProjectiles).toBe(1);
  });

  it('leaves an absent modifier absent rather than undefined', () => {
    const outcome = parseUpgrades([omit(SPLIT_CHAMBER, 'extraProjectiles')]);
    if (!outcome.ok) throw new Error(outcome.error);
    expect(outcome.value[0] && 'extraProjectiles' in outcome.value[0]).toBe(false);
  });

  it('rejects a modifier of the wrong type', () => {
    expect(errorOf([{ ...SPLIT_CHAMBER, extraProjectiles: 'two' }])).toContain('extraProjectiles');
    expect(errorOf([{ ...SPLIT_CHAMBER, enableExplosions: 'yes' }])).toContain('enableExplosions');
  });

  it('rejects a module that can never apply to any weapon', () => {
    const impossible = { ...SPLIT_CHAMBER, requiredTags: ['Heavy'], forbiddenTags: ['Heavy'] };
    expect(errorOf([impossible])).toContain('both required and forbidden');
  });

  it('rejects an unknown tag in either constraint list', () => {
    expect(errorOf([{ ...SPLIT_CHAMBER, requiredTags: ['Sharp'] }])).toContain('requiredTags');
    expect(errorOf([{ ...SPLIT_CHAMBER, forbiddenTags: ['Sharp'] }])).toContain('forbiddenTags');
  });

  it('names the offending index', () => {
    expect(errorOf([SPLIT_CHAMBER, { ...SPLIT_CHAMBER, goldCost: 'free' }])).toContain(
      'upgrades[1]',
    );
  });
});
