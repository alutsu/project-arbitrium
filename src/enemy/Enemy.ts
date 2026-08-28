import type Phaser from 'phaser';
import type { Bargainable } from '../bargain/Bargainable';
import type { BargainDemand } from '../bargain/BargainDemand';
import type { Damageable } from '../combat/Damageable';
import { angleBetween } from '../math/angleBetween';
import type { Vector2 } from '../math/Vector2';
import type { EnemyData } from './EnemyData';

const DEAD = 0;
/** Enough drag that a knocked-back enemy settles rather than sliding forever. */
const DRAG = 900;

/**
 * An enemy present in the room. It holds its sprite by composition rather than
 * subclassing one, per GDD 9.2 and CLAUDE.md 5.
 *
 * It can be bargained with (2.2) and hurt (5.1). It has no behaviour tree yet: that is
 * GDD 5.2, and it is the next sprint.
 */
export class Enemy implements Bargainable, Damageable {
  private vitality: number;

  public constructor(
    private readonly sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
    public readonly data: EnemyData,
    public readonly demand: BargainDemand,
  ) {
    this.vitality = data.vitality;
    sprite.setDrag(DRAG);
    sprite.setCollideWorldBounds(true);
  }

  public get position(): Vector2 {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  public get isAlive(): boolean {
    return this.vitality > DEAD;
  }

  public takeHit(damage: number, knockback: number, from: Vector2): void {
    if (this.vitality <= DEAD) {
      return;
    }
    this.vitality -= damage;
    const away = angleBetween(from, this.position);
    this.sprite.setVelocity(Math.cos(away) * knockback, Math.sin(away) * knockback);
    if (this.vitality <= DEAD) {
      this.retire();
    }
  }

  /**
   * Leaves the arena having been paid off. Distinct from dying: a bargained enemy drops
   * no loot and grants no gold (GDD 2.2.2).
   */
  public flee(): void {
    this.retire();
  }

  /**
   * Leaves the sprite in place but inert. Destroying it here would leave the room's
   * wall collider, and any roster still holding this enemy, pointing at a dead object;
   * the scene destroys the sprites when the room changes.
   */
  private retire(): void {
    this.sprite.disableBody(true, true);
  }
}
