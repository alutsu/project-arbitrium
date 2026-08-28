import { err, ok, type Result } from '../core/Result';
import type { EncounterSettings } from '../encounter/EncounterSettings';
import { isJsonRecord } from './JsonRecord';
import { readField } from './readField';

const MIN_COUNT = 0;

/** Validates the contents of `encounter.json` (GDD 3.2.3). */
export function parseEncounterSettings(raw: unknown): Result<EncounterSettings> {
  if (!isJsonRecord(raw)) {
    return err('encounter.json must contain an object');
  }

  const min = readField.number(raw, 'minEnemiesPerRoom');
  if (!min.ok) return err(`encounter.json: ${min.error}`);
  const max = readField.number(raw, 'maxEnemiesPerRoom');
  if (!max.ok) return err(`encounter.json: ${max.error}`);
  const clearance = readField.number(raw, 'spawnClearanceTiles');
  if (!clearance.ok) return err(`encounter.json: ${clearance.error}`);

  if (!Number.isInteger(min.value) || min.value < MIN_COUNT) {
    return err('encounter.json: "minEnemiesPerRoom" must be a whole number of at least 0');
  }
  if (!Number.isInteger(max.value) || max.value < min.value) {
    return err('encounter.json: "maxEnemiesPerRoom" must be a whole number at least the minimum');
  }
  if (!Number.isInteger(clearance.value) || clearance.value < MIN_COUNT) {
    return err('encounter.json: "spawnClearanceTiles" must be a whole number of at least 0');
  }

  return ok({
    minEnemiesPerRoom: min.value,
    maxEnemiesPerRoom: max.value,
    spawnClearanceTiles: clearance.value,
  });
}
