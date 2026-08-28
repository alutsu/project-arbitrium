import { describe, expect, it } from 'vitest';
import { PlayerResources } from '../player/PlayerResources';
import type { PlayerState } from '../player/PlayerState';
import { PrideDebuff } from '../player/PrideDebuff';
import { BargainService } from './BargainService';
import type { BargainDemand } from './BargainDemand';
import type { BargainSettings } from './BargainSettings';

const SETTINGS: BargainSettings = {
  aggroDelayMs: 1500,
  lateCostMultiplier: 1.5,
  holdDurationMs: 900,
  prideRoomsAffected: 1,
  vitalityForUnpayableGold: 40,
  sphereRadiusPixels: 170,
};

const service = new BargainService(SETTINGS);

const goldDemand: BargainDemand = { tier: 'Normal', cost: { kind: 'Gold', fractionOfGold: 0.2 } };
const vitalityDemand: BargainDemand = { tier: 'Normal', cost: { kind: 'Vitality', damage: 10 } };

const DURING_AGGRO_DELAY = 1000;
const AFTER_AGGRO_DELAY = 2000;
const SOLVENT = new PlayerResources(200, 50);
const BROKE = new PlayerResources(0, 50);

const stateOf = (resources: PlayerResources): PlayerState => ({
  resources,
  pride: PrideDebuff.none,
});

const priceFor = (demand: BargainDemand, roomElapsedMs: number, resources = SOLVENT) =>
  service.costFor(demand, { roomElapsedMs, resources });

describe('BargainService', () => {
  it('charges the listed price inside the Aggro Delay (GDD 4.1.1)', () => {
    expect(priceFor(goldDemand, DURING_AGGRO_DELAY)).toEqual({
      kind: 'Gold',
      fractionOfGold: 0.2,
    });
    expect(service.isLate(DURING_AGGRO_DELAY)).toBe(false);
  });

  it('treats the Aggro Delay boundary as still on time', () => {
    expect(service.isLate(SETTINGS.aggroDelayMs)).toBe(false);
    expect(service.isLate(SETTINGS.aggroDelayMs + 1)).toBe(true);
  });

  it('adds 50% to a late gold demand', () => {
    expect(priceFor(goldDemand, AFTER_AGGRO_DELAY)).toEqual({
      kind: 'Gold',
      fractionOfGold: 0.30000000000000004,
    });
  });

  it('adds 50% to a late vitality demand, rounding up to whole points', () => {
    expect(priceFor(vitalityDemand, AFTER_AGGRO_DELAY)).toEqual({ kind: 'Vitality', damage: 15 });
  });

  it('never demands more gold than the player has', () => {
    const greedy: BargainDemand = { tier: 'Rare', cost: { kind: 'Gold', fractionOfGold: 0.8 } };
    expect(priceFor(greedy, AFTER_AGGRO_DELAY)).toEqual({ kind: 'Gold', fractionOfGold: 1 });
  });

  it('takes an unpayable gold demand out of Vitality instead (GDD 4.1.2)', () => {
    expect(priceFor(goldDemand, DURING_AGGRO_DELAY, BROKE)).toEqual({
      kind: 'Vitality',
      damage: 8,
    });
  });

  it('scales the Vitality fallback by how greedy the demand was', () => {
    const greedy: BargainDemand = { tier: 'Rare', cost: { kind: 'Gold', fractionOfGold: 0.5 } };
    expect(priceFor(greedy, DURING_AGGRO_DELAY, BROKE)).toEqual({ kind: 'Vitality', damage: 20 });
  });

  it('falls back when the purse is too thin to round up to a single coin', () => {
    const almostBroke = new PlayerResources(4, 50);
    expect(priceFor(goldDemand, DURING_AGGRO_DELAY, almostBroke)).toEqual({
      kind: 'Vitality',
      damage: 8,
    });
  });

  it('applies the late surcharge before converting to Vitality', () => {
    expect(priceFor(goldDemand, AFTER_AGGRO_DELAY, BROKE)).toEqual({
      kind: 'Vitality',
      damage: 13,
    });
  });

  it('settles a gold demand against the player purse', () => {
    const after = service.settle({ kind: 'Gold', fractionOfGold: 0.25 }, stateOf(SOLVENT));
    expect(after.resources.gold).toBe(150);
  });

  it('settles a vitality demand', () => {
    const after = service.settle({ kind: 'Vitality', damage: 10 }, stateOf(BROKE));
    expect(after.resources.vitality).toBe(40);
  });

  it('lets a Parley kill a player who can no longer pay (GDD 2.2.2)', () => {
    const after = service.settle(
      { kind: 'Vitality', damage: 8 },
      stateOf(new PlayerResources(0, 6)),
    );
    expect(after.resources.vitality).toBe(0);
    expect(after.resources.isDefeated).toBe(true);
  });

  it('settles a Pride demand as a debuff, charging no resources (GDD 4.1.2)', () => {
    const after = service.settle({ kind: 'Pride', speedPenalty: 0.25 }, stateOf(SOLVENT));
    expect(after.resources.gold).toBe(200);
    expect(after.resources.vitality).toBe(50);
    expect(after.pride.isActive).toBe(true);
    expect(after.pride.speedMultiplier).toBeCloseTo(0.75);
    expect(after.pride.roomsRemaining).toBe(SETTINGS.prideRoomsAffected);
  });

  it('surcharges a late Pride demand', () => {
    const pride: BargainDemand = { tier: 'Normal', cost: { kind: 'Pride', speedPenalty: 0.2 } };
    expect(priceFor(pride, AFTER_AGGRO_DELAY)).toEqual({
      kind: 'Pride',
      speedPenalty: 0.30000000000000004,
    });
  });

  it('never lets a late Pride demand immobilise the player', () => {
    const cruel: BargainDemand = { tier: 'Unique', cost: { kind: 'Pride', speedPenalty: 0.8 } };
    const cost = priceFor(cruel, AFTER_AGGRO_DELAY);
    if (cost.kind !== 'Pride') throw new Error('expected a Pride cost');
    expect(cost.speedPenalty).toBeCloseTo(0.9);
  });

  it('does not convert a Pride demand when the purse is empty', () => {
    const pride: BargainDemand = { tier: 'Normal', cost: { kind: 'Pride', speedPenalty: 0.2 } };
    expect(priceFor(pride, DURING_AGGRO_DELAY, BROKE).kind).toBe('Pride');
  });
});
