import type { BargainDemand } from '../bargain/BargainDemand';
import type { Rng } from '../core/Rng';
import type { DungeonRoom } from '../dungeon/Dungeon';
import { coordinateKey, type GridCoordinate } from '../dungeon/GridCoordinate';
import type { RoomAnalysis } from '../dungeon/RoomAnalyzer';
import { exitTowards } from '../dungeon/RoomTemplate';
import type { EnemyData } from '../enemy/EnemyData';
import type { EncounterSettings } from './EncounterSettings';

const NONE = 0;
const INCLUSIVE = 1;

/** One enemy the Director has decided to place, and what it will demand. */
export interface EnemySpawn {
  readonly enemy: EnemyData;
  readonly tile: GridCoordinate;
  readonly demand: BargainDemand;
}

export interface EncounterDirectorDeps {
  readonly enemies: readonly EnemyData[];
  readonly demands: readonly BargainDemand[];
  readonly settings: EncounterSettings;
  /**
   * Builds the stream for one room. A factory rather than a shared `Rng` so each room
   * draws from its own sequence, which is what lets a room be re-entered unchanged.
   */
  readonly rngFor: (seed: number) => Rng;
}

export interface EncounterRequest {
  readonly room: DungeonRoom;
  readonly analysis: RoomAnalysis;
  /** This room's seed, from `roomSeed`. */
  readonly seed: number;
}

/**
 * Decides what a room contains (GDD 3.2.2, 3.2.3).
 *
 * Randomness here is meant to be *smart*, per the Context-Driven Proceduralism pillar:
 * an enemy is only drawn for a room shape it suits, and is then placed on a tile kind
 * it wants — a Turret in a corner, a Grunt in the open. Phaser-free and seeded, so a
 * floor's encounters are reproducible (CLAUDE.md 3.5, 6).
 */
export class EncounterDirector {
  public constructor(private readonly deps: EncounterDirectorDeps) {}

  public plan(request: EncounterRequest): readonly EnemySpawn[] {
    const rng = this.deps.rngFor(request.seed);
    const suitable = this.deps.enemies.filter((enemy) =>
      enemy.roomTags.some((tag) => request.room.template.tags.includes(tag)),
    );
    if (suitable.length === NONE || this.deps.demands.length === NONE) {
      return [];
    }

    const spawns: EnemySpawn[] = [];
    const taken = new Set<string>();
    const placedOf = new Map<string, number>();
    const wanted = this.rollCount(rng);

    for (let placed = 0; placed < wanted; placed++) {
      const room = suitable.filter((candidate) => !atLimit(candidate, placedOf));
      const enemy = this.drawByWeight(room, rng);
      if (enemy === undefined) {
        break;
      }
      const tile = this.placeFor(enemy, request, { taken, rng });
      if (tile === undefined) {
        break;
      }
      const demand = this.demandFor(enemy, rng);
      if (demand === undefined) {
        break;
      }
      taken.add(coordinateKey(tile));
      placedOf.set(enemy.id, (placedOf.get(enemy.id) ?? NONE) + INCLUSIVE);
      spawns.push({ enemy, tile, demand });
    }
    return spawns;
  }

  private rollCount(rng: Rng): number {
    const { minEnemiesPerRoom, maxEnemiesPerRoom } = this.deps.settings;
    const span = maxEnemiesPerRoom - minEnemiesPerRoom + INCLUSIVE;
    return minEnemiesPerRoom + rng.nextInt(span);
  }

  private drawByWeight(candidates: readonly EnemyData[], rng: Rng): EnemyData | undefined {
    const total = candidates.reduce((sum, enemy) => sum + enemy.weight, NONE);
    let ticket = rng.nextInt(Math.ceil(total));
    for (const enemy of candidates) {
      ticket -= enemy.weight;
      if (ticket < NONE) {
        return enemy;
      }
    }
    return candidates[candidates.length - INCLUSIVE];
  }

  /** A tile of the kind this enemy wants, else any free tile far enough from the player. */
  private placeFor(
    enemy: EnemyData,
    request: EncounterRequest,
    draw: { readonly taken: ReadonlySet<string>; readonly rng: Rng },
  ): GridCoordinate | undefined {
    const preferred = enemy.prefers.flatMap((kind) => request.analysis.tilesOf(kind));
    const isFree = (tile: GridCoordinate): boolean =>
      !draw.taken.has(coordinateKey(tile)) && this.isClearOfDoors(tile, request.room);

    const candidates = preferred.filter(isFree);
    const fallback = request.analysis.walkable.filter(isFree);
    const pool = candidates.length > NONE ? candidates : fallback;
    if (pool.length === NONE) {
      return undefined;
    }
    return pool[draw.rng.nextInt(pool.length)];
  }

  /**
   * Clearance is measured from the room's own doorways rather than from wherever the
   * player happens to be. The player can enter through any connected door, and keying
   * off their transient position would make the same room roll a different encounter
   * depending on which way they walked in.
   */
  private isClearOfDoors(tile: GridCoordinate, room: DungeonRoom): boolean {
    const clearance = this.deps.settings.spawnClearanceTiles;
    return room.connections.every((direction) => {
      const exit = exitTowards(room.template, direction);
      if (exit === undefined) {
        return true;
      }
      return Math.abs(tile.x - exit.tileX) + Math.abs(tile.y - exit.tileY) >= clearance;
    });
  }

  private demandFor(enemy: EnemyData, rng: Rng): BargainDemand | undefined {
    const matching = this.deps.demands.filter((demand) => demand.tier === enemy.tier);
    const pool = matching.length > NONE ? matching : this.deps.demands;
    return pool[rng.nextInt(pool.length)];
  }
}

/** Whether this enemy has already filled its allowance for one room. */
function atLimit(enemy: EnemyData, placed: ReadonlyMap<string, number>): boolean {
  return enemy.maxPerRoom !== undefined && (placed.get(enemy.id) ?? NONE) >= enemy.maxPerRoom;
}
