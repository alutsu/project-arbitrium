import { describe, expect, it } from 'vitest';
import type { UpgradeData, UpgradeId } from '../data/UpgradeData';
import type { WeaponData, WeaponId } from '../data/WeaponData';
import { PlayerResources } from '../player/PlayerResources';
import { WeaponSlot } from '../weapon/WeaponSlot';
import { applyUpgrade } from './applyUpgrade';
import { ForgeService } from './ForgeService';
import { getCompatibleUpgrades } from './getCompatibleUpgrades';
import { upgradeCostOn } from './upgradeCostOn';

const ranged: WeaponData = {
  id: 'pistol' as WeaponId,
  name: 'Rusty Pistol',
  type: 'Ranged',
  tags: ['Ranged', 'Projectile', 'Light'],
  spriteKey: 'weapon_pistol',
  damage: 10,
  attackRate: 4,
  knockbackForce: 40,
  goldValue: 25,
  projectileSpriteKey: 'projectile_bullet',
  projectileSpeed: 500,
  projectileCount: 1,
};

const heavyMelee: WeaponData = {
  id: 'maul' as WeaponId,
  name: 'Pitted Maul',
  type: 'Melee',
  tags: ['Melee', 'Blunt', 'Heavy'],
  spriteKey: 'weapon_maul',
  damage: 24,
  attackRate: 1,
  knockbackForce: 200,
  goldValue: 45,
  swingArc: 70,
  lungeAmount: 12,
};

const upgrade = (
  id: string,
  constraints: { required?: UpgradeData['requiredTags']; forbidden?: UpgradeData['forbiddenTags'] },
  modifiers: Partial<UpgradeData> = {},
): UpgradeData => ({
  id: id as UpgradeId,
  name: id,
  goldCost: 40,
  iconKey: `module_${id}`,
  requiredTags: constraints.required ?? [],
  forbiddenTags: constraints.forbidden ?? [],
  ...modifiers,
});

const UNIVERSAL = upgrade('honed_edge', {}, { damageMultiplier: 1.1 });
const SPLIT = upgrade(
  'split_chamber',
  { required: ['Projectile'], forbidden: ['Melee'] },
  { extraProjectiles: 1 },
);
const TITAN = upgrade(
  'titan_grip',
  { required: ['Heavy'], forbidden: ['Light'] },
  { knockbackMultiplier: 3 },
);
const INERT = upgrade('phase_blade', { required: ['Melee'], forbidden: ['Ranged'] });
const ALL = [UNIVERSAL, SPLIT, TITAN, INERT];

describe('getCompatibleUpgrades', () => {
  it('offers a Module with no tag constraints to anything (GDD 2.4.1)', () => {
    expect(getCompatibleUpgrades(ranged, [UNIVERSAL])).toEqual([UNIVERSAL]);
    expect(getCompatibleUpgrades(heavyMelee, [UNIVERSAL])).toEqual([UNIVERSAL]);
  });

  it('requires every required tag to be present', () => {
    expect(getCompatibleUpgrades(ranged, [SPLIT])).toEqual([SPLIT]);
    expect(getCompatibleUpgrades(heavyMelee, [SPLIT])).toEqual([]);
  });

  it('rejects a weapon carrying any forbidden tag', () => {
    // The pistol is Light, which Titan Grip forbids, even though it is not Heavy either.
    expect(getCompatibleUpgrades(ranged, [TITAN])).toEqual([]);
    expect(getCompatibleUpgrades(heavyMelee, [TITAN])).toEqual([TITAN]);
  });

  it('keeps a Sword away from Ricochet, which is the whole point (GDD 2.4.1)', () => {
    expect(getCompatibleUpgrades(heavyMelee, ALL).map((u) => u.id)).toEqual([
      'honed_edge',
      'titan_grip',
      'phase_blade',
    ]);
  });
});

describe('upgradeCostOn', () => {
  it('scales with the floor, per BaseCost * (CurrentFloor * 1.5) (GDD 8.2)', () => {
    expect(upgradeCostOn(UNIVERSAL, 1)).toBe(60);
    expect(upgradeCostOn(UNIVERSAL, 2)).toBe(120);
    expect(upgradeCostOn(UNIVERSAL, 3)).toBe(180);
  });

  it('rounds up to whole coins', () => {
    // 7 * (1 * 1.5) is 10.5, which nobody can pay.
    const odd = upgrade('odd', {}, { goldCost: 7, damageMultiplier: 1.1 });
    expect(upgradeCostOn(odd, 1)).toBe(11);
  });
});

describe('applyUpgrade', () => {
  it('multiplies damage', () => {
    expect(applyUpgrade(ranged, UNIVERSAL).damage).toBeCloseTo(11);
  });

  it('multiplies knockback', () => {
    expect(applyUpgrade(heavyMelee, TITAN).knockbackForce).toBe(600);
  });

  it('adds projectiles to a ranged weapon', () => {
    const fitted = applyUpgrade(ranged, SPLIT);
    if (fitted.type !== 'Ranged') throw new Error('expected a ranged weapon');
    expect(fitted.projectileCount).toBe(2);
  });

  it('does not graft projectile fields onto a melee weapon', () => {
    const fitted = applyUpgrade(heavyMelee, SPLIT);
    expect(fitted.type).toBe('Melee');
    expect('projectileCount' in fitted).toBe(false);
  });

  it('leaves the weapon it was given untouched', () => {
    applyUpgrade(ranged, UNIVERSAL);
    expect(ranged.damage).toBe(10);
  });

  it('stacks when fitted twice', () => {
    expect(applyUpgrade(applyUpgrade(ranged, UNIVERSAL), UNIVERSAL).damage).toBeCloseTo(12.1);
  });
});

describe('ForgeService', () => {
  const forge = new ForgeService(ALL);

  it('stocks only what fits the held weapon', () => {
    const ids = forge.stockFor(new WeaponSlot(ranged), 1).map((offer) => offer.upgrade.id);
    expect(ids).toEqual(['honed_edge', 'split_chamber']);
  });

  it('does not stock a Module whose effect the game cannot apply yet', () => {
    const ids = forge.stockFor(new WeaponSlot(heavyMelee), 1).map((offer) => offer.upgrade.id);
    expect(ids).toEqual(['honed_edge', 'titan_grip']);
    expect(ids).not.toContain('phase_blade');
  });

  it('prices the shelf for the current floor', () => {
    expect(forge.stockFor(new WeaponSlot(ranged), 2)[0]?.cost).toBe(120);
  });

  it('fits the Module and charges for it', () => {
    const offer = forge.stockFor(new WeaponSlot(ranged), 1)[0];
    if (offer === undefined) throw new Error('expected an offer');
    const receipt = forge.buy({
      offer,
      slot: new WeaponSlot(ranged),
      resources: new PlayerResources(100, 50),
    });
    if (!receipt.ok) throw new Error(receipt.error);
    expect(receipt.value.resources.gold).toBe(40);
    expect(receipt.value.slot.weapon.damage).toBeCloseTo(11);
  });

  it('refuses a Module the player cannot afford, naming the shortfall', () => {
    const offer = forge.stockFor(new WeaponSlot(ranged), 1)[0];
    if (offer === undefined) throw new Error('expected an offer');
    const receipt = forge.buy({
      offer,
      slot: new WeaponSlot(ranged),
      resources: new PlayerResources(10, 50),
    });
    expect(receipt.ok).toBe(false);
    if (!receipt.ok) expect(receipt.error).toContain('60');
  });

  it('leaves gold and weapon untouched when the purchase is refused', () => {
    const offer = forge.stockFor(new WeaponSlot(ranged), 1)[0];
    if (offer === undefined) throw new Error('expected an offer');
    const resources = new PlayerResources(10, 50);
    forge.buy({ offer, slot: new WeaponSlot(ranged), resources });
    expect(resources.gold).toBe(10);
    expect(ranged.damage).toBe(10);
  });
});
