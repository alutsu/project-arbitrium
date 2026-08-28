interface DataKeys {
  readonly weapons: string;
  readonly upgrades: string;
  readonly playerStats: string;
  readonly bargain: string;
  readonly dungeon: string;
  readonly enemies: string;
  readonly encounter: string;
}

/** Cache keys shared by the scene that loads the JSON and the code that parses it. */
export const DATA_KEYS: DataKeys = {
  weapons: 'weapons',
  upgrades: 'upgrades',
  playerStats: 'playerStats',
  bargain: 'bargain',
  dungeon: 'dungeon',
  enemies: 'enemies',
  encounter: 'encounter',
};

/**
 * Room templates ship as one Tiled file each, so a designer can open them. Adding a
 * room means adding its filename here and dropping the file in `public/data/rooms`.
 */
export const ROOM_TEMPLATE_IDS: readonly string[] = [
  'arena',
  'pillars',
  'corridor-ns',
  'corridor-ew',
  'chamber-north',
  'chamber-south',
  'chamber-east',
  'chamber-west',
];

export function roomCacheKey(id: string): string {
  return `room:${id}`;
}
