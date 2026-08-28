import type { EnemyTier } from '../bargain/BargainDemand';
import type { RoomTag } from '../dungeon/RoomTemplate';
import type { TileKind } from '../dungeon/TileKind';

/** Branded so an enemy id cannot be passed where another entity id is expected. */
export type EnemyId = string & { readonly __brand: 'EnemyId' };

/**
 * An entry in the enemy table the Encounter Director draws from (GDD 3.2.3, 5.1).
 *
 * `roomTags` and `prefers` are what make spawning contextual rather than sprinkled: an
 * enemy only appears in room shapes it suits, and stands on tiles that suit it.
 */
export interface EnemyData {
  readonly id: EnemyId;
  readonly name: string;
  readonly tier: EnemyTier;
  readonly spriteKey: string;
  /** Relative likelihood of being drawn when a room suits this enemy. */
  readonly weight: number;
  readonly roomTags: readonly RoomTag[];
  readonly prefers: readonly TileKind[];
}
