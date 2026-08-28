import type Phaser from 'phaser';
import type { Bargainable } from '../bargain/Bargainable';
import type { BargainDemand } from '../bargain/BargainDemand';
import type { Vector2 } from '../math/Vector2';
import type { EnemyData } from './EnemyData';

/**
 * An enemy present in the room. It holds its sprite by composition rather than
 * subclassing one, per GDD 9.2 and CLAUDE.md 5, and implements `Bargainable` because
 * every enemy in the roster so far can be parleyed with.
 *
 * It has no behaviour tree yet: combat AI is GDD 5.2, scheduled later in the roadmap.
 */
export class Enemy implements Bargainable {
  public constructor(
    private readonly sprite: Phaser.GameObjects.Sprite,
    public readonly data: EnemyData,
    public readonly demand: BargainDemand,
  ) {}

  public get position(): Vector2 {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  public flee(): void {
    this.sprite.destroy();
  }
}
