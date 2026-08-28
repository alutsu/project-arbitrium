export interface EncounterSettings {
  readonly minEnemiesPerRoom: number;
  readonly maxEnemiesPerRoom: number;
  /** Tiles of breathing room between the player's arrival point and any spawn. */
  readonly spawnClearanceTiles: number;
}
