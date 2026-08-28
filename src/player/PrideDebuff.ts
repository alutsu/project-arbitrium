const NO_PENALTY = 0;
const FULL_SPEED = 1;
const EXPIRED = -1;

/**
 * The cost of swallowing your Pride: a temporary speed penalty that follows the player
 * into the next room (GDD 4.1.2).
 *
 * Immutable. `roomsRemaining` counts room entries the debuff still survives, so a
 * penalty taken in one room also slows the next one, which is the "next room is harder"
 * risk the design trades for.
 */
export class PrideDebuff {
  public static readonly none = new PrideDebuff(NO_PENALTY, EXPIRED);

  public constructor(
    public readonly speedPenalty: number,
    public readonly roomsRemaining: number,
  ) {}

  public get isActive(): boolean {
    return this.roomsRemaining >= NO_PENALTY && this.speedPenalty > NO_PENALTY;
  }

  public get speedMultiplier(): number {
    return this.isActive ? FULL_SPEED - this.speedPenalty : FULL_SPEED;
  }

  /** Ages the debuff by one room; it expires once it has outlived its rooms. */
  public afterRoomEntry(): PrideDebuff {
    if (!this.isActive) {
      return PrideDebuff.none;
    }
    const remaining = this.roomsRemaining - FULL_SPEED;
    return remaining < NO_PENALTY
      ? PrideDebuff.none
      : new PrideDebuff(this.speedPenalty, remaining);
  }
}
