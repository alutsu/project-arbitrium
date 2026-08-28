import { describe, expect, it } from 'vitest';
import { parseBargainData } from './parseBargainData';

const VALID = {
  aggroDelayMs: 1500,
  lateCostMultiplier: 1.5,
  holdDurationMs: 900,
  sphereRadiusPixels: 170,
  demands: [
    { tier: 'Normal', cost: { kind: 'Gold', fractionOfGold: 0.15 } },
    { tier: 'Normal', cost: { kind: 'Vitality', damage: 8 } },
  ],
};

const errorOf = (raw: unknown): string => {
  const outcome = parseBargainData(raw);
  if (outcome.ok) throw new Error('expected parsing to fail');
  return outcome.error;
};

describe('parseBargainData', () => {
  it('parses the settings and both kinds of demand', () => {
    const outcome = parseBargainData(VALID);
    if (!outcome.ok) throw new Error(outcome.error);
    expect(outcome.value.settings.aggroDelayMs).toBe(1500);
    expect(outcome.value.demands).toHaveLength(2);
    expect(outcome.value.demands[1]?.cost).toEqual({ kind: 'Vitality', damage: 8 });
  });

  it('rejects a late multiplier that would make waiting cheaper', () => {
    expect(errorOf({ ...VALID, lateCostMultiplier: 0.9 })).toContain('at least 1');
  });

  it('rejects a hold or sphere that would make Parley free', () => {
    expect(errorOf({ ...VALID, holdDurationMs: 0 })).toContain('holdDurationMs');
    expect(errorOf({ ...VALID, sphereRadiusPixels: 0 })).toContain('sphereRadiusPixels');
  });

  it('requires at least one demand, or no enemy could ever be bargained with', () => {
    expect(errorOf({ ...VALID, demands: [] })).toContain('non-empty');
  });

  it('rejects a gold demand outside a sensible fraction', () => {
    const bad = (fractionOfGold: number): unknown => ({
      ...VALID,
      demands: [{ tier: 'Normal', cost: { kind: 'Gold', fractionOfGold } }],
    });
    expect(errorOf(bad(0))).toContain('fractionOfGold');
    expect(errorOf(bad(1.5))).toContain('fractionOfGold');
  });

  it('rejects an unknown cost kind or tier, naming the demand', () => {
    expect(
      errorOf({ ...VALID, demands: [{ tier: 'Normal', cost: { kind: 'Dignity' } }] }),
    ).toContain('demands[0]');
    expect(
      errorOf({
        ...VALID,
        demands: [{ tier: 'Legendary', cost: { kind: 'Gold', fractionOfGold: 0.1 } }],
      }),
    ).toContain('tier');
  });
});
