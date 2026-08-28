import { err, ok, type Result } from '../core/Result';
import type { UpgradeData } from '../data/UpgradeData';
import type { PlayerResources } from '../player/PlayerResources';
import { WeaponSlot } from '../weapon/WeaponSlot';
import { applyUpgrade } from './applyUpgrade';
import { getCompatibleUpgrades } from './getCompatibleUpgrades';
import { upgradeCostOn } from './upgradeCostOn';

/** A Module on the Forge's shelf, priced for the current floor. */
export interface ForgeOffer {
  readonly upgrade: UpgradeData;
  readonly cost: number;
}

export interface ForgePurchase {
  readonly offer: ForgeOffer;
  readonly slot: WeaponSlot;
  readonly resources: PlayerResources;
}

export interface ForgeReceipt {
  readonly slot: WeaponSlot;
  readonly resources: PlayerResources;
}

/**
 * The Forge (GDD 2.4). Phaser-free, so the shop's rules and economy are testable
 * without a scene (CLAUDE.md 3.5).
 */
export class ForgeService {
  public constructor(private readonly upgrades: readonly UpgradeData[]) {}

  /**
   * What this weapon can be offered on this floor.
   *
   * Two filters, in order: tag compatibility (2.4.1), then whether the Module carries a
   * modifier the game can actually apply. Stocking an inert Module would take the
   * player's gold and change nothing.
   */
  public stockFor(slot: WeaponSlot, floor: number): readonly ForgeOffer[] {
    return getCompatibleUpgrades(slot.weapon, this.upgrades)
      .filter(hasApplicableEffect)
      .map((upgrade) => ({ upgrade, cost: upgradeCostOn(upgrade, floor) }));
  }

  /** Fits the Module and charges for it, or explains why it cannot be bought. */
  public buy(purchase: ForgePurchase): Result<ForgeReceipt> {
    const { offer, slot, resources } = purchase;
    if (resources.gold < offer.cost) {
      return err(
        `${offer.upgrade.name} costs ${String(offer.cost)} gold; you have ${String(resources.gold)}`,
      );
    }
    return ok({
      slot: new WeaponSlot(applyUpgrade(slot.weapon, offer.upgrade)),
      resources: resources.spendGold(offer.cost),
    });
  }
}

function hasApplicableEffect(upgrade: UpgradeData): boolean {
  return (
    upgrade.damageMultiplier !== undefined ||
    upgrade.knockbackMultiplier !== undefined ||
    upgrade.extraProjectiles !== undefined
  );
}
