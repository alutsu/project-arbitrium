export interface DungeonSettings {
  /** How many rooms a floor contains, including the entrance (GDD 3.2.1). */
  readonly roomsPerFloor: number;
  /**
   * Seed for the floor layout. Fixed in data for now, so a floor is reproducible while
   * it is being built; choosing one per run belongs with the run lifecycle.
   */
  readonly seed: number;
}
