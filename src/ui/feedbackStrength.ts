/** The damage at which a shake is already as violent as it will get. */
const SATURATING_DAMAGE = 20;
const NONE = 0;
const FULL = 1;

export interface Shake {
  readonly durationMs: number;
  readonly intensity: number;
}

interface ShakeRange {
  readonly minDurationMs: number;
  readonly maxDurationMs: number;
  /**
   * Phaser reads intensity as a fraction of the viewport, not a pixel count: 0.016 of a
   * 1280-wide canvas throws the world about twenty pixels and shoves the room over the
   * HUD. These ranges are deliberately small.
   */
  readonly minIntensity: number;
  readonly maxIntensity: number;
}

/** Taking a hit. The heavier kick of the two, because it is a threat. */
const TAKEN: ShakeRange = {
  minDurationMs: 90,
  maxDurationMs: 220,
  minIntensity: 0.002,
  maxIntensity: 0.007,
};

/**
 * Landing a hit. Shorter and lighter than taking one: it should punctuate the hit
 * without competing with the feedback that the player is in danger.
 */
const LANDED: ShakeRange = {
  minDurationMs: 45,
  maxDurationMs: 80,
  minIntensity: 0.0012,
  maxIntensity: 0.003,
};

/** How hard the camera should kick when the player is hit for this much. */
export function shakeForDamage(damage: number): Shake {
  return shakeIn(TAKEN, damage);
}

/** How hard the camera should kick when the player lands a hit for this much. */
export function shakeForLandedHit(damage: number): Shake {
  return shakeIn(LANDED, damage);
}

/**
 * Scaled by damage and clamped at both ends, so a scratch still registers and a big hit
 * never becomes unreadable.
 */
function shakeIn(range: ShakeRange, damage: number): Shake {
  const fraction = Math.min(FULL, Math.max(NONE, damage / SATURATING_DAMAGE));
  return {
    durationMs: range.minDurationMs + (range.maxDurationMs - range.minDurationMs) * fraction,
    intensity: range.minIntensity + (range.maxIntensity - range.minIntensity) * fraction,
  };
}
