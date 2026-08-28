import type { PlayerResources } from './PlayerResources';
import type { PrideDebuff } from './PrideDebuff';

/** Everything a Parley can charge against: what the player owns, and how they feel. */
export interface PlayerState {
  readonly resources: PlayerResources;
  readonly pride: PrideDebuff;
}
