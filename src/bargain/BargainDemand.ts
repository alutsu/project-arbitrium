import type { BargainCost } from './BargainCost';

/** Enemy rarity, which sets how complex a demand may be (GDD 2.2.1, 5.1). */
export type EnemyTier = 'Normal' | 'Rare' | 'Unique';

export const ENEMY_TIERS: readonly EnemyTier[] = ['Normal', 'Rare', 'Unique'];

/** The Desire an enemy displays above its head while the player is parleying. */
export interface BargainDemand {
  readonly tier: EnemyTier;
  readonly cost: BargainCost;
}
