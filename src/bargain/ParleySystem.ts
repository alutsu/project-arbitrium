import { PlayerResources } from '../player/PlayerResources';
import type { Vector2 } from '../math/Vector2';
import type { Bargainable } from './Bargainable';
import type { BargainCost } from './BargainCost';
import type { BargainService } from './BargainService';
import type { BargainSettings } from './BargainSettings';
import { findWithinSphere } from './findWithinSphere';
import type { ParleySession, ParleyStatus } from './ParleySession';

export interface ParleySystemDeps {
  readonly session: ParleySession;
  readonly service: BargainService;
  readonly settings: BargainSettings;
  readonly resources: PlayerResources;
}

export interface ParleyInputFrame {
  readonly isParleying: boolean;
  readonly playerPosition: Vector2;
  readonly deltaMs: number;
  readonly roomElapsedMs: number;
}

/** One enemy inside the Sphere, with what it is asking for right now. */
export interface ParleyTarget {
  readonly bargainable: Bargainable;
  readonly cost: BargainCost;
}

export interface ParleyFrame {
  readonly isParleying: boolean;
  /** Everyone showing a Desire Icon, nearest first. */
  readonly visible: readonly ParleyTarget[];
  readonly status: ParleyStatus;
  /** True once the Aggro Delay has lapsed and demands cost more (GDD 4.1.1). */
  readonly isLate: boolean;
}

/**
 * Runs the Parley loop: who is in the Sphere, what they want, and what happens when
 * the hold completes. Phaser-free, so the whole negotiation is testable (CLAUDE.md 3.5).
 */
export class ParleySystem {
  private readonly bargainables: Bargainable[] = [];
  private currentResources: PlayerResources;

  public constructor(private readonly deps: ParleySystemDeps) {
    this.currentResources = deps.resources;
  }

  public add(bargainable: Bargainable): void {
    this.bargainables.push(bargainable);
  }

  /** Forgets every bargainable, for when the player leaves the room they were in. */
  public clear(): void {
    this.bargainables.length = 0;
  }

  public get resources(): PlayerResources {
    return this.currentResources;
  }

  public update(input: ParleyInputFrame): ParleyFrame {
    const isLate = this.deps.service.isLate(input.roomElapsedMs);

    if (!input.isParleying) {
      return {
        isParleying: false,
        visible: [],
        status: this.deps.session.update({ isParleying: false, target: null, deltaMs: 0 }),
        isLate,
      };
    }

    const inSphere = findWithinSphere(
      input.playerPosition,
      this.bargainables,
      this.deps.settings.sphereRadiusPixels,
    );
    const visible = inSphere.map((bargainable) => ({
      bargainable,
      cost: this.deps.service.costFor(bargainable.demand, {
        roomElapsedMs: input.roomElapsedMs,
        resources: this.currentResources,
      }),
    }));

    const status = this.deps.session.update({
      isParleying: true,
      target: inSphere[0] ?? null,
      deltaMs: input.deltaMs,
    });

    if (status.kind === 'completed') {
      this.settle(status.target, input);
    }
    return { isParleying: true, visible, status, isLate };
  }

  private settle(target: Bargainable, input: ParleyInputFrame): void {
    const cost = this.deps.service.costFor(target.demand, {
      roomElapsedMs: input.roomElapsedMs,
      resources: this.currentResources,
    });
    this.currentResources = this.deps.service.settle(cost, this.currentResources);

    const index = this.bargainables.indexOf(target);
    if (index >= 0) {
      this.bargainables.splice(index, 1);
    }
    // Paid off, so it leaves without dropping anything (GDD 2.2.2).
    target.flee();
  }
}
