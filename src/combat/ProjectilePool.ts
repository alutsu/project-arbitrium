import type Phaser from 'phaser';
import type { Damageable } from './Damageable';

const MILLISECONDS_PER_SECOND = 1000;
const SPENT = 0;
/** Projectile radius plus a typical body radius, when a shot does not say otherwise. */
const DEFAULT_HIT_RADIUS = 17;

export interface Shot {
  readonly x: number;
  readonly y: number;
  readonly angle: number;
  readonly speed: number;
  readonly rangePixels: number;
  readonly damage: number;
  readonly knockback: number;
  /** How close counts as a hit. Defaults to a body-sized radius. */
  readonly hitRadiusPixels?: number;
}

/** What a projectile can run into. */
export interface ProjectileWorld {
  isSolidAt(x: number, y: number): boolean;
  readonly targets: readonly Damageable[];
}

interface Flight {
  readonly sprite: Phaser.GameObjects.Sprite;
  readonly velocityX: number;
  readonly velocityY: number;
  readonly damage: number;
  readonly knockback: number;
  readonly hitRadiusPixels: number;
  remainingPixels: number;
}

/**
 * Pooled projectiles (CLAUDE.md 5: never create per-frame entities in update). Sprites
 * are reused once spent, and a projectile retires when it hits something, hits a wall,
 * or runs out of range.
 *
 * Movement and collision are done here rather than through Arcade colliders: a handful
 * of projectiles against a handful of enemies is cheaper than the group plumbing, and it
 * keeps every value typed.
 */
export class ProjectilePool {
  private readonly sprites: Phaser.GameObjects.Sprite[] = [];
  private readonly flights: Flight[] = [];

  public constructor(
    private readonly scene: Phaser.Scene,
    private readonly textureKey: string,
    private readonly depth: number,
  ) {}

  public fire(shot: Shot): void {
    const sprite = this.take();
    sprite.setPosition(shot.x, shot.y);
    sprite.setRotation(shot.angle);
    sprite.setActive(true).setVisible(true);
    this.flights.push({
      sprite,
      velocityX: Math.cos(shot.angle) * shot.speed,
      velocityY: Math.sin(shot.angle) * shot.speed,
      damage: shot.damage,
      knockback: shot.knockback,
      hitRadiusPixels: shot.hitRadiusPixels ?? DEFAULT_HIT_RADIUS,
      remainingPixels: shot.rangePixels,
    });
  }

  /** Advances every projectile and returns whatever they hit this frame. */
  public update(deltaMs: number, world: ProjectileWorld): readonly Damageable[] {
    const seconds = deltaMs / MILLISECONDS_PER_SECOND;
    const struck: Damageable[] = [];

    for (let index = this.flights.length - 1; index >= SPENT; index--) {
      const flight = this.flights[index];
      if (flight === undefined) {
        continue;
      }
      const hit = this.advance(flight, seconds, world);
      if (hit === 'flying') {
        continue;
      }
      if (hit !== 'stopped') {
        struck.push(hit);
      }
      flight.sprite.setActive(false).setVisible(false);
      this.flights.splice(index, 1);
    }
    return struck;
  }

  private advance(
    flight: Flight,
    seconds: number,
    world: ProjectileWorld,
  ): Damageable | 'flying' | 'stopped' {
    const stepX = flight.velocityX * seconds;
    const stepY = flight.velocityY * seconds;
    flight.sprite.setPosition(flight.sprite.x + stepX, flight.sprite.y + stepY);
    flight.remainingPixels -= Math.hypot(stepX, stepY);

    if (flight.remainingPixels <= SPENT || world.isSolidAt(flight.sprite.x, flight.sprite.y)) {
      return 'stopped';
    }
    const target = world.targets.find(
      (candidate) =>
        candidate.isAlive &&
        Math.hypot(
          candidate.position.x - flight.sprite.x,
          candidate.position.y - flight.sprite.y,
        ) <= flight.hitRadiusPixels,
    );
    if (target === undefined) {
      return 'flying';
    }
    target.takeHit(flight.damage, flight.knockback, {
      x: flight.sprite.x - stepX,
      y: flight.sprite.y - stepY,
    });
    return target;
  }

  private take(): Phaser.GameObjects.Sprite {
    const idle = this.sprites.find((sprite) => !sprite.active);
    if (idle !== undefined) {
      return idle;
    }
    const created = this.scene.add.sprite(0, 0, this.textureKey).setDepth(this.depth);
    this.sprites.push(created);
    return created;
  }

  /** Retires every projectile in flight, for a room change. */
  public clear(): void {
    for (const flight of this.flights) {
      flight.sprite.setActive(false).setVisible(false);
    }
    this.flights.length = SPENT;
  }

  public destroy(): void {
    this.clear();
    for (const sprite of this.sprites) {
      sprite.destroy();
    }
    this.sprites.length = SPENT;
  }
}
