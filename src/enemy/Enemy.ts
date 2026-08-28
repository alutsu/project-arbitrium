import Phaser from 'phaser';
import type { Bargainable } from '../bargain/Bargainable';
import type { BargainDemand } from '../bargain/BargainDemand';
import type { Damageable } from '../combat/Damageable';
import { angleBetween } from '../math/angleBetween';
import type { Vector2 } from '../math/Vector2';
import type { EnemyData } from './EnemyData';
import { EnemyBrain } from './EnemyBrain';

const DEAD = 0;
/** Enough drag that a knocked-back enemy settles rather than sliding forever. */
const DRAG = 900;
/** How long a struck enemy shows white, so a hit reads even at a glance. */
const FLASH_MS = 90;
const FLASH_COLOR = 0xffffff;
const SPENT = 0;

/**
 * An enemy present in the room. It holds its sprite by composition rather than
 * subclassing one, per GDD 9.2 and CLAUDE.md 5.
 *
 * It can be bargained with (2.2), hurt (5.1), and acts through its own `EnemyBrain`
 * (5.2). The brain is pure; this class is the Phaser-facing half.
 */
export interface EnemySpec {
  readonly sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  readonly data: EnemyData;
  readonly demand: BargainDemand;
  /** The Notice window this enemy observes on entry (GDD 4.1.1). */
  readonly aggroDelayMs: number;
}

export class Enemy implements Bargainable, Damageable {
  public readonly brain: EnemyBrain;
  public readonly data: EnemyData;
  public readonly demand: BargainDemand;

  private readonly sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private vitality: number;
  private retired = false;
  private flashRemainingMs = SPENT;

  public constructor(spec: EnemySpec) {
    this.sprite = spec.sprite;
    this.data = spec.data;
    this.demand = spec.demand;
    this.brain = new EnemyBrain(spec.data.behaviour, spec.aggroDelayMs);
    this.vitality = spec.data.vitality;
    spec.sprite.setDrag(DRAG);
    spec.sprite.setCollideWorldBounds(true);
  }

  public get position(): Vector2 {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  /**
   * Still in play, and still something a weapon can hurt.
   *
   * False once the enemy has died *or* been paid off. A bargained enemy that reported
   * itself alive kept striking from where it stood, and kept absorbing bullets.
   */
  public get isAlive(): boolean {
    return this.vitality > DEAD && !this.retired;
  }

  public moveWith(velocity: Vector2): void {
    this.sprite.setVelocity(velocity.x, velocity.y);
  }

  /** Jumps to a new position, for the Blink-Stalker (GDD 5.1). */
  /** Clears the hit flash once it has run its course. */
  public tickFlash(deltaMs: number): void {
    if (this.flashRemainingMs <= SPENT) {
      return;
    }
    this.flashRemainingMs -= deltaMs;
    if (this.flashRemainingMs <= SPENT) {
      this.sprite.clearTint();
    }
  }

  public blinkTo(destination: Vector2): void {
    this.sprite.setVelocity(0, 0);
    this.sprite.setPosition(destination.x, destination.y);
  }

  public halt(): void {
    this.sprite.setVelocity(0, 0);
  }

  public takeHit(damage: number, knockback: number, from: Vector2): void {
    if (this.vitality <= DEAD) {
      return;
    }
    this.vitality -= damage;
    this.flashRemainingMs = FLASH_MS;
    // Phaser 4 retired setTintFill in favour of a tint plus an explicit mode.
    this.sprite.setTint(FLASH_COLOR).setTintMode(Phaser.TintModes.FILL);
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
    this.retired = true;
    this.sprite.disableBody(true, true);
  }
}
