import type { BargainDemand } from './BargainDemand';
import type { BargainSettings } from './BargainSettings';

/** Everything `bargain.json` provides: the timings, and the Desires enemies may hold. */
export interface BargainData {
  readonly settings: BargainSettings;
  readonly demands: readonly BargainDemand[];
}
