import { err, ok, type Result } from '../core/Result';
import { isJsonRecord } from './JsonRecord';
import { readField } from './readField';
import type { PlayerStats } from './PlayerStats';

const MIN_PENALTY = 0;
const MAX_PENALTY = 1;
const MIN_SPEED = 0;
const MIN_GOLD = 0;
const MIN_SURVIVABLE_VITALITY = 1;

/** Validates the contents of `player.json` (GDD 3.3.1). */
export function parsePlayerStats(raw: unknown): Result<PlayerStats> {
  if (!isJsonRecord(raw)) {
    return err('player.json must contain an object');
  }

  const moveSpeed = readField.number(raw, 'moveSpeedPixelsPerSecond');
  if (!moveSpeed.ok) return err(`player.json: ${moveSpeed.error}`);
  if (moveSpeed.value <= MIN_SPEED) {
    return err('player.json: "moveSpeedPixelsPerSecond" must be greater than zero');
  }

  const penalty = readField.number(raw, 'parleyMovementPenalty');
  if (!penalty.ok) return err(`player.json: ${penalty.error}`);
  if (penalty.value < MIN_PENALTY || penalty.value >= MAX_PENALTY) {
    return err('player.json: "parleyMovementPenalty" must be at least 0 and below 1');
  }

  const startingGold = readField.number(raw, 'startingGold');
  if (!startingGold.ok) return err(`player.json: ${startingGold.error}`);
  if (startingGold.value < MIN_GOLD) {
    return err('player.json: "startingGold" must not be negative');
  }

  const maxVitality = readField.number(raw, 'maxVitality');
  if (!maxVitality.ok) return err(`player.json: ${maxVitality.error}`);
  if (maxVitality.value < MIN_SURVIVABLE_VITALITY) {
    return err('player.json: "maxVitality" must be at least 1');
  }

  return ok({
    moveSpeedPixelsPerSecond: moveSpeed.value,
    parleyMovementPenalty: penalty.value,
    startingGold: startingGold.value,
    maxVitality: maxVitality.value,
  });
}
