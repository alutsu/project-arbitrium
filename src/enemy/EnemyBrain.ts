import { AttackCooldown } from '../combat/AttackCooldown';
import { findPath } from '../dungeon/findPath';
import type { NavigationGrid } from '../dungeon/NavigationGrid';
import { angleBetween } from '../math/angleBetween';
import type { Vector2 } from '../math/Vector2';
import type { EnemyBehaviourData } from './EnemyBehaviourData';

const HOLD: EnemyAction = { kind: 'hold' };
const NEXT_STEP = 1;
const TILE_CENTRE = 0.5;

/** What an enemy decided to do this frame; the scene carries it out. */
export type EnemyAction =
  | { readonly kind: 'hold' }
  | { readonly kind: 'advance'; readonly velocity: Vector2 }
  | { readonly kind: 'strike'; readonly damage: number }
  | {
      readonly kind: 'shoot';
      readonly angle: number;
      readonly speed: number;
      readonly rangePixels: number;
      readonly damage: number;
      readonly hitRadiusPixels: number;
    }
  | { readonly kind: 'teleport'; readonly to: Vector2 };

export interface EnemyContext {
  readonly selfPosition: Vector2;
  readonly playerPosition: Vector2;
  /** True while the player is parleying and this enemy is inside the Sphere. */
  readonly isNegotiating: boolean;
  /** Milliseconds since the player entered this room. */
  readonly roomElapsedMs: number;
  readonly deltaMs: number;
  readonly grid: NavigationGrid;
  readonly tilePixels: number;
}

/**
 * The Combat and Bargaining states from GDD 5.2, plus the Notice window from 4.1.1.
 *
 * Three states, checked in order:
 *
 * - **Notice** — for the first `aggroDelayMs` after the player arrives, the enemy is
 *   alert but does not act. This is the Parley Window in 2.1 having teeth: it is a real
 *   grace period, not just a cheaper price.
 * - **Bargaining** — while the player holds Parley and this enemy is inside the Sphere,
 *   it holds. Negotiating and attacking are not the same activity.
 * - **Combat** — close and strike, or hold position and shoot.
 *
 * Phaser-free, so every state and transition is testable (CLAUDE.md 3.5).
 */
export class EnemyBrain {
  private readonly cooldown = new AttackCooldown();
  private readonly blinkCooldown = new AttackCooldown();

  public constructor(
    private readonly behaviour: EnemyBehaviourData,
    private readonly aggroDelayMs: number,
  ) {}

  public decide(context: EnemyContext): EnemyAction {
    this.cooldown.tick(context.deltaMs);
    this.blinkCooldown.tick(context.deltaMs);

    if (context.roomElapsedMs <= this.aggroDelayMs || context.isNegotiating) {
      return HOLD;
    }
    if (this.behaviour.kind === 'Melee') {
      return this.fight(context);
    }
    return this.behaviour.kind === 'Blink' ? this.blink(context) : this.shoot(context);
  }

  /**
   * The Blink-Stalker (GDD 5.1): it does not walk. When out of reach it waits for its
   * blink to come up, then jumps several tiles along the path to the player, which lets
   * it cross cover that would stop anything else.
   */
  private blink(context: EnemyContext): EnemyAction {
    if (this.behaviour.kind !== 'Blink') {
      return HOLD;
    }
    if (distance(context.selfPosition, context.playerPosition) <= this.behaviour.reachPixels) {
      if (!this.cooldown.isReady) {
        return HOLD;
      }
      this.cooldown.spend(this.behaviour.attackRate);
      return { kind: 'strike', damage: this.behaviour.damage };
    }
    if (!this.blinkCooldown.isReady) {
      return HOLD;
    }
    const landing = this.landingFor(context, this.behaviour.blinkStepTiles);
    if (landing === undefined) {
      return HOLD;
    }
    this.blinkCooldown.spend(this.behaviour.blinkRate);
    return { kind: 'teleport', to: landing };
  }

  /** The tile a blink lands on: as far along the path as the blink reaches. */
  private landingFor(context: EnemyContext, stepTiles: number): Vector2 | undefined {
    const path = findPath(
      context.grid,
      toTile(context.selfPosition, context.tilePixels),
      toTile(context.playerPosition, context.tilePixels),
    );
    if (path === null) {
      return undefined;
    }
    const step = path[Math.min(stepTiles, path.length - NEXT_STEP)];
    if (step === undefined) {
      return undefined;
    }
    return {
      x: (step.x + TILE_CENTRE) * context.tilePixels,
      y: (step.y + TILE_CENTRE) * context.tilePixels,
    };
  }

  private fight(context: EnemyContext): EnemyAction {
    if (this.behaviour.kind !== 'Melee') {
      return HOLD;
    }
    const gap = distance(context.selfPosition, context.playerPosition);
    if (gap <= this.behaviour.reachPixels) {
      if (!this.cooldown.isReady) {
        return HOLD;
      }
      this.cooldown.spend(this.behaviour.attackRate);
      return { kind: 'strike', damage: this.behaviour.damage };
    }
    return this.advance(context, this.behaviour.moveSpeedPixelsPerSecond);
  }

  private shoot(context: EnemyContext): EnemyAction {
    if (this.behaviour.kind !== 'StationaryRanged') {
      return HOLD;
    }
    const gap = distance(context.selfPosition, context.playerPosition);
    if (gap > this.behaviour.rangePixels || !this.cooldown.isReady) {
      return HOLD;
    }
    this.cooldown.spend(this.behaviour.attackRate);
    return {
      kind: 'shoot',
      angle: angleBetween(context.selfPosition, context.playerPosition),
      speed: this.behaviour.projectileSpeed,
      rangePixels: this.behaviour.rangePixels,
      damage: this.behaviour.damage,
      hitRadiusPixels: this.behaviour.blastRadiusPixels,
    };
  }

  /** Steers toward the next tile on the path, so walls are rounded rather than hugged. */
  private advance(context: EnemyContext, speed: number): EnemyAction {
    const from = toTile(context.selfPosition, context.tilePixels);
    const to = toTile(context.playerPosition, context.tilePixels);
    const path = findPath(context.grid, from, to);
    const step = path?.[NEXT_STEP];

    const target =
      step === undefined
        ? context.playerPosition
        : {
            x: (step.x + TILE_CENTRE) * context.tilePixels,
            y: (step.y + TILE_CENTRE) * context.tilePixels,
          };

    const heading = angleBetween(context.selfPosition, target);
    return {
      kind: 'advance',
      velocity: { x: Math.cos(heading) * speed, y: Math.sin(heading) * speed },
    };
  }
}

function distance(from: Vector2, to: Vector2): number {
  return Math.hypot(to.x - from.x, to.y - from.y);
}

function toTile(position: Vector2, tilePixels: number): { x: number; y: number } {
  return { x: Math.floor(position.x / tilePixels), y: Math.floor(position.y / tilePixels) };
}
