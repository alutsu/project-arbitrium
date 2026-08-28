import { err, ok, type Result } from '../core/Result';
import { isJsonRecord, type JsonRecord } from './JsonRecord';
import { readField } from './readField';
import { WEAPON_TAGS } from './WeaponTag';
import { WEAPON_TYPES, type WeaponData, type WeaponId } from './WeaponData';

const MIN_GOLD_VALUE = 0;
const MIN_PROJECTILES = 1;

/**
 * Validates the contents of `weapons.json` (GDD 3.1.1). Never trust a cache read to
 * match its interface (CLAUDE.md 2.3): everything arrives as `unknown` and is proven
 * here before the rest of the game sees it.
 */
export function parseWeapons(raw: unknown): Result<readonly WeaponData[]> {
  if (!Array.isArray(raw)) {
    return err('weapons.json must contain an array of weapons');
  }

  const weapons: WeaponData[] = [];
  for (const [index, entry] of raw.entries()) {
    const parsed = parseWeapon(entry, index);
    if (!parsed.ok) {
      return parsed;
    }
    weapons.push(parsed.value);
  }
  return ok(weapons);
}

function parseWeapon(entry: unknown, index: number): Result<WeaponData> {
  if (!isJsonRecord(entry)) {
    return err(`weapons[${String(index)}] must be an object`);
  }

  const at = (message: string): string => `weapons[${String(index)}]: ${message}`;

  const id = readField.string(entry, 'id');
  if (!id.ok) return err(at(id.error));
  const name = readField.string(entry, 'name');
  if (!name.ok) return err(at(name.error));
  const spriteKey = readField.string(entry, 'spriteKey');
  if (!spriteKey.ok) return err(at(spriteKey.error));
  const tags = readField.arrayOf(entry, 'tags', WEAPON_TAGS);
  if (!tags.ok) return err(at(tags.error));
  const damage = readField.number(entry, 'damage');
  if (!damage.ok) return err(at(damage.error));
  const attackRate = readField.number(entry, 'attackRate');
  if (!attackRate.ok) return err(at(attackRate.error));
  const knockbackForce = readField.number(entry, 'knockbackForce');
  if (!knockbackForce.ok) return err(at(knockbackForce.error));
  const goldValue = readField.number(entry, 'goldValue');
  if (!goldValue.ok) return err(at(goldValue.error));
  if (goldValue.value <= MIN_GOLD_VALUE) {
    return err(at('"goldValue" must be greater than zero, or selling it is never a choice'));
  }
  const type = readField.oneOf(entry, 'type', WEAPON_TYPES);
  if (!type.ok) return err(at(type.error));

  const base = {
    // Safe to brand: the value was just proven to be a non-empty string.
    id: id.value as WeaponId,
    name: name.value,
    tags: tags.value,
    spriteKey: spriteKey.value,
    damage: damage.value,
    attackRate: attackRate.value,
    knockbackForce: knockbackForce.value,
    goldValue: goldValue.value,
  };

  const opposite = type.value === 'Ranged' ? 'Melee' : 'Ranged';
  if (!tags.value.includes(type.value)) {
    return err(at(`a ${type.value} weapon must carry the "${type.value}" tag`));
  }
  if (tags.value.includes(opposite)) {
    return err(at(`a ${type.value} weapon must not carry the "${opposite}" tag`));
  }

  return type.value === 'Ranged' ? parseRanged(entry, base, at) : parseMelee(entry, base, at);
}

type WeaponBaseFields = Omit<
  Extract<WeaponData, { type: 'Melee' }>,
  'type' | 'swingArc' | 'lungeAmount' | 'reachPixels'
>;
type Contextualize = (message: string) => string;

function parseRanged(
  entry: JsonRecord,
  base: WeaponBaseFields,
  at: Contextualize,
): Result<WeaponData> {
  const projectileSpriteKey = readField.string(entry, 'projectileSpriteKey');
  if (!projectileSpriteKey.ok) return err(at(projectileSpriteKey.error));
  const projectileSpeed = readField.number(entry, 'projectileSpeed');
  if (!projectileSpeed.ok) return err(at(projectileSpeed.error));
  const projectileCount = readField.number(entry, 'projectileCount');
  if (!projectileCount.ok) return err(at(projectileCount.error));
  const spreadDegrees = readField.number(entry, 'spreadDegrees');
  if (!spreadDegrees.ok) return err(at(spreadDegrees.error));
  const rangePixels = readField.number(entry, 'rangePixels');
  if (!rangePixels.ok) return err(at(rangePixels.error));
  if (projectileCount.value < MIN_PROJECTILES || rangePixels.value <= MIN_GOLD_VALUE) {
    return err(at('a ranged weapon needs at least one projectile and a range above zero'));
  }

  return ok({
    ...base,
    type: 'Ranged',
    projectileSpriteKey: projectileSpriteKey.value,
    projectileSpeed: projectileSpeed.value,
    projectileCount: projectileCount.value,
    spreadDegrees: spreadDegrees.value,
    rangePixels: rangePixels.value,
  });
}

function parseMelee(
  entry: JsonRecord,
  base: WeaponBaseFields,
  at: Contextualize,
): Result<WeaponData> {
  const swingArc = readField.number(entry, 'swingArc');
  if (!swingArc.ok) return err(at(swingArc.error));
  const lungeAmount = readField.number(entry, 'lungeAmount');
  if (!lungeAmount.ok) return err(at(lungeAmount.error));
  const reachPixels = readField.number(entry, 'reachPixels');
  if (!reachPixels.ok) return err(at(reachPixels.error));
  if (reachPixels.value <= MIN_GOLD_VALUE) {
    return err(at('"reachPixels" must be greater than zero, or the swing hits nothing'));
  }

  return ok({
    ...base,
    type: 'Melee',
    swingArc: swingArc.value,
    lungeAmount: lungeAmount.value,
    reachPixels: reachPixels.value,
  });
}
