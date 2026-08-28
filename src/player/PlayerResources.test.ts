import { describe, expect, it } from 'vitest';
import { PlayerResources } from './PlayerResources';

describe('PlayerResources', () => {
  it('spends a fraction of the gold carried, rounded down', () => {
    const after = new PlayerResources(100, 50).spendGoldFraction(0.15);
    expect(after.gold).toBe(85);
    expect(after.vitality).toBe(50);
  });

  it('leaves the original untouched, so costs cannot be applied twice by accident', () => {
    const before = new PlayerResources(100, 50);
    before.spendGoldFraction(0.5);
    expect(before.gold).toBe(100);
  });

  it('never drives gold negative when the player is broke', () => {
    expect(new PlayerResources(0, 50).spendGoldFraction(1).gold).toBe(0);
  });

  it('knows when a vitality cost would be survivable', () => {
    const resources = new PlayerResources(0, 10);
    expect(resources.canSurviveVitalityCost(9)).toBe(true);
    expect(resources.canSurviveVitalityCost(10)).toBe(false);
    expect(resources.canSurviveVitalityCost(11)).toBe(false);
  });
});
