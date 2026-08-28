/**
 * Injected randomness (CLAUDE.md 3.5). Generation never calls `Math.random()`, which
 * is what makes a dungeon seedable, reproducible and testable.
 */
export interface Rng {
  /** A whole number in [0, exclusiveMax). Throws if the range is empty. */
  nextInt(exclusiveMax: number): number;
}
