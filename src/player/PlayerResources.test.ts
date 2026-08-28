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

  it('knows when a fraction of the purse is worth anything', () => {
    expect(new PlayerResources(100, 50).canPayGoldFraction(0.15)).toBe(true);
    expect(new PlayerResources(0, 50).canPayGoldFraction(1)).toBe(false);
    expect(new PlayerResources(4, 50).canPayGoldFraction(0.2)).toBe(false);
  });

  it('bottoms vitality out at zero and reports defeat', () => {
    const dead = new PlayerResources(0, 6).loseVitality(10);
    expect(dead.vitality).toBe(0);
    expect(dead.isDefeated).toBe(true);
    expect(new PlayerResources(0, 6).loseVitality(5).isDefeated).toBe(false);
  });
});
