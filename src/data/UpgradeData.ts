import type { WeaponTag } from './WeaponTag';

/** Branded so an upgrade id cannot be passed where a weapon id is expected. */
export type UpgradeId = string & { readonly __brand: 'UpgradeId' };

/**
 * A Forge Module (GDD 2.4, 3.1.2). `requiredTags` must all be present on the weapon
 * and `forbiddenTags` must all be absent for the Module to be offered.
 *
 * The modifier fields are optional because they are genuinely absent on Modules that
 * do not use them, never "not filled in yet" (CLAUDE.md 2.2).
 */
export interface UpgradeData {
  readonly id: UpgradeId;
  readonly name: string;
  readonly goldCost: number;
  readonly iconKey: string;
  readonly requiredTags: readonly WeaponTag[];
  readonly forbiddenTags: readonly WeaponTag[];
  readonly damageMultiplier?: number;
  readonly extraProjectiles?: number;
  readonly enableExplosions?: boolean;
}
