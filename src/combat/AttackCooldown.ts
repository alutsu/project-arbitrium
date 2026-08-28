const MILLISECONDS_PER_SECOND = 1000;
const READY = 0;

/**
 * Rate-limits attacks from a weapon's `attackRate`, read as attacks per second.
 *
 * Delta-driven rather than clock-driven, so it obeys the same frame-rate independence
 * as movement (CLAUDE.md 5) and is testable without a timer.
 */
export class AttackCooldown {
  private remainingMs = READY;

  public tick(deltaMs: number): void {
    this.remainingMs = Math.max(READY, this.remainingMs - deltaMs);
  }

  public get isReady(): boolean {
    return this.remainingMs <= READY;
  }

  /** Starts the wait for the next attack. */
  public spend(attacksPerSecond: number): void {
    this.remainingMs = MILLISECONDS_PER_SECOND / attacksPerSecond;
  }
}
