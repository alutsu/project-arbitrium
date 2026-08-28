/**
 * Phaser reads intensity as a fraction of the viewport, so 0.016 threw the world about
 * twenty pixels and shoved the room over the HUD. These give roughly 2 to 9 pixels.
 */
const MIN_INTENSITY = 0.002;
const MAX_INTENSITY = 0.007;
const MIN_DURATION_MS = 90;
const MAX_DURATION_MS = 220;
/** The damage at which a shake is already as violent as it will get. */
const SATURATING_DAMAGE = 20;
const NONE = 0;

export interface Shake {
  readonly durationMs: number;
  readonly intensity: number;
}

/**
 * How hard the camera should kick for a hit of this size.
 *
 * Scaled rather than fixed so a Grunt's 7 and the Floor Warden's 14 do not feel alike,
 * and clamped at both ends so a scratch still registers and a big hit never becomes
 * unreadable. Pure, so the tuning is stated in one place and tested.
 */
export function shakeForDamage(damage: number): Shake {
  const fraction = Math.min(1, Math.max(NONE, damage / SATURATING_DAMAGE));
  return {
    durationMs: MIN_DURATION_MS + (MAX_DURATION_MS - MIN_DURATION_MS) * fraction,
    intensity: MIN_INTENSITY + (MAX_INTENSITY - MIN_INTENSITY) * fraction,
  };
}
