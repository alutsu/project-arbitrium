import type { BargainCost } from './BargainCost';

const PERCENT = 100;

/** The Desire Icon's label: what this enemy is asking for, in the player's terms. */
export function describeCost(cost: BargainCost): string {
  switch (cost.kind) {
    case 'Gold':
      return `-${String(Math.round(cost.fractionOfGold * PERCENT))}% Gold`;
    case 'Vitality':
      return `-${String(cost.damage)} Vitality`;
    case 'Pride':
      return `-${String(Math.round(cost.speedPenalty * PERCENT))}% Speed`;
  }
}
