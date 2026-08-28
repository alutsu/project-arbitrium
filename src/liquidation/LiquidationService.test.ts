import { describe, expect, it } from 'vitest';
import type { WeaponData, WeaponId } from '../data/WeaponData';
import { PlayerResources } from '../player/PlayerResources';
import { WeaponSlot } from '../weapon/WeaponSlot';
import { resolveLiquidation } from './LiquidationService';

const weapon = (id: string, goldValue: number): WeaponData => ({
  id: id as WeaponId,
  name: id,
  type: 'Melee',
  tags: ['Melee', 'Blade'],
  spriteKey: `weapon_${id}`,
  damage: 10,
  attackRate: 2,
  knockbackForce: 50,
  goldValue,
  swingArc: 90,
  lungeAmount: 20,
  reachPixels: 62,
});

const HELD = weapon('rusty', 20);
const OFFERED = weapon('laser', 45);
const RESOURCES = new PlayerResources(100, 50);

describe('resolveLiquidation', () => {
  it('Swap takes the offered weapon and drops the one held (GDD 2.3.1)', () => {
    const result = resolveLiquidation({
      choice: 'Swap',
      offered: OFFERED,
      slot: new WeaponSlot(HELD),
      resources: RESOURCES,
    });
    expect(result.slot.weapon.id).toBe('laser');
    expect(result.soldFor).toBeNull();
  });

  it('Swap pays nothing and earns nothing', () => {
    const result = resolveLiquidation({
      choice: 'Swap',
      offered: OFFERED,
      slot: new WeaponSlot(HELD),
      resources: RESOURCES,
    });
    expect(result.resources.gold).toBe(100);
    expect(result.resources.vitality).toBe(50);
  });

  it('Sell turns the offer into gold and keeps the held weapon (GDD 2.3.1)', () => {
    const result = resolveLiquidation({
      choice: 'Sell',
      offered: OFFERED,
      slot: new WeaponSlot(HELD),
      resources: RESOURCES,
    });
    expect(result.slot.weapon.id).toBe('rusty');
    expect(result.resources.gold).toBe(145);
    expect(result.soldFor).toBe(45);
  });

  it('pays the offered weapon value, not the held one', () => {
    const result = resolveLiquidation({
      choice: 'Sell',
      offered: HELD,
      slot: new WeaponSlot(OFFERED),
      resources: RESOURCES,
    });
    expect(result.resources.gold).toBe(120);
  });

  it('leaves the slot it was given untouched', () => {
    const slot = new WeaponSlot(HELD);
    resolveLiquidation({ choice: 'Swap', offered: OFFERED, slot, resources: RESOURCES });
    expect(slot.weapon.id).toBe('rusty');
  });

  it('leaves the resources it was given untouched', () => {
    resolveLiquidation({
      choice: 'Sell',
      offered: OFFERED,
      slot: new WeaponSlot(HELD),
      resources: RESOURCES,
    });
    expect(RESOURCES.gold).toBe(100);
  });
});
