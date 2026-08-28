import type { PlayerResources } from '../player/PlayerResources';
import type { PlayerState } from '../player/PlayerState';
import { PrideDebuff } from '../player/PrideDebuff';
import type { BargainCost } from './BargainCost';
import type { BargainDemand } from './BargainDemand';
import type { BargainSettings } from './BargainSettings';

const MAX_GOLD_FRACTION = 1;
/** A late Pride demand still has to leave the player able to move. */
const MAX_SPEED_PENALTY = 0.9;

export interface BargainContext {
  readonly roomElapsedMs: number;
  readonly resources: PlayerResources;
}

/**
 * The rules of negotiation (GDD 2.2, 4.1). Phaser-free, so the economy can be tested
 * without a scene (CLAUDE.md 3.5).
 */
export class BargainService {
  public constructor(private readonly settings: BargainSettings) {}

  /**
   * What the demand actually costs this player, right now.
   *
   * Two things move the price. Bargaining after the Aggro Delay is still possible but
   * costs 50% more (GDD 4.1.1). And a Gold demand an empty purse cannot answer is
   * taken out of the player's Vitality instead, scaled by how greedy the demand was
   * (GDD 4.1.2) — which is what eventually makes mercy lethal.
   */
  public costFor(demand: BargainDemand, context: BargainContext): BargainCost {
    const priced = this.applyLateSurcharge(demand.cost, context.roomElapsedMs);
    if (priced.kind !== 'Gold' || context.resources.canPayGoldFraction(priced.fractionOfGold)) {
      return priced;
    }
    return {
      kind: 'Vitality',
      damage: Math.ceil(priced.fractionOfGold * this.settings.vitalityForUnpayableGold),
    };
  }

  public isLate(roomElapsedMs: number): boolean {
    return roomElapsedMs > this.settings.aggroDelayMs;
  }

  /**
   * Charges the cost. A Parley can kill: paying in Vitality you do not have is how the
   * Death Spiral ends (GDD 2.2.2, 8.3). Pride costs nothing now and slows the rooms
   * that follow (GDD 4.1.2).
   */
  public settle(cost: BargainCost, state: PlayerState): PlayerState {
    switch (cost.kind) {
      case 'Gold':
        return { ...state, resources: state.resources.spendGoldFraction(cost.fractionOfGold) };
      case 'Vitality':
        return { ...state, resources: state.resources.loseVitality(cost.damage) };
      case 'Pride':
        return {
          ...state,
          pride: new PrideDebuff(cost.speedPenalty, this.settings.prideRoomsAffected),
        };
    }
  }

  private applyLateSurcharge(cost: BargainCost, roomElapsedMs: number): BargainCost {
    if (!this.isLate(roomElapsedMs)) {
      return cost;
    }
    const multiplier = this.settings.lateCostMultiplier;
    switch (cost.kind) {
      case 'Gold':
        return {
          kind: 'Gold',
          fractionOfGold: Math.min(MAX_GOLD_FRACTION, cost.fractionOfGold * multiplier),
        };
      case 'Vitality':
        return { kind: 'Vitality', damage: Math.ceil(cost.damage * multiplier) };
      case 'Pride':
        return {
          kind: 'Pride',
          speedPenalty: Math.min(MAX_SPEED_PENALTY, cost.speedPenalty * multiplier),
        };
    }
  }
}
