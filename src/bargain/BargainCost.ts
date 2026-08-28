/** What an enemy demands to let the player pass (GDD 4.1.2). */
export type BargainCost =
  | { readonly kind: 'Gold'; readonly fractionOfGold: number }
  | { readonly kind: 'Vitality'; readonly damage: number }
  | { readonly kind: 'Pride'; readonly speedPenalty: number };

export type BargainCostKind = BargainCost['kind'];

export const BARGAIN_COST_KINDS: readonly BargainCostKind[] = ['Gold', 'Vitality', 'Pride'];
