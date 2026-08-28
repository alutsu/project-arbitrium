import type { EnemyTier } from '../bargain/BargainDemand';
import type { RoomTag } from '../dungeon/RoomTemplate';
import type { TileKind } from '../dungeon/TileKind';
import type { EnemyBehaviourData } from './EnemyBehaviourData';

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
  /** How much damage this enemy absorbs before dying. */
  readonly vitality: number;
  /** Gold dropped on death. Bargaining pays none of it (GDD 2.2.2, 8.3). */
  readonly goldReward: number;
  readonly roomTags: readonly RoomTag[];
  readonly prefers: readonly TileKind[];
  /** How it acts in combat (GDD 5.1, 5.2). */
  readonly behaviour: EnemyBehaviourData;
  /**
   * Whether the player may Parley with it. A Boss cannot be bargained with (GDD 2.2.2),
   * which is why room clearance counts enemies rather than negotiable ones.
   */
  readonly canBargain: boolean;
  /** Most that may appear in one room. Absent means no limit. */
  readonly maxPerRoom?: number;
}
