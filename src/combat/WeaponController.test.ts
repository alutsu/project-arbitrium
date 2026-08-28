import { describe, expect, it } from 'vitest';
import type { WeaponData, WeaponId } from '../data/WeaponData';
import { AttackCooldown } from './AttackCooldown';
import { WeaponController } from './WeaponController';

const ranged: WeaponData = {
  id: 'scattergun' as WeaponId,
  name: 'Scrap Scattergun',
  type: 'Ranged',
  tags: ['Ranged', 'Projectile', 'Heavy'],
  spriteKey: 'weapon_scattergun',
  damage: 4,
  attackRate: 2,
  knockbackForce: 160,
  goldValue: 35,
  projectileSpriteKey: 'projectile_pellet',
  projectileSpeed: 420,
  projectileCount: 5,
  spreadDegrees: 26,
  rangePixels: 300,
};

const melee: WeaponData = {
  id: 'maul' as WeaponId,
  name: 'Pitted Maul',
  type: 'Melee',
  tags: ['Melee', 'Blunt', 'Heavy'],
  spriteKey: 'weapon_maul',
  damage: 24,
  attackRate: 1,
  knockbackForce: 260,
  goldValue: 45,
  swingArc: 70,
  lungeAmount: 12,
  reachPixels: 74,
};

const ORIGIN = { x: 100, y: 100 };
const HELD = { origin: ORIGIN, aimRadians: 0, isAttacking: true, deltaMs: 16 };
const IDLE = { ...HELD, isAttacking: false };

describe('WeaponController', () => {
  it('does nothing while Attack is not held', () => {
    const controller = new WeaponController(new AttackCooldown());
    expect(controller.attempt(ranged, IDLE)).toEqual({ kind: 'none' });
  });

  it('fires one projectile per projectileCount, fanned by the spread', () => {
    const controller = new WeaponController(new AttackCooldown());
    const attack = controller.attempt(ranged, HELD);
    if (attack.kind !== 'ranged') throw new Error('expected a ranged attack');
    expect(attack.angles).toHaveLength(5);
    expect(attack.rangePixels).toBe(300);
    expect(attack.damage).toBe(4);
  });

  it('swings rather than shooting when the weapon is melee', () => {
    const controller = new WeaponController(new AttackCooldown());
    const attack = controller.attempt(melee, HELD);
    if (attack.kind !== 'melee') throw new Error('expected a melee attack');
    expect(attack.swing.reachPixels).toBe(74);
    expect(attack.swing.swingArc).toBe(70);
    expect(attack.swing.origin).toEqual(ORIGIN);
  });

  it('honours the weapon attack rate rather than firing every frame', () => {
    const controller = new WeaponController(new AttackCooldown());
    let shots = 0;
    // One second of 16ms frames with the trigger held; 2 attacks per second.
    for (let elapsed = 0; elapsed < 1000; elapsed += 16) {
      if (controller.attempt(ranged, HELD).kind !== 'none') shots += 1;
    }
    expect(shots).toBe(2);
  });

  it('does not bank shots while the trigger is released', () => {
    const controller = new WeaponController(new AttackCooldown());
    controller.attempt(ranged, HELD);
    for (let elapsed = 0; elapsed < 2000; elapsed += 16) {
      controller.attempt(ranged, IDLE);
    }
    let shots = 0;
    for (let frame = 0; frame < 3; frame++) {
      if (controller.attempt(ranged, HELD).kind !== 'none') shots += 1;
    }
    expect(shots).toBe(1);
  });

  it('points the shot where the player is aiming', () => {
    const controller = new WeaponController(new AttackCooldown());
    const attack = controller.attempt(
      { ...ranged, projectileCount: 1 },
      { ...HELD, aimRadians: 1.5 },
    );
    if (attack.kind !== 'ranged') throw new Error('expected a ranged attack');
    expect(attack.angles).toEqual([1.5]);
  });
});
