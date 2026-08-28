export interface PlayerStats {
  /** Base movement speed in pixels per second (GDD 3.3.1). */
  readonly moveSpeedPixelsPerSecond: number;
  /** Fraction of movement speed lost while holding Parley (GDD 2.2.1, 3.3.1). */
  readonly parleyMovementPenalty: number;
}
