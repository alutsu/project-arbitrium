/**
 * How a walkable tile sits in the room's geometry (GDD 3.2.2). The Encounter Director
 * spawns against these, which is what makes randomness tactical rather than sprinkled.
 */
export type TileKind = 'Cover' | 'Open' | 'Corner';

export const TILE_KINDS: readonly TileKind[] = ['Cover', 'Open', 'Corner'];
