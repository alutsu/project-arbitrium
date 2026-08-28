import { describe, expect, it } from 'vitest';
import type { BargainDemand } from '../bargain/BargainDemand';
import { SeededRng } from '../core/SeededRng';
import type { DungeonRoom } from '../dungeon/Dungeon';
import { coordinateKey } from '../dungeon/GridCoordinate';
import { RoomAnalyzer } from '../dungeon/RoomAnalyzer';
import type { RoomTag, RoomTemplate, RoomTemplateId } from '../dungeon/RoomTemplate';
import type { EnemyData, EnemyId } from '../enemy/EnemyData';
import { EncounterDirector } from './EncounterDirector';
import type { EncounterSettings } from './EncounterSettings';

const WALL = 2;
const FLOOR = 1;

const ARENA = ['##########', '#........#', '#........#', '#........#', '#........#', '##########'];

const template = (rows: readonly string[], tags: readonly RoomTag[]): RoomTemplate => ({
  id: 'test' as RoomTemplateId,
  widthInTiles: rows[0]?.length ?? 0,
  heightInTiles: rows.length,
  tileWidth: 40,
  tileHeight: 40,
  tiles: rows.flatMap((row) => Array.from(row).map((cell) => (cell === '#' ? WALL : FLOOR))),
  exits: [{ direction: 'North', tileX: 4, tileY: 1 }],
  tags,
});

const room = (rows: readonly string[], tags: readonly RoomTag[]): DungeonRoom => ({
  coordinate: { x: 0, y: 0 },
  template: template(rows, tags),
  connections: ['North'],
});

interface EnemyShape {
  readonly id: string;
  readonly roomTags: readonly RoomTag[];
  readonly prefers: EnemyData['prefers'];
}

const DEFAULT_WEIGHT = 5;

const enemy = (shape: EnemyShape): EnemyData => ({
  id: shape.id as EnemyId,
  name: shape.id,
  tier: 'Normal',
  spriteKey: `enemy_${shape.id}`,
  weight: DEFAULT_WEIGHT,
  vitality: 18,
  goldReward: 9,
  roomTags: shape.roomTags,
  prefers: shape.prefers,
  behaviour: {
    kind: 'Melee',
    moveSpeedPixelsPerSecond: 95,
    damage: 7,
    attackRate: 1,
    reachPixels: 34,
  },
});

const GRUNT = enemy({ id: 'grunt', roomTags: ['Arena', 'Corridor'], prefers: ['Open', 'Cover'] });
const TURRET = enemy({ id: 'turret', roomTags: ['Arena'], prefers: ['Corner'] });
const CORRIDOR_ONLY = enemy({ id: 'stalker', roomTags: ['Corridor'], prefers: ['Cover'] });

const NORMAL_DEMAND: BargainDemand = {
  tier: 'Normal',
  cost: { kind: 'Gold', fractionOfGold: 0.15 },
};
const RARE_DEMAND: BargainDemand = { tier: 'Rare', cost: { kind: 'Vitality', damage: 20 } };

const SETTINGS: EncounterSettings = {
  minEnemiesPerRoom: 2,
  maxEnemiesPerRoom: 4,
  spawnClearanceTiles: 3,
};

const analyzer = new RoomAnalyzer();

interface PlanOptions {
  readonly enemies?: readonly EnemyData[];
  readonly rows?: readonly string[];
  readonly tags?: readonly RoomTag[];
  readonly demands?: readonly BargainDemand[];
  readonly settings?: EncounterSettings;
}

const planFor = (seed: number, options: PlanOptions = {}) => {
  const enemies = options.enemies ?? [GRUNT, TURRET];
  const rows = options.rows ?? ARENA;
  const tags = options.tags ?? ['Arena'];
  const demands = options.demands ?? [NORMAL_DEMAND];
  const settings = options.settings ?? SETTINGS;
  const target = room(rows, tags);
  const director = new EncounterDirector({
    enemies,
    demands,
    settings,
    rngFor: (value) => new SeededRng(value),
  });
  return director.plan({ room: target, analysis: analyzer.analyze(target.template), seed });
};

describe('EncounterDirector', () => {
  it('plans the same encounter from the same seed (CLAUDE.md 6)', () => {
    const shape = (seed: number): string[] =>
      planFor(seed).map((spawn) => `${spawn.enemy.id}@${coordinateKey(spawn.tile)}`);
    expect(shape(4242)).toEqual(shape(4242));
  });

  it('plans a different encounter from a different seed', () => {
    const shape = (seed: number): string[] =>
      planFor(seed).map((spawn) => `${spawn.enemy.id}@${coordinateKey(spawn.tile)}`);
    expect(shape(1)).not.toEqual(shape(77));
  });

  it('stays within the configured population', () => {
    for (const seed of [1, 2, 3, 11, 99, 1234]) {
      const plan = planFor(seed);
      expect(plan.length).toBeGreaterThanOrEqual(SETTINGS.minEnemiesPerRoom);
      expect(plan.length).toBeLessThanOrEqual(SETTINGS.maxEnemiesPerRoom);
    }
  });

  it('only draws enemies that suit the room shape (GDD 3.2.3)', () => {
    const plan = planFor(9, { enemies: [GRUNT, CORRIDOR_ONLY] });
    expect(plan.every((spawn) => spawn.enemy.id === 'grunt')).toBe(true);
  });

  it('plans nothing when no enemy suits the room', () => {
    expect(planFor(9, { enemies: [CORRIDOR_ONLY] })).toEqual([]);
  });

  it('stands a Turret in a corner, which is what it prefers (GDD 3.2.2)', () => {
    const analysis = analyzer.analyze(template(ARENA, ['Arena']));
    const corners = new Set(analysis.tilesOf('Corner').map(coordinateKey));
    for (const seed of [1, 5, 20, 88, 300]) {
      const turrets = planFor(seed, { enemies: [TURRET] }).filter(
        (spawn) => spawn.enemy.id === 'turret',
      );
      for (const turret of turrets) {
        expect(corners.has(coordinateKey(turret.tile))).toBe(true);
      }
    }
  });

  it('never stacks two enemies on one tile', () => {
    for (const seed of [1, 7, 42, 500]) {
      const tiles = planFor(seed).map((spawn) => coordinateKey(spawn.tile));
      expect(new Set(tiles).size).toBe(tiles.length);
    }
  });

  it('keeps its distance from every door the player could arrive through', () => {
    for (const seed of [1, 7, 42, 500]) {
      for (const spawn of planFor(seed)) {
        // The test room's only connection is its North exit at (4, 1).
        const distance = Math.abs(spawn.tile.x - 4) + Math.abs(spawn.tile.y - 1);
        expect(distance).toBeGreaterThanOrEqual(SETTINGS.spawnClearanceTiles);
      }
    }
  });

  it('plans the same encounter however the player walked in', () => {
    const target = room(ARENA, ['Arena']);
    const director = new EncounterDirector({
      enemies: [GRUNT, TURRET],
      demands: [NORMAL_DEMAND],
      settings: SETTINGS,
      rngFor: (value) => new SeededRng(value),
    });
    const request = { room: target, analysis: analyzer.analyze(target.template), seed: 8080 };
    const shape = (): string[] =>
      director.plan(request).map((spawn) => `${spawn.enemy.id}@${coordinateKey(spawn.tile)}`);
    expect(shape()).toEqual(shape());
  });

  it('gives each enemy a demand matching its tier', () => {
    const plan = planFor(3, { enemies: [GRUNT], demands: [NORMAL_DEMAND, RARE_DEMAND] });
    expect(plan.every((spawn) => spawn.demand.tier === 'Normal')).toBe(true);
  });

  it('falls back to any demand when none matches the tier', () => {
    const plan = planFor(3, { enemies: [GRUNT], demands: [RARE_DEMAND] });
    expect(plan.length).toBeGreaterThan(0);
    expect(plan.every((spawn) => spawn.demand.tier === 'Rare')).toBe(true);
  });

  it('plans nothing when there are no demands to make', () => {
    expect(planFor(3, { enemies: [GRUNT], demands: [] })).toEqual([]);
  });

  it('places fewer enemies than asked rather than crowding a tiny room', () => {
    const closet = ['#####', '#...#', '#####'];
    const plan = planFor(5, {
      enemies: [GRUNT],
      rows: closet,
      settings: { minEnemiesPerRoom: 8, maxEnemiesPerRoom: 8, spawnClearanceTiles: 1 },
    });
    expect(plan.length).toBeLessThan(8);
  });
});
