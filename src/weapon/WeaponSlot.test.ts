import { describe, expect, it } from 'vitest';
import type { WeaponData, WeaponId } from '../data/WeaponData';
import { WeaponSlot } from './WeaponSlot';

const weapon = (id: string): WeaponData => ({
  id: id as WeaponId,
  name: id,
  type: 'Ranged',
  tags: ['Ranged', 'Projectile'],
  spriteKey: `weapon_${id}`,
  damage: 6,
  attackRate: 4,
  knockbackForce: 40,
  goldValue: 25,
  projectileSpriteKey: 'projectile_bullet',
  projectileSpeed: 500,
  projectileCount: 1,
  spreadDegrees: 3,
  rangePixels: 500,
});

describe('WeaponSlot', () => {
  it('holds the weapon it was given', () => {
    expect(new WeaponSlot(weapon('pistol')).weapon.id).toBe('pistol');
  });

  it('holds only one weapon, so swapping replaces rather than adds (GDD 2.3.1)', () => {
    const swapped = new WeaponSlot(weapon('pistol')).swappedFor(weapon('rifle'));
    expect(swapped.weapon.id).toBe('rifle');
  });

  it('leaves the original slot alone', () => {
    const original = new WeaponSlot(weapon('pistol'));
    original.swappedFor(weapon('rifle'));
    expect(original.weapon.id).toBe('pistol');
  });
});
