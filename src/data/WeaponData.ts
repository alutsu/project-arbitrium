import type { WeaponTag } from './WeaponTag';

/** Branded so a weapon id cannot be passed where an upgrade id is expected. */
export type WeaponId = string & { readonly __brand: 'WeaponId' };

interface WeaponBase {
  readonly id: WeaponId;
  readonly name: string;
  readonly tags: readonly WeaponTag[];
  readonly spriteKey: string;
  readonly damage: number;
  readonly attackRate: number;
  readonly knockbackForce: number;
}

/**
 * A generated weapon (GDD 3.1.1). Modelled as a discriminated union on `type` so a
 * Melee weapon cannot carry projectile fields and a Ranged one cannot carry a swing
 * arc — illegal states are unrepresentable rather than merely unused (CLAUDE.md 2.2).
 */
export type WeaponData =
  | (WeaponBase & {
      readonly type: 'Ranged';
      readonly projectileSpriteKey: string;
      readonly projectileSpeed: number;
      readonly projectileCount: number;
    })
  | (WeaponBase & {
      readonly type: 'Melee';
      readonly swingArc: number;
      readonly lungeAmount: number;
    });

export type WeaponType = WeaponData['type'];

export const WEAPON_TYPES: readonly WeaponType[] = ['Ranged', 'Melee'];
