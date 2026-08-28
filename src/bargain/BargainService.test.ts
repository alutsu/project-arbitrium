import { describe, expect, it } from 'vitest';
import { PlayerResources } from '../player/PlayerResources';
import { BargainService } from './BargainService';
import type { BargainDemand } from './BargainDemand';
import type { BargainSettings } from './BargainSettings';

const SETTINGS: BargainSettings = {
  aggroDelayMs: 1500,
  lateCostMultiplier: 1.5,
  holdDurationMs: 900,
  sphereRadiusPixels: 170,
};

const service = new BargainService(SETTINGS);

const goldDemand: BargainDemand = { tier: 'Normal', cost: { kind: 'Gold', fractionOfGold: 0.2 } };
const vitalityDemand: BargainDemand = { tier: 'Normal', cost: { kind: 'Vitality', damage: 10 } };

const DURING_AGGRO_DELAY = 1000;
const AFTER_AGGRO_DELAY = 2000;

describe('BargainService', () => {
  it('charges the listed price inside the Aggro Delay (GDD 4.1.1)', () => {
    expect(service.costFor(goldDemand, DURING_AGGRO_DELAY)).toEqual({
      kind: 'Gold',
      fractionOfGold: 0.2,
    });
    expect(service.isLate(DURING_AGGRO_DELAY)).toBe(false);
  });

  it('charges the listed price right up to the boundary', () => {
    expect(service.isLate(SETTINGS.aggroDelayMs)).toBe(false);
    expect(service.isLate(SETTINGS.aggroDelayMs + 1)).toBe(true);
  });

  it('adds 50% to a late gold demand', () => {
    expect(service.costFor(goldDemand, AFTER_AGGRO_DELAY)).toEqual({
      kind: 'Gold',
      fractionOfGold: 0.30000000000000004,
    });
  });

  it('adds 50% to a late vitality demand, rounding up to whole points', () => {
    expect(service.costFor(vitalityDemand, AFTER_AGGRO_DELAY)).toEqual({
      kind: 'Vitality',
      damage: 15,
    });
  });

  it('never demands more gold than the player has', () => {
    const greedy: BargainDemand = { tier: 'Rare', cost: { kind: 'Gold', fractionOfGold: 0.8 } };
    expect(service.costFor(greedy, AFTER_AGGRO_DELAY)).toEqual({
      kind: 'Gold',
      fractionOfGold: 1,
    });
  });

  it('settles a gold demand against the player purse', () => {
    const settled = service.settle(
      { kind: 'Gold', fractionOfGold: 0.25 },
      new PlayerResources(200, 50),
    );
    if (!settled.ok) throw new Error(settled.error);
    expect(settled.value.gold).toBe(150);
  });

  it('settles a vitality demand', () => {
    const settled = service.settle({ kind: 'Vitality', damage: 10 }, new PlayerResources(0, 50));
    if (!settled.ok) throw new Error(settled.error);
    expect(settled.value.vitality).toBe(40);
  });

  it('refuses a demand that would kill, because a Parley is 100% survival (GDD 8.3)', () => {
    const settled = service.settle({ kind: 'Vitality', damage: 10 }, new PlayerResources(0, 10));
    expect(settled.ok).toBe(false);
    if (!settled.ok) expect(settled.error).toContain('fatal');
  });

  it('allows a demand that leaves exactly one vitality, the Run Saver case (GDD 2.2.2)', () => {
    const settled = service.settle({ kind: 'Vitality', damage: 9 }, new PlayerResources(0, 10));
    if (!settled.ok) throw new Error(settled.error);
    expect(settled.value.vitality).toBe(1);
  });
});
