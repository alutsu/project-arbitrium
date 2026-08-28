import type { WeaponData } from '../data/WeaponData';
import type { PlayerResources } from '../player/PlayerResources';
import { WeaponSlot } from '../weapon/WeaponSlot';

/** The two things a player may do at the pedestal (GDD 2.3.1). */
export type LiquidationChoice = 'Swap' | 'Sell';

export interface LiquidationRequest {
  readonly choice: LiquidationChoice;
  readonly offered: WeaponData;
  readonly slot: WeaponSlot;
  readonly resources: PlayerResources;
}

export interface LiquidationResult {
  readonly slot: WeaponSlot;
  readonly resources: PlayerResources;
  /** Gold taken for the offered weapon, or null when it was taken up instead. */
  readonly soldFor: number | null;
}

/**
 * The Liquidation choice (GDD 2.3.1), which is what turns bad RNG into currency: Swap
 * takes the offered weapon and drops the one held, Sell dissolves the offer into gold
 * and leaves the held weapon alone.
 *
 * Pure, so the economy of the choice is testable without a scene (CLAUDE.md 3.5).
 */
export function resolveLiquidation(request: LiquidationRequest): LiquidationResult {
  if (request.choice === 'Swap') {
    return {
      slot: request.slot.swappedFor(request.offered),
      resources: request.resources,
      soldFor: null,
    };
  }
  return {
    slot: request.slot,
    resources: request.resources.gainGold(request.offered.goldValue),
    soldFor: request.offered.goldValue,
  };
}
