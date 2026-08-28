import type { DungeonRoom } from './Dungeon';
import type { RoomTemplate } from './RoomTemplate';
import { sealUnusedDoors } from './sealUnusedDoors';

/**
 * The room as it actually exists on this floor: the template with every doorway that
 * leads nowhere walled up.
 *
 * Everything that reasons about the room's geometry must use this rather than the raw
 * template. Rendering used to seal on its own, which let the analyzer treat a sealed
 * doorway as floor and spawn an enemy inside a wall.
 */
export function sealedRoomOf(room: DungeonRoom): RoomTemplate {
  return { ...room.template, tiles: sealUnusedDoors(room.template, room.connections) };
}
