/**
 * What an enemy demands to let the player pass (GDD 4.1.2).
 *
 * The GDD lists a third resource, Pride (a temporary speed debuff lasting into the
 * next room). It is deliberately absent until the dungeon has rooms to scope it to,
 * which arrives with the topology in Sprint 4; adding it now would mean a cost the
 * game can charge but never expire.
 */
export type BargainCost =
  | { readonly kind: 'Gold'; readonly fractionOfGold: number }
  | { readonly kind: 'Vitality'; readonly damage: number };

export type BargainCostKind = BargainCost['kind'];

export const BARGAIN_COST_KINDS: readonly BargainCostKind[] = ['Gold', 'Vitality'];
