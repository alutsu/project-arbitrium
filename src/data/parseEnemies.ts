import { ENEMY_TIERS } from '../bargain/BargainDemand';
import { err, ok, type Result } from '../core/Result';
import { ROOM_TAGS } from '../dungeon/RoomTemplate';
import { TILE_KINDS } from '../dungeon/TileKind';
import type { EnemyData, EnemyId } from '../enemy/EnemyData';
import { ENEMY_BEHAVIOUR_KINDS, type EnemyBehaviourData } from '../enemy/EnemyBehaviourData';
import { isJsonRecord, type JsonRecord } from './JsonRecord';
import { readField } from './readField';

const MIN_WEIGHT = 0;
const EMPTY = 0;

/** Validates the contents of `enemies.json` (GDD 3.2.3, 5.1). */
export function parseEnemies(raw: unknown): Result<readonly EnemyData[]> {
  if (!Array.isArray(raw)) {
    return err('enemies.json must contain an array of enemies');
  }
  if (raw.length === EMPTY) {
    return err('enemies.json must list at least one enemy');
  }

  const enemies: EnemyData[] = [];
  for (const [index, entry] of raw.entries()) {
    const parsed = parseEnemy(entry, index);
    if (!parsed.ok) return parsed;
    enemies.push(parsed.value);
  }
  return ok(enemies);
}

function parseEnemy(entry: unknown, index: number): Result<EnemyData> {
  if (!isJsonRecord(entry)) {
    return err(`enemies[${String(index)}] must be an object`);
  }
  const at = (message: string): string => `enemies[${String(index)}]: ${message}`;

  const id = readField.string(entry, 'id');
  if (!id.ok) return err(at(id.error));
  const name = readField.string(entry, 'name');
  if (!name.ok) return err(at(name.error));
  const spriteKey = readField.string(entry, 'spriteKey');
  if (!spriteKey.ok) return err(at(spriteKey.error));
  const tier = readField.oneOf(entry, 'tier', ENEMY_TIERS);
  if (!tier.ok) return err(at(tier.error));
  const weight = readField.number(entry, 'weight');
  if (!weight.ok) return err(at(weight.error));
  if (weight.value <= MIN_WEIGHT) {
    return err(at('"weight" must be greater than zero, or the enemy can never spawn'));
  }
  const vitality = readField.number(entry, 'vitality');
  if (!vitality.ok) return err(at(vitality.error));
  if (vitality.value <= MIN_WEIGHT) {
    return err(at('"vitality" must be greater than zero, or the enemy dies on spawn'));
  }
  const goldReward = readField.number(entry, 'goldReward');
  if (!goldReward.ok) return err(at(goldReward.error));
  if (goldReward.value < MIN_WEIGHT) {
    return err(at('"goldReward" must not be negative'));
  }

  const roomTags = readField.arrayOf(entry, 'roomTags', ROOM_TAGS);
  if (!roomTags.ok) return err(at(roomTags.error));
  if (roomTags.value.length === EMPTY) {
    return err(at('"roomTags" must list at least one room shape this enemy belongs in'));
  }
  const prefers = readField.arrayOf(entry, 'prefers', TILE_KINDS);
  if (!prefers.ok) return err(at(prefers.error));
  if (prefers.value.length === EMPTY) {
    return err(at('"prefers" must list at least one tile kind this enemy stands on'));
  }

  const behaviourRaw = entry['behaviour'];
  if (!isJsonRecord(behaviourRaw)) {
    return err(at('"behaviour" must be an object'));
  }
  const behaviour = parseBehaviour(behaviourRaw, at);
  if (!behaviour.ok) return behaviour;

  return ok({
    // Safe to brand: the value was just proven to be a non-empty string.
    id: id.value as EnemyId,
    name: name.value,
    tier: tier.value,
    spriteKey: spriteKey.value,
    weight: weight.value,
    vitality: vitality.value,
    goldReward: goldReward.value,
    roomTags: roomTags.value,
    prefers: prefers.value,
    behaviour: behaviour.value,
  });
}

type Contextualize = (message: string) => string;

function parseBehaviour(raw: JsonRecord, at: Contextualize): Result<EnemyBehaviourData> {
  const kind = readField.oneOf(raw, 'kind', ENEMY_BEHAVIOUR_KINDS);
  if (!kind.ok) return err(at(kind.error));

  const damage = readField.number(raw, 'damage');
  if (!damage.ok) return err(at(damage.error));
  const attackRate = readField.number(raw, 'attackRate');
  if (!attackRate.ok) return err(at(attackRate.error));
  if (damage.value <= MIN_WEIGHT || attackRate.value <= MIN_WEIGHT) {
    return err(at('"damage" and "attackRate" must both be greater than zero'));
  }

  if (kind.value === 'Melee') {
    const moveSpeed = readField.number(raw, 'moveSpeedPixelsPerSecond');
    if (!moveSpeed.ok) return err(at(moveSpeed.error));
    const reachPixels = readField.number(raw, 'reachPixels');
    if (!reachPixels.ok) return err(at(reachPixels.error));
    if (moveSpeed.value <= MIN_WEIGHT || reachPixels.value <= MIN_WEIGHT) {
      return err(at('a Melee enemy needs a move speed and a reach above zero'));
    }
    return ok({
      kind: 'Melee',
      moveSpeedPixelsPerSecond: moveSpeed.value,
      damage: damage.value,
      attackRate: attackRate.value,
      reachPixels: reachPixels.value,
    });
  }

  const projectileSpeed = readField.number(raw, 'projectileSpeed');
  if (!projectileSpeed.ok) return err(at(projectileSpeed.error));
  const rangePixels = readField.number(raw, 'rangePixels');
  if (!rangePixels.ok) return err(at(rangePixels.error));
  if (projectileSpeed.value <= MIN_WEIGHT || rangePixels.value <= MIN_WEIGHT) {
    return err(at('a StationaryRanged enemy needs a projectile speed and a range above zero'));
  }
  return ok({
    kind: 'StationaryRanged',
    damage: damage.value,
    attackRate: attackRate.value,
    projectileSpeed: projectileSpeed.value,
    rangePixels: rangePixels.value,
  });
}
