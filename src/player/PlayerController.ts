import type { InputIntent } from '../input/InputIntent';
import type { Vector2 } from '../math/Vector2';
import type { PlayerActor } from './PlayerActor';
import type { PlayerMovement } from './PlayerMovement';

/**
 * Drives the player actor from this frame's intent. Phaser-free (CLAUDE.md 3.5), and
 * it does not read input itself: the scene reads once per frame and shares the intent,
 * because Parley needs the same snapshot and edge-detected presses survive only one read.
 */
export class PlayerController {
  public constructor(
    private readonly movement: PlayerMovement,
    private readonly actor: PlayerActor,
  ) {}

  public update(intent: InputIntent): void {
    this.actor.setVelocity(this.movement.resolveVelocity(intent));

    const position = this.actor.position;
    // Aiming exactly at your own feet has no direction; keep the current facing
    // instead of snapping to the right.
    if (intent.aimPoint.x === position.x && intent.aimPoint.y === position.y) {
      return;
    }
    this.actor.setFacing(angleBetween(position, intent.aimPoint));
  }
}

function angleBetween(from: Vector2, to: Vector2): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}
