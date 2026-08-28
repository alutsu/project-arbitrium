import type { Damageable } from '../combat/Damageable';
import type { Vector2 } from '../math/Vector2';

/** What the player looks like to an enemy weapon. */
export interface PlayerTargetPorts {
  position(): Vector2;
  isAlive(): boolean;
  hurt(damage: number): void;
}

/**
 * Adapts the player to `Damageable` so enemy projectiles can use the same pool and the
 * same collision path as the player's own (CLAUDE.md 3.4).
 *
 * Knockback is deliberately ignored: being shoved around by every hit would fight the
 * deliberate, positional movement the Parley hold depends on.
 */
export class PlayerTarget implements Damageable {
  public constructor(private readonly ports: PlayerTargetPorts) {}

  public get position(): Vector2 {
    return this.ports.position();
  }

  public get isAlive(): boolean {
    return this.ports.isAlive();
  }

  public takeHit(damage: number): void {
    this.ports.hurt(damage);
  }
}
