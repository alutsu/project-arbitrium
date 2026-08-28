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
  /** What the pedestal pays for this weapon if it is sold rather than taken (GDD 2.3.1). */
  readonly goldValue: number;
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
      /** Total spread of a multi-projectile shot, in degrees (GDD 2.3.2, Barrel). */
      readonly spreadDegrees: number;
      /** How far a projectile travels before expiring (GDD 2.3.2, Barrel). */
      readonly rangePixels: number;
    })
  | (WeaponBase & {
      readonly type: 'Melee';
      readonly swingArc: number;
      readonly lungeAmount: number;
      /** How far the swing reaches from the player (GDD 2.3.2, Handle). */
      readonly reachPixels: number;
    });

export type WeaponType = WeaponData['type'];

export const WEAPON_TYPES: readonly WeaponType[] = ['Ranged', 'Melee'];
