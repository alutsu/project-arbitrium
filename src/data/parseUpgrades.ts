import { err, ok, type Result } from '../core/Result';
import { isJsonRecord } from './JsonRecord';
import { readField } from './readField';
import { WEAPON_TAGS } from './WeaponTag';
import type { UpgradeData, UpgradeId } from './UpgradeData';

/** Validates the contents of `upgrades.json` (GDD 3.1.2, 9.1). */
export function parseUpgrades(raw: unknown): Result<readonly UpgradeData[]> {
  if (!Array.isArray(raw)) {
    return err('upgrades.json must contain an array of upgrades');
  }

  const upgrades: UpgradeData[] = [];
  for (const [index, entry] of raw.entries()) {
    const parsed = parseUpgrade(entry, index);
    if (!parsed.ok) {
      return parsed;
    }
    upgrades.push(parsed.value);
  }
  return ok(upgrades);
}

function parseUpgrade(entry: unknown, index: number): Result<UpgradeData> {
  if (!isJsonRecord(entry)) {
    return err(`upgrades[${String(index)}] must be an object`);
  }

  const at = (message: string): string => `upgrades[${String(index)}]: ${message}`;

  const id = readField.string(entry, 'id');
  if (!id.ok) return err(at(id.error));
  const name = readField.string(entry, 'name');
  if (!name.ok) return err(at(name.error));
  const iconKey = readField.string(entry, 'iconKey');
  if (!iconKey.ok) return err(at(iconKey.error));
  const goldCost = readField.number(entry, 'goldCost');
  if (!goldCost.ok) return err(at(goldCost.error));
  const requiredTags = readField.arrayOf(entry, 'requiredTags', WEAPON_TAGS);
  if (!requiredTags.ok) return err(at(requiredTags.error));
  const forbiddenTags = readField.arrayOf(entry, 'forbiddenTags', WEAPON_TAGS);
  if (!forbiddenTags.ok) return err(at(forbiddenTags.error));
  const damageMultiplier = readField.optionalNumber(entry, 'damageMultiplier');
  if (!damageMultiplier.ok) return err(at(damageMultiplier.error));
  const extraProjectiles = readField.optionalNumber(entry, 'extraProjectiles');
  if (!extraProjectiles.ok) return err(at(extraProjectiles.error));
  const enableExplosions = readField.optionalBoolean(entry, 'enableExplosions');
  if (!enableExplosions.ok) return err(at(enableExplosions.error));

  const conflict = requiredTags.value.find((tag) => forbiddenTags.value.includes(tag));
  if (conflict !== undefined) {
    return err(at(`"${conflict}" is both required and forbidden, so it can never apply`));
  }

  return ok({
    // Safe to brand: the value was just proven to be a non-empty string.
    id: id.value as UpgradeId,
    name: name.value,
    goldCost: goldCost.value,
    iconKey: iconKey.value,
    requiredTags: requiredTags.value,
    forbiddenTags: forbiddenTags.value,
    // Spread conditionally so an absent modifier stays absent rather than becoming
    // an explicit undefined, which `exactOptionalPropertyTypes` rejects.
    ...(damageMultiplier.value !== undefined && { damageMultiplier: damageMultiplier.value }),
    ...(extraProjectiles.value !== undefined && { extraProjectiles: extraProjectiles.value }),
    ...(enableExplosions.value !== undefined && { enableExplosions: enableExplosions.value }),
  });
}
