import type { WeaponId } from './WeaponData';

export interface PlayerStats {
  /** Base movement speed in pixels per second (GDD 3.3.1). */
  readonly moveSpeedPixelsPerSecond: number;
  /** Fraction of movement speed lost while holding Parley (GDD 2.2.1, 3.3.1). */
  readonly parleyMovementPenalty: number;
  /** Gold carried at the start of a run; the pool Gold demands take a cut of (GDD 4.1.2). */
  readonly startingGold: number;
  /** Vitality at the start of a run, and the cap it can be restored to (GDD 4.1.2). */
  readonly maxVitality: number;
  /** The weapon the run begins with. `GameDatabase` proves it names a real weapon. */
  readonly startingWeaponId: WeaponId;
  /** How close the player must be to a Weapon Pedestal to Swap or Sell (GDD 2.3.1). */
  readonly interactReachPixels: number;
}
