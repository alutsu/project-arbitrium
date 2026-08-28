import { coordinateKey, type GridCoordinate } from './GridCoordinate';
import type { NavigationGrid } from './NavigationGrid';

const STEP_COST = 1;
const NO_COST = 0;
const NEIGHBOUR_OFFSETS: readonly GridCoordinate[] = [
  { x: 0, y: -STEP_COST },
  { x: 0, y: STEP_COST },
  { x: -STEP_COST, y: 0 },
  { x: STEP_COST, y: 0 },
];

interface Candidate {
  readonly tile: GridCoordinate;
  readonly estimatedTotal: number;
}

/**
 * A* over the navigation grid (GDD 6.1, step 2), four-directional so a path never cuts
 * a wall corner diagonally.
 *
 * Written here rather than pulled in as a plugin: the GDD names EasyStar.js only as an
 * example, and a grid A* is small enough that owning it keeps navigation Phaser-free,
 * dependency-free and unit-testable.
 *
 * Returns the tiles from `start` to `goal` inclusive, or null when no route exists.
 */
export function findPath(
  grid: NavigationGrid,
  start: GridCoordinate,
  goal: GridCoordinate,
): readonly GridCoordinate[] | null {
  if (!grid.isWalkable(start) || !grid.isWalkable(goal)) {
    return null;
  }
  if (coordinateKey(start) === coordinateKey(goal)) {
    return [start];
  }

  const cameFrom = new Map<string, GridCoordinate>();
  const costSoFar = new Map<string, number>([[coordinateKey(start), NO_COST]]);
  const frontier: Candidate[] = [{ tile: start, estimatedTotal: manhattan(start, goal) }];

  while (frontier.length > NO_COST) {
    const current = takeCheapest(frontier);
    if (coordinateKey(current.tile) === coordinateKey(goal)) {
      return reconstruct(cameFrom, start, goal);
    }
    expand(current.tile, { grid, goal, cameFrom, costSoFar, frontier });
  }
  return null;
}

interface Search {
  readonly grid: NavigationGrid;
  readonly goal: GridCoordinate;
  readonly cameFrom: Map<string, GridCoordinate>;
  readonly costSoFar: Map<string, number>;
  readonly frontier: Candidate[];
}

function expand(tile: GridCoordinate, search: Search): void {
  const currentCost = search.costSoFar.get(coordinateKey(tile)) ?? NO_COST;

  for (const offset of NEIGHBOUR_OFFSETS) {
    const next = { x: tile.x + offset.x, y: tile.y + offset.y };
    if (!search.grid.isWalkable(next)) {
      continue;
    }
    const nextCost = currentCost + STEP_COST;
    const key = coordinateKey(next);
    const known = search.costSoFar.get(key);
    if (known !== undefined && known <= nextCost) {
      continue;
    }
    search.costSoFar.set(key, nextCost);
    search.cameFrom.set(key, tile);
    search.frontier.push({ tile: next, estimatedTotal: nextCost + manhattan(next, search.goal) });
  }
}

/** Linear scan: rooms are small enough that a heap would be more code than it saves. */
function takeCheapest(frontier: Candidate[]): Candidate {
  let bestIndex = NO_COST;
  for (let index = STEP_COST; index < frontier.length; index++) {
    const candidate = frontier[index];
    const best = frontier[bestIndex];
    if (
      candidate !== undefined &&
      best !== undefined &&
      candidate.estimatedTotal < best.estimatedTotal
    ) {
      bestIndex = index;
    }
  }
  const [cheapest] = frontier.splice(bestIndex, STEP_COST);
  if (cheapest === undefined) {
    throw new Error('took a candidate from an empty frontier');
  }
  return cheapest;
}

function reconstruct(
  cameFrom: ReadonlyMap<string, GridCoordinate>,
  start: GridCoordinate,
  goal: GridCoordinate,
): readonly GridCoordinate[] {
  const path: GridCoordinate[] = [goal];
  let current = goal;
  while (coordinateKey(current) !== coordinateKey(start)) {
    const previous = cameFrom.get(coordinateKey(current));
    if (previous === undefined) {
      throw new Error('path reconstruction hit a tile with no predecessor');
    }
    path.push(previous);
    current = previous;
  }
  return path.reverse();
}

function manhattan(from: GridCoordinate, to: GridCoordinate): number {
  return Math.abs(from.x - to.x) + Math.abs(from.y - to.y);
}
