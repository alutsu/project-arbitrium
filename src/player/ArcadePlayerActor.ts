import type Phaser from 'phaser';
import type { Vector2 } from '../math/Vector2';
import type { PlayerActor } from './PlayerActor';

/**
 * Binds `PlayerActor` to an Arcade Physics sprite. The sprite is held by
 * composition rather than subclassed, per GDD 9.2 and CLAUDE.md 5.
 */
export class ArcadePlayerActor implements PlayerActor {
  public constructor(private readonly sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody) {
    // Movement is delta-scaled by PlayerMovement and applied as a position change,
    // so the body derives its own velocity from that change instead of integrating
    // one we set. Collision separation and world bounds still apply; setting body
    // velocity directly has no effect while this is enabled.
    this.sprite.body.setDirectControl(true);
  }

  public get position(): Vector2 {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  public moveBy(displacement: Vector2): void {
    // The body is the source of truth: postUpdate applies the body's own position
    // change to the sprite, so moving the sprite instead would desync the two.
    this.sprite.body.position.add(displacement);
  }

  public setFacing(radians: number): void {
    this.sprite.setRotation(radians);
  }
}
