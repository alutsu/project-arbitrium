import { describe, expect, it } from 'vitest';
import shippedBargain from '../../public/data/bargain.json';
import shippedPlayer from '../../public/data/player.json';
import shippedUpgrades from '../../public/data/upgrades.json';
import shippedWeapons from '../../public/data/weapons.json';
import { DATA_KEYS } from './dataKeys';
import type { JsonSource } from './JsonSource';
import { loadGameData } from './loadGameData';

/** The JSON below is imported from public/, so a broken data file fails the suite. */
class StubSource implements JsonSource {
  public constructor(private readonly entries: Readonly<Record<string, unknown>>) {}
  public read(key: string): unknown {
    return this.entries[key];
  }
}

const shippedSource = new StubSource({
  [DATA_KEYS.weapons]: shippedWeapons,
  [DATA_KEYS.upgrades]: shippedUpgrades,
  [DATA_KEYS.playerStats]: shippedPlayer,
  [DATA_KEYS.bargain]: shippedBargain,
});

describe('loadGameData', () => {
  it('loads the data files that ship with the game', () => {
    const outcome = loadGameData(shippedSource);
    if (!outcome.ok) throw new Error(outcome.error);
    expect(outcome.value.weapons.length).toBeGreaterThan(0);
    expect(outcome.value.upgrades.length).toBeGreaterThan(0);
  });

  it('ships the Aggro Delay and late multiplier the GDD specifies (4.1.1)', () => {
    const outcome = loadGameData(shippedSource);
    if (!outcome.ok) throw new Error(outcome.error);
    expect(outcome.value.bargain.settings.aggroDelayMs).toBe(1500);
    expect(outcome.value.bargain.settings.lateCostMultiplier).toBe(1.5);
  });

  it('ships the movement values the GDD specifies (3.3.1)', () => {
    const outcome = loadGameData(shippedSource);
    if (!outcome.ok) throw new Error(outcome.error);
    expect(outcome.value.playerStats.parleyMovementPenalty).toBe(0.3);
    expect(outcome.value.playerStats.moveSpeedPixelsPerSecond).toBe(220);
  });

  it('ships at least one weapon of each type, so both paths have data', () => {
    const outcome = loadGameData(shippedSource);
    if (!outcome.ok) throw new Error(outcome.error);
    const types = new Set(outcome.value.weapons.map((w) => w.type));
    expect(types).toEqual(new Set(['Ranged', 'Melee']));
  });

  it('reports the first failure and does not build a partial database', () => {
    const broken = new StubSource({
      [DATA_KEYS.weapons]: shippedWeapons,
      [DATA_KEYS.upgrades]: 'not an array',
      [DATA_KEYS.playerStats]: shippedPlayer,
      [DATA_KEYS.bargain]: shippedBargain,
    });
    const outcome = loadGameData(broken);
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.error).toContain('upgrades.json');
  });

  it('fails when a data file is missing from the source entirely', () => {
    const outcome = loadGameData(new StubSource({}));
    expect(outcome.ok).toBe(false);
  });
});
