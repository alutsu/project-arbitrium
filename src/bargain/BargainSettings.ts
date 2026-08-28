export interface BargainSettings {
  /** How long enemies stay in the "Notice" state before demands get expensive (GDD 4.1.1). */
  readonly aggroDelayMs: number;
  /** Multiplier applied to a demand made after the Aggro Delay has passed (GDD 4.1.1). */
  readonly lateCostMultiplier: number;
  /** How long Parley must be held on one enemy to settle with it. */
  readonly holdDurationMs: number;
  /** Radius of the Sphere of Influence projected while Parley is held (GDD 2.2.1). */
  readonly sphereRadiusPixels: number;
}
