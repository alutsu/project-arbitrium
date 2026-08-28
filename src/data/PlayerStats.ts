export interface PlayerStats {
  /** Base movement speed in pixels per second (GDD 3.3.1). */
  readonly moveSpeedPixelsPerSecond: number;
  /** Fraction of movement speed lost while holding Parley (GDD 2.2.1, 3.3.1). */
  readonly parleyMovementPenalty: number;
  /** Gold carried at the start of a run; the pool Gold demands take a cut of (GDD 4.1.2). */
  readonly startingGold: number;
  /** Vitality at the start of a run, and the cap it can be restored to (GDD 4.1.2). */
  readonly maxVitality: number;
}
