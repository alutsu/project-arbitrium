import type Phaser from 'phaser';
import type { Bargainable } from '../bargain/Bargainable';
import type { BargainDemand } from '../bargain/BargainDemand';
import type { Vector2 } from '../math/Vector2';

/**
 * A Normal-tier melee enemy (GDD 5.1), present here only so Parley has something to
 * negotiate with. It has no behaviour tree yet: combat AI is GDD 5.2 and arrives with
 * the enemy work later in the roadmap. Composition, not a Sprite subclass (CLAUDE.md 5).
 */
export class Grunt implements Bargainable {
  public constructor(
    private readonly sprite: Phaser.GameObjects.Sprite,
    public readonly demand: BargainDemand,
  ) {}

  public get position(): Vector2 {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  public flee(): void {
    this.sprite.destroy();
  }
}
