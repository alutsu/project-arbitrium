import type { WeaponData } from '../data/WeaponData';
import type { Vector2 } from '../math/Vector2';
import type { AttackCooldown } from './AttackCooldown';
import type { Swing } from './isWithinSwing';
import { spreadAngles } from './spreadAngles';

export interface AttackContext {
  readonly origin: Vector2;
  readonly aimRadians: number;
  readonly isAttacking: boolean;
  readonly deltaMs: number;
}

/**
 * What the weapon did this frame. A discriminated union rather than a callback, so the
 * rules stay Phaser-free and the scene decides how to draw the result.
 */
export type Attack =
  | { readonly kind: 'none' }
  | {
      readonly kind: 'ranged';
      readonly angles: readonly number[];
      readonly speed: number;
      readonly rangePixels: number;
      readonly damage: number;
      readonly knockback: number;
    }
  | {
      readonly kind: 'melee';
      readonly swing: Swing;
      readonly damage: number;
      readonly knockback: number;
    };

const NOTHING: Attack = { kind: 'none' };

/**
 * The firing rules of the held weapon (GDD 9.2). Composition, not inheritance: this is
 * the controller half, `WeaponData` is the stats half. The visuals half has no sprite to
 * own yet, since the weapon is not drawn in the player's hands.
 *
 * Phaser-free, so rate limiting and shot geometry are testable (CLAUDE.md 3.5).
 */
export class WeaponController {
  public constructor(private readonly cooldown: AttackCooldown) {}

  public attempt(weapon: WeaponData, context: AttackContext): Attack {
    this.cooldown.tick(context.deltaMs);
    if (!context.isAttacking || !this.cooldown.isReady) {
      return NOTHING;
    }
    this.cooldown.spend(weapon.attackRate);

    if (weapon.type === 'Ranged') {
      return {
        kind: 'ranged',
        angles: spreadAngles(context.aimRadians, weapon.projectileCount, weapon.spreadDegrees),
        speed: weapon.projectileSpeed,
        rangePixels: weapon.rangePixels,
        damage: weapon.damage,
        knockback: weapon.knockbackForce,
      };
    }
    return {
      kind: 'melee',
      swing: {
        origin: context.origin,
        aimRadians: context.aimRadians,
        swingArc: weapon.swingArc,
        reachPixels: weapon.reachPixels,
      },
      damage: weapon.damage,
      knockback: weapon.knockbackForce,
    };
  }
}
