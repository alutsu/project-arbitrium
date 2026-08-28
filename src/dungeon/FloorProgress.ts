import { coordinateKey, type GridCoordinate } from './GridCoordinate';

/**
 * What the player has already done on this floor.
 *
 * Rooms seal on entry and unlock when cleared (GDD 2.1), and a weapon is offered once.
 * Without this record, walking back into a cleared room would re-seal it, respawn its
 * encounter and offer its weapon again.
 */
export class FloorProgress {
  private readonly cleared = new Set<string>();
  private readonly liquidated = new Set<string>();

  public isCleared(coordinate: GridCoordinate): boolean {
    return this.cleared.has(coordinateKey(coordinate));
  }

  public markCleared(coordinate: GridCoordinate): void {
    this.cleared.add(coordinateKey(coordinate));
  }

  /** Whether this room's weapon offer has already been taken or sold. */
  public isLiquidated(coordinate: GridCoordinate): boolean {
    return this.liquidated.has(coordinateKey(coordinate));
  }

  public markLiquidated(coordinate: GridCoordinate): void {
    this.liquidated.add(coordinateKey(coordinate));
  }

  public get clearedCount(): number {
    return this.cleared.size;
  }
}
