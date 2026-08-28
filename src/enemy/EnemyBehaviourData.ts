/**
 * How an enemy acts in combat (GDD 5.1).
 *
 * A discriminated union, not a hierarchy: a stationary enemy is not a moving one with
 * `move()` stubbed out, it simply has no movement fields (CLAUDE.md 3.3).
 */
export type EnemyBehaviourData =
  | {
      readonly kind: 'Melee';
      readonly moveSpeedPixelsPerSecond: number;
      readonly damage: number;
      /** Strikes per second. */
      readonly attackRate: number;
      readonly reachPixels: number;
    }
  | {
      readonly kind: 'StationaryRanged';
      readonly damage: number;
      /** Shots per second. */
      readonly attackRate: number;
      readonly projectileSpeed: number;
      readonly rangePixels: number;
    };

export type EnemyBehaviourKind = EnemyBehaviourData['kind'];

export const ENEMY_BEHAVIOUR_KINDS: readonly EnemyBehaviourKind[] = ['Melee', 'StationaryRanged'];
