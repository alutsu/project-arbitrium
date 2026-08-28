import type Phaser from 'phaser';
import type { Vector2 } from '../math/Vector2';
import type { PlayerActor } from './PlayerActor';

/**
 * Binds `PlayerActor` to an Arcade Physics sprite. The sprite is held by
 * composition rather than subclassed, per GDD 9.2 and CLAUDE.md 5.
 */
export class ArcadePlayerActor implements PlayerActor {
  public constructor(private readonly sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody) {}

  public get position(): Vector2 {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  public setVelocity(velocity: Vector2): void {
    this.sprite.setVelocity(velocity.x, velocity.y);
  }

  public setFacing(radians: number): void {
    this.sprite.setRotation(radians);
  }
}
