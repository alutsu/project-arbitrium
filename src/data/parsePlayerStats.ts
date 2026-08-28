import { err, ok, type Result } from '../core/Result';
import { isJsonRecord } from './JsonRecord';
import { readField } from './readField';
import type { PlayerStats } from './PlayerStats';

const MIN_PENALTY = 0;
const MAX_PENALTY = 1;
const MIN_SPEED = 0;

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

  return ok({
    moveSpeedPixelsPerSecond: moveSpeed.value,
    parleyMovementPenalty: penalty.value,
  });
}
