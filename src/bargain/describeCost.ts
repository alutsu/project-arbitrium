import type { BargainCost } from './BargainCost';

const PERCENT = 100;

/** The Desire Icon's label: what this enemy is asking for, in the player's terms. */
export function describeCost(cost: BargainCost): string {
  if (cost.kind === 'Gold') {
    return `-${String(Math.round(cost.fractionOfGold * PERCENT))}% Gold`;
  }
  return `-${String(cost.damage)} Vitality`;
}
