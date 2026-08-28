/**
 * Phaser-free 2D vector. Game logic uses this instead of `Phaser.Math.Vector2` so
 * the rules stay unit-testable in isolation (CLAUDE.md 3.5).
 */
export interface Vector2 {
  readonly x: number;
  readonly y: number;
}
