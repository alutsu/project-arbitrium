export interface PlayerStats {
  /** Base movement speed in pixels per second (GDD 3.3.1). */
  readonly moveSpeedPixelsPerSecond: number;
  /** Fraction of movement speed lost while holding Parley (GDD 2.2.1, 3.3.1). */
  readonly parleyMovementPenalty: number;
}

/**
 * Tunable player values. These move into `player.json` behind a validating loader
 * in Sprint 2, when the data architecture lands (GDD 7, 3.1).
 */
export const PLAYER_STATS: PlayerStats = {
  moveSpeedPixelsPerSecond: 220,
  parleyMovementPenalty: 0.3,
};
