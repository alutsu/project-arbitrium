import type { WeaponData } from '../data/WeaponData';

/**
 * The player's armoury: exactly one weapon (GDD 2.3.1). Immutable, so swapping returns
 * a new slot rather than mutating shared state (CLAUDE.md 4.2).
 *
 * There is no second slot. The backup slot GDD 2.3.1 mentions is a meta-upgrade, which
 * belongs to the meta-progression sprint.
 */
export class WeaponSlot {
  public constructor(public readonly weapon: WeaponData) {}

  /** Takes the offered weapon; the one held is dropped and gone. */
  public swappedFor(offered: WeaponData): WeaponSlot {
    return new WeaponSlot(offered);
  }
}
