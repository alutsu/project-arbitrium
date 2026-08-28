import { coordinateKey, type GridCoordinate } from './GridCoordinate';
import { stepFrom, type Direction } from './Direction';
import type { RoomTemplate } from './RoomTemplate';

export interface DungeonRoom {
  readonly coordinate: GridCoordinate;
  readonly template: RoomTemplate;
  /** Exits that actually lead somewhere; the rest are sealed walls. */
  readonly connections: readonly Direction[];
}

/** A generated floor: rooms on a grid, and which of their doors are real (GDD 3.2.1). */
export class Dungeon {
  public constructor(
    private readonly roomsByKey: ReadonlyMap<string, DungeonRoom>,
    public readonly start: GridCoordinate,
  ) {}

  public get rooms(): readonly DungeonRoom[] {
    return [...this.roomsByKey.values()];
  }

  public roomAt(coordinate: GridCoordinate): DungeonRoom | undefined {
    return this.roomsByKey.get(coordinateKey(coordinate));
  }

  public neighbourOf(coordinate: GridCoordinate, direction: Direction): DungeonRoom | undefined {
    const room = this.roomAt(coordinate);
    if (room === undefined || !room.connections.includes(direction)) {
      return undefined;
    }
    return this.roomAt(stepFrom(coordinate, direction));
  }
}
