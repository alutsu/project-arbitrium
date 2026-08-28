import { describe, expect, it } from 'vitest';
import { PlayerResources } from '../player/PlayerResources';
import { PrideDebuff } from '../player/PrideDebuff';
import type { Bargainable } from './Bargainable';
import type { BargainDemand } from './BargainDemand';
import { BargainService } from './BargainService';
import type { BargainSettings } from './BargainSettings';
import { ParleySession } from './ParleySession';
import { ParleySystem } from './ParleySystem';

const SETTINGS: BargainSettings = {
  aggroDelayMs: 1500,
  lateCostMultiplier: 1.5,
  holdDurationMs: 900,
  prideRoomsAffected: 1,
  vitalityForUnpayableGold: 40,
  sphereRadiusPixels: 170,
};

const GOLD_DEMAND: BargainDemand = { tier: 'Normal', cost: { kind: 'Gold', fractionOfGold: 0.25 } };
const PLAYER_AT = { x: 0, y: 0 };
const IN_RANGE = { x: 40, y: 0 };
const OUT_OF_RANGE = { x: 900, y: 0 };
const EARLY_MS = 500;
const LATE_MS = 5000;

class TestEnemy implements Bargainable {
  public fled = false;
  public constructor(
    public readonly position: { x: number; y: number },
    public readonly demand: BargainDemand = GOLD_DEMAND,
  ) {}
  public flee(): void {
    this.fled = true;
  }
}

const systemWith = (enemies: TestEnemy[], gold = 200, vitality = 50): ParleySystem => {
  const system = new ParleySystem({
    session: new ParleySession(SETTINGS.holdDurationMs),
    service: new BargainService(SETTINGS),
    settings: SETTINGS,
    state: { resources: new PlayerResources(gold, vitality), pride: PrideDebuff.none },
  });
  for (const enemy of enemies) system.add(enemy);
  return system;
};

const parleyFor = (system: ParleySystem, frames: number, roomElapsedMs = EARLY_MS): void => {
  for (let frame = 0; frame < frames; frame++) {
    system.update({
      isParleying: true,
      playerPosition: PLAYER_AT,
      deltaMs: 100,
      roomElapsedMs,
    });
  }
};

describe('ParleySystem', () => {
  it('shows no Desire Icons unless Parley is held', () => {
    const system = systemWith([new TestEnemy(IN_RANGE)]);
    const frame = system.update({
      isParleying: false,
      playerPosition: PLAYER_AT,
      deltaMs: 100,
      roomElapsedMs: EARLY_MS,
    });
    expect(frame.visible).toEqual([]);
    expect(frame.status.kind).toBe('inactive');
  });

  it('shows a Desire Icon for every enemy inside the Sphere', () => {
    const near = new TestEnemy(IN_RANGE);
    const far = new TestEnemy(OUT_OF_RANGE);
    const system = systemWith([near, far]);
    parleyFor(system, 1);
    const frame = system.update({
      isParleying: true,
      playerPosition: PLAYER_AT,
      deltaMs: 100,
      roomElapsedMs: EARLY_MS,
    });
    expect(frame.visible.map((target) => target.bargainable)).toEqual([near]);
    expect(frame.visible[0]?.cost).toEqual({ kind: 'Gold', fractionOfGold: 0.25 });
  });

  it('charges the demand and sends the enemy away once the hold completes', () => {
    const enemy = new TestEnemy(IN_RANGE);
    const system = systemWith([enemy]);
    parleyFor(system, 9);
    expect(enemy.fled).toBe(true);
    expect(system.resources.gold).toBe(150);
  });

  it('charges nothing until the hold completes', () => {
    const system = systemWith([new TestEnemy(IN_RANGE)]);
    parleyFor(system, 5);
    expect(system.resources.gold).toBe(200);
  });

  it('quotes the late price after the Aggro Delay lapses (GDD 4.1.1)', () => {
    const system = systemWith([new TestEnemy(IN_RANGE)]);
    const frame = system.update({
      isParleying: true,
      playerPosition: PLAYER_AT,
      deltaMs: 100,
      roomElapsedMs: LATE_MS,
    });
    expect(frame.isLate).toBe(true);
    expect(frame.visible[0]?.cost).toEqual({ kind: 'Gold', fractionOfGold: 0.375 });
  });

  it('settles a fled enemy only once, and stops offering it', () => {
    const enemy = new TestEnemy(IN_RANGE);
    const system = systemWith([enemy]);
    parleyFor(system, 9);
    const goldAfterFirst = system.resources.gold;
    parleyFor(system, 20);
    expect(system.resources.gold).toBe(goldAfterFirst);
  });

  it('takes a Pride demand as a debuff that outlives the room (GDD 4.1.2)', () => {
    const enemy = new TestEnemy(IN_RANGE, {
      tier: 'Normal',
      cost: { kind: 'Pride', speedPenalty: 0.2 },
    });
    const system = systemWith([enemy]);
    parleyFor(system, 9);

    expect(enemy.fled).toBe(true);
    expect(system.resources.gold).toBe(200);
    expect(system.state.pride.speedMultiplier).toBeCloseTo(0.8);

    system.onRoomEntry();
    expect(system.state.pride.isActive).toBe(true);
    system.onRoomEntry();
    expect(system.state.pride.isActive).toBe(false);
  });

  it('lets a Parley kill, which is how the Death Spiral ends (GDD 2.2.2)', () => {
    const enemy = new TestEnemy(IN_RANGE, {
      tier: 'Normal',
      cost: { kind: 'Vitality', damage: 30 },
    });
    const system = systemWith([enemy], 200, 20);
    parleyFor(system, 9);
    expect(enemy.fled).toBe(true);
    expect(system.resources.vitality).toBe(0);
    expect(system.resources.isDefeated).toBe(true);
  });

  it('quotes a broke player the Vitality price for a Gold demand (GDD 4.1.2)', () => {
    const system = systemWith([new TestEnemy(IN_RANGE)], 0, 50);
    const frame = system.update({
      isParleying: true,
      playerPosition: PLAYER_AT,
      deltaMs: 100,
      roomElapsedMs: EARLY_MS,
    });
    expect(frame.visible[0]?.cost).toEqual({ kind: 'Vitality', damage: 10 });
  });

  it('charges a broke player in Vitality when the hold completes', () => {
    const system = systemWith([new TestEnemy(IN_RANGE)], 0, 50);
    parleyFor(system, 9);
    expect(system.resources.vitality).toBe(40);
    expect(system.resources.gold).toBe(0);
  });
});
