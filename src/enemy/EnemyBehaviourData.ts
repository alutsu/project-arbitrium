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
      /**
       * How wide the shot connects. A large radius is how the Alchemist's thrown potion
       * covers ground (GDD 5.1) without a separate area-damage system.
       */
      readonly blastRadiusPixels: number;
    }
  | {
      readonly kind: 'Blink';
      readonly damage: number;
      /** Strikes per second. */
      readonly attackRate: number;
      readonly reachPixels: number;
      /** Blinks per second. */
      readonly blinkRate: number;
      /** Tiles covered by one blink, along the path to the player. */
      readonly blinkStepTiles: number;
    };

export type EnemyBehaviourKind = EnemyBehaviourData['kind'];

export const ENEMY_BEHAVIOUR_KINDS: readonly EnemyBehaviourKind[] = [
  'Melee',
  'StationaryRanged',
  'Blink',
];
