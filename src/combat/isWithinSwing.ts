import { degreesToRadians } from '../math/degreesToRadians';
import type { Vector2 } from '../math/Vector2';

const HALF = 0.5;
const FULL_TURN = Math.PI + Math.PI;

export interface Swing {
  readonly origin: Vector2;
  readonly aimRadians: number;
  /** Total width of the arc in degrees (GDD 2.3.2, Blade). */
  readonly swingArc: number;
  /** How far the swing reaches (GDD 2.3.2, Handle). */
  readonly reachPixels: number;
}

/**
 * Whether a melee swing connects with a target: inside the reach, and inside the arc
 * centred on where the player is aiming.
 *
 * Pure, so melee coverage is testable without a scene (CLAUDE.md 3.5).
 */
export function isWithinSwing(swing: Swing, target: Vector2): boolean {
  const dx = target.x - swing.origin.x;
  const dy = target.y - swing.origin.y;
  if (Math.hypot(dx, dy) > swing.reachPixels) {
    return false;
  }
  const toTarget = Math.atan2(dy, dx);
  const halfArc = degreesToRadians(swing.swingArc) * HALF;
  return Math.abs(shortestTurn(swing.aimRadians, toTarget)) <= halfArc;
}

/** The signed angle from one heading to another, in [-PI, PI]. */
function shortestTurn(from: number, to: number): number {
  const difference = (to - from) % FULL_TURN;
  if (difference > Math.PI) {
    return difference - FULL_TURN;
  }
  if (difference < -Math.PI) {
    return difference + FULL_TURN;
  }
  return difference;
}
