import type { InputSource } from '../input/InputSource';
import type { Vector2 } from '../math/Vector2';
import type { PlayerActor } from './PlayerActor';
import type { PlayerMovement } from './PlayerMovement';

/**
 * Drives the player actor from input, once per frame. Phaser-free (CLAUDE.md 3.5):
 * it talks to `InputSource` and `PlayerActor`, never to a scene or a sprite.
 */
export class PlayerController {
  public constructor(
    private readonly input: InputSource,
    private readonly movement: PlayerMovement,
    private readonly actor: PlayerActor,
  ) {}

  public update(): void {
    const intent = this.input.readIntent();
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
