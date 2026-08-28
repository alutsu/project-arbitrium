import { err, ok, type Result } from '../core/Result';
import type { PlayerResources } from '../player/PlayerResources';
import type { BargainCost } from './BargainCost';
import type { BargainDemand } from './BargainDemand';
import type { BargainSettings } from './BargainSettings';

const MAX_GOLD_FRACTION = 1;

/**
 * The rules of negotiation (GDD 2.2, 4.1). Phaser-free, so the economy can be tested
 * without a scene (CLAUDE.md 3.5).
 */
export class BargainService {
  public constructor(private readonly settings: BargainSettings) {}

  /**
   * What the demand actually costs right now. Bargaining after the Aggro Delay has
   * elapsed is still possible, but the price rises (GDD 4.1.1).
   */
  public costFor(demand: BargainDemand, roomElapsedMs: number): BargainCost {
    if (roomElapsedMs <= this.settings.aggroDelayMs) {
      return demand.cost;
    }
    return this.scale(demand.cost, this.settings.lateCostMultiplier);
  }

  public isLate(roomElapsedMs: number): boolean {
    return roomElapsedMs > this.settings.aggroDelayMs;
  }

  /** Charges the cost, or refuses when paying it would kill the player (GDD 8.3). */
  public settle(cost: BargainCost, resources: PlayerResources): Result<PlayerResources> {
    if (cost.kind === 'Gold') {
      return ok(resources.spendGoldFraction(cost.fractionOfGold));
    }
    if (!resources.canSurviveVitalityCost(cost.damage)) {
      return err('this demand would be fatal, and a Parley must never kill');
    }
    return ok(resources.loseVitality(cost.damage));
  }

  private scale(cost: BargainCost, multiplier: number): BargainCost {
    if (cost.kind === 'Gold') {
      return {
        kind: 'Gold',
        fractionOfGold: Math.min(MAX_GOLD_FRACTION, cost.fractionOfGold * multiplier),
      };
    }
    return { kind: 'Vitality', damage: Math.ceil(cost.damage * multiplier) };
  }
}
