import { err, ok, type Result } from '../core/Result';
import type { DungeonSettings } from '../dungeon/DungeonSettings';
import { isJsonRecord } from './JsonRecord';
import { readField } from './readField';

const MIN_ROOMS = 1;

/** Validates the contents of `dungeon.json` (GDD 3.2.1). */
export function parseDungeonSettings(raw: unknown): Result<DungeonSettings> {
  if (!isJsonRecord(raw)) {
    return err('dungeon.json must contain an object');
  }

  const roomsPerFloor = readField.number(raw, 'roomsPerFloor');
  if (!roomsPerFloor.ok) return err(`dungeon.json: ${roomsPerFloor.error}`);
  if (!Number.isInteger(roomsPerFloor.value) || roomsPerFloor.value < MIN_ROOMS) {
    return err(
      `dungeon.json: "roomsPerFloor" must be a whole number of at least ${String(MIN_ROOMS)}`,
    );
  }

  const seed = readField.number(raw, 'seed');
  if (!seed.ok) return err(`dungeon.json: ${seed.error}`);
  if (!Number.isInteger(seed.value)) {
    return err('dungeon.json: "seed" must be a whole number');
  }

  const floorNumber = readField.number(raw, 'floorNumber');
  if (!floorNumber.ok) return err(`dungeon.json: ${floorNumber.error}`);
  if (!Number.isInteger(floorNumber.value) || floorNumber.value < MIN_ROOMS) {
    return err('dungeon.json: "floorNumber" must be a whole number of at least 1');
  }

  return ok({
    roomsPerFloor: roomsPerFloor.value,
    seed: seed.value,
    floorNumber: floorNumber.value,
  });
}
