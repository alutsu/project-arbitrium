export interface BargainSettings {
  /** How long enemies stay in the "Notice" state before demands get expensive (GDD 4.1.1). */
  readonly aggroDelayMs: number;
  /** Multiplier applied to a demand made after the Aggro Delay has passed (GDD 4.1.1). */
  readonly lateCostMultiplier: number;
  /** How long Parley must be held on one enemy to settle with it. */
  readonly holdDurationMs: number;
  /**
   * Vitality charged in place of a Gold demand the player cannot pay, quoted for a
   * demand of the entire purse; a smaller demand takes proportionally less (GDD 4.1.2).
   */
  readonly vitalityForUnpayableGold: number;
  /**
   * How many further room entries a Pride debuff survives. 1 means the penalty also
   * slows the next room, which is the risk GDD 4.1.2 trades for.
   */
  readonly prideRoomsAffected: number;
  /** Radius of the Sphere of Influence projected while Parley is held (GDD 2.2.1). */
  readonly sphereRadiusPixels: number;
}
