import type { Rng } from '../core/Rng';
import { err, ok, type Result } from '../core/Result';
import { DIRECTIONS, oppositeOf, stepFrom, type Direction } from './Direction';
import { Dungeon, type DungeonRoom } from './Dungeon';
import { coordinateKey, type GridCoordinate } from './GridCoordinate';
import { FORGE_ROOM_TAG, hasExit, type RoomTemplate } from './RoomTemplate';

export interface DungeonGeneratorDeps {
  readonly templates: readonly RoomTemplate[];
  readonly rng: Rng;
  /** How many rooms the floor should contain, including the start. */
  readonly roomCount: number;
}

interface OpenConnection {
  readonly from: GridCoordinate;
  readonly direction: Direction;
}

const MIN_ROOMS = 1;
const BRANCHING_EXITS = 2;
const ORIGIN: GridCoordinate = { x: 0, y: 0 };
const NONE = 0;

/**
 * Connector-based generation (GDD 3.2.1). Starting from one room, it repeatedly picks
 * an unused door and places a room that opens back onto it, so the floor is connected
 * by construction rather than by a repair pass.
 *
 * Every choice comes from the injected `Rng`, so a seed always rebuilds the same floor
 * (CLAUDE.md 3.5, 6).
 */
export class DungeonGenerator {
  public constructor(private readonly deps: DungeonGeneratorDeps) {}

  /** The walk draws only from ordinary rooms; special rooms are placed afterwards. */
  private get ordinaryTemplates(): readonly RoomTemplate[] {
    return this.deps.templates.filter((template) => !template.tags.includes(FORGE_ROOM_TAG));
  }

  public generate(): Result<Dungeon> {
    if (this.deps.roomCount < MIN_ROOMS) {
      return err(`a floor needs at least ${String(MIN_ROOMS)} room`);
    }
    if (this.deps.templates.length === NONE) {
      return err('no room templates were loaded');
    }

    const start = this.pickStartTemplate();
    if (!start.ok) return start;

    const placed = new Map<string, RoomTemplate>([[coordinateKey(ORIGIN), start.value]]);
    const open: OpenConnection[] = start.value.exits.map((exit) => ({
      from: ORIGIN,
      direction: exit.direction,
    }));

    while (placed.size < this.deps.roomCount && open.length > NONE) {
      const connection = this.takeRandom(open);
      const target = stepFrom(connection.from, connection.direction);
      if (placed.has(coordinateKey(target))) {
        continue;
      }

      const template = this.pickConnectingTemplate(
        oppositeOf(connection.direction),
        placed.size,
        open.length,
      );
      if (template === undefined) {
        continue;
      }

      placed.set(coordinateKey(target), template);
      open.push(...unusedDoorsOf(template, target, oppositeOf(connection.direction)));
    }

    if (placed.size < this.deps.roomCount) {
      return err(
        `ran out of doors after ${String(placed.size)} of ${String(this.deps.roomCount)} rooms; ` +
          'the templates do not branch enough',
      );
    }

    this.placeForge(placed);
    return ok(new Dungeon(this.linkRooms(placed), ORIGIN));
  }

  /** Only a room that can branch makes a sensible entrance. */
  private pickStartTemplate(): Result<RoomTemplate> {
    const branching = this.ordinaryTemplates.filter(
      (template) => template.exits.length >= BRANCHING_EXITS,
    );
    const candidates = branching.length > NONE ? branching : this.ordinaryTemplates;
    const chosen = candidates[this.deps.rng.nextInt(candidates.length)];
    if (chosen === undefined) {
      return err('no room template could be chosen as the entrance');
    }
    return ok(chosen);
  }

  private pickConnectingTemplate(
    required: Direction,
    placedCount: number,
    openCount: number,
  ): RoomTemplate | undefined {
    const matching = this.ordinaryTemplates.filter((template) => hasExit(template, required));
    if (matching.length === NONE) {
      return undefined;
    }
    // Taking a dead end while it is the only door left would strand the walk, so keep
    // branching until there is slack to spend on one.
    const mustBranch = placedCount + 1 < this.deps.roomCount && openCount <= MIN_ROOMS;
    const branching = matching.filter((template) => template.exits.length >= BRANCHING_EXITS);
    const candidates = mustBranch && branching.length > NONE ? branching : matching;
    return candidates[this.deps.rng.nextInt(candidates.length)];
  }

  private takeRandom(open: OpenConnection[]): OpenConnection {
    const index = this.deps.rng.nextInt(open.length);
    const [connection] = open.splice(index, 1);
    if (connection === undefined) {
      throw new Error('drew an open connection from an empty list');
    }
    return connection;
  }

  /**
   * Turns one room into the Forge (GDD 2.4), never the entrance. The Forge template
   * carries all four doors, so swapping it in cannot break a connection the walk made;
   * links are recomputed afterwards either way.
   */
  private placeForge(placed: Map<string, RoomTemplate>): void {
    const forge = this.deps.templates.find((template) => template.tags.includes(FORGE_ROOM_TAG));
    const entrance = coordinateKey(ORIGIN);
    const elsewhere = [...placed.keys()].filter((key) => key !== entrance);
    if (forge === undefined || elsewhere.length === NONE) {
      return;
    }
    const key = elsewhere[this.deps.rng.nextInt(elsewhere.length)];
    if (key !== undefined) {
      placed.set(key, forge);
    }
  }

  /** A door is real only when the room on the other side opens back onto it. */
  private linkRooms(placed: ReadonlyMap<string, RoomTemplate>): ReadonlyMap<string, DungeonRoom> {
    const rooms = new Map<string, DungeonRoom>();
    for (const [key, template] of placed) {
      const coordinate = parseKey(key);
      const connections = DIRECTIONS.filter((direction) => {
        if (!hasExit(template, direction)) {
          return false;
        }
        const neighbour = placed.get(coordinateKey(stepFrom(coordinate, direction)));
        return neighbour !== undefined && hasExit(neighbour, oppositeOf(direction));
      });
      rooms.set(key, { coordinate, template, connections });
    }
    return rooms;
  }
}

/** Every door except the one just walked through, which is already spoken for. */
function unusedDoorsOf(
  template: RoomTemplate,
  at: GridCoordinate,
  entrance: Direction,
): OpenConnection[] {
  return template.exits
    .filter((exit) => exit.direction !== entrance)
    .map((exit) => ({ from: at, direction: exit.direction }));
}

function parseKey(key: string): GridCoordinate {
  const [x, y] = key.split(',').map(Number);
  if (x === undefined || y === undefined || Number.isNaN(x) || Number.isNaN(y)) {
    throw new Error(`Malformed room key "${key}"`);
  }
  return { x, y };
}
