import { describe, expect, it } from 'vitest';
import { NavigationGrid } from '../dungeon/NavigationGrid';
import type { RoomTemplate, RoomTemplateId } from '../dungeon/RoomTemplate';
import { TERRAIN_GID } from '../dungeon/TerrainGid';
import type { EnemyBehaviourData } from './EnemyBehaviourData';
import { EnemyBrain, type EnemyContext } from './EnemyBrain';

const TILE = 40;
const AGGRO_DELAY_MS = 1500;

const gridFrom = (rows: readonly string[]): NavigationGrid => {
  const template: RoomTemplate = {
    id: 'test' as RoomTemplateId,
    widthInTiles: rows[0]?.length ?? 0,
    heightInTiles: rows.length,
    tileWidth: TILE,
    tileHeight: TILE,
    tiles: rows.flatMap((row) =>
      Array.from(row).map((cell) => (cell === '#' ? TERRAIN_GID.wall : TERRAIN_GID.floor)),
    ),
    exits: [{ direction: 'North', tileX: 1, tileY: 1 }],
    tags: ['Arena'],
  };
  return NavigationGrid.fromTemplate(template);
};

const OPEN = gridFrom(['########', '#......#', '#......#', '#......#', '########']);

const MELEE: EnemyBehaviourData = {
  kind: 'Melee',
  moveSpeedPixelsPerSecond: 90,
  damage: 7,
  attackRate: 1,
  reachPixels: 34,
};

const TURRET: EnemyBehaviourData = {
  kind: 'StationaryRanged',
  damage: 5,
  attackRate: 1,
  projectileSpeed: 320,
  rangePixels: 300,
  blastRadiusPixels: 24,
};

const context = (over: Partial<EnemyContext> = {}): EnemyContext => ({
  selfPosition: { x: 60, y: 60 },
  playerPosition: { x: 240, y: 60 },
  isNegotiating: false,
  roomElapsedMs: 5000,
  deltaMs: 16,
  grid: OPEN,
  tilePixels: TILE,
  ...over,
});

const STALKER: EnemyBehaviourData = {
  kind: 'Blink',
  damage: 11,
  attackRate: 0.8,
  reachPixels: 36,
  blinkRate: 0.5,
  blinkStepTiles: 3,
};

describe('EnemyBrain', () => {
  it('holds during the Notice window, so the Parley Window is a real grace period', () => {
    const brain = new EnemyBrain(MELEE, AGGRO_DELAY_MS);
    expect(brain.decide(context({ roomElapsedMs: 500 })).kind).toBe('hold');
    expect(brain.decide(context({ roomElapsedMs: AGGRO_DELAY_MS })).kind).toBe('hold');
  });

  it('acts once the Notice window has passed', () => {
    const brain = new EnemyBrain(MELEE, AGGRO_DELAY_MS);
    expect(brain.decide(context({ roomElapsedMs: AGGRO_DELAY_MS + 1 })).kind).not.toBe('hold');
  });

  it('holds while being negotiated with, whatever the clock says (GDD 5.2)', () => {
    const brain = new EnemyBrain(MELEE, AGGRO_DELAY_MS);
    expect(brain.decide(context({ isNegotiating: true })).kind).toBe('hold');
  });

  it('closes the distance when out of reach', () => {
    const brain = new EnemyBrain(MELEE, AGGRO_DELAY_MS);
    const action = brain.decide(context());
    if (action.kind !== 'advance') throw new Error('expected an advance');
    // The player is due east, so the enemy should head east at its speed.
    expect(action.velocity.x).toBeGreaterThan(0);
    expect(Math.hypot(action.velocity.x, action.velocity.y)).toBeCloseTo(90);
  });

  it('strikes once in reach, and no faster than its attack rate', () => {
    const brain = new EnemyBrain(MELEE, AGGRO_DELAY_MS);
    const near = context({ playerPosition: { x: 80, y: 60 } });
    expect(brain.decide(near)).toEqual({ kind: 'strike', damage: 7 });
    expect(brain.decide(near).kind).toBe('hold');
  });

  it('strikes at its attack rate over time, not once and never again', () => {
    const brain = new EnemyBrain(MELEE, AGGRO_DELAY_MS);
    let strikes = 0;
    // Two seconds of 16ms frames pressed against the player, at 1 strike per second.
    for (let elapsed = 0; elapsed < 2000; elapsed += 16) {
      const action = brain.decide(context({ playerPosition: { x: 80, y: 60 }, deltaMs: 16 }));
      if (action.kind === 'strike') strikes += 1;
    }
    expect(strikes).toBe(2);
  });

  it('paths around a wall rather than walking into it', () => {
    const divided = gridFrom(['########', '#..#...#', '#..#...#', '#......#', '########']);
    const brain = new EnemyBrain(MELEE, AGGRO_DELAY_MS);
    const action = brain.decide(
      context({
        grid: divided,
        // Standing directly against the divider: the only way on is around it.
        selfPosition: { x: 100, y: 60 },
        playerPosition: { x: 220, y: 60 },
      }),
    );
    if (action.kind !== 'advance') throw new Error('expected an advance');
    // The direct line is blocked, so the first step must be downward, not east.
    expect(action.velocity.y).toBeGreaterThan(0);
  });

  it('blinks toward the player rather than walking (GDD 5.1)', () => {
    const brain = new EnemyBrain(STALKER, AGGRO_DELAY_MS);
    const action = brain.decide(context());
    if (action.kind !== 'teleport') throw new Error('expected a teleport');
    // Three tiles east of tile (1,1), centred: still short of the player at x 240.
    expect(action.to.x).toBeGreaterThan(60);
    expect(action.to.x).toBeLessThanOrEqual(240);
  });

  it('waits between blinks rather than teleporting every frame', () => {
    const brain = new EnemyBrain(STALKER, AGGRO_DELAY_MS);
    expect(brain.decide(context()).kind).toBe('teleport');
    expect(brain.decide(context()).kind).toBe('hold');
  });

  it('strikes instead of blinking once it is already in reach', () => {
    const brain = new EnemyBrain(STALKER, AGGRO_DELAY_MS);
    const action = brain.decide(context({ playerPosition: { x: 85, y: 60 } }));
    expect(action).toEqual({ kind: 'strike', damage: 11 });
  });

  it('never moves when it is a stationary enemy', () => {
    const brain = new EnemyBrain(TURRET, AGGRO_DELAY_MS);
    const action = brain.decide(context({ playerPosition: { x: 900, y: 60 } }));
    expect(action.kind).toBe('hold');
  });

  it('shoots at the player when in range, aiming at them', () => {
    const brain = new EnemyBrain(TURRET, AGGRO_DELAY_MS);
    const action = brain.decide(context());
    if (action.kind !== 'shoot') throw new Error('expected a shot');
    expect(action.angle).toBeCloseTo(0);
    expect(action.damage).toBe(5);
  });

  it('holds fire beyond its range', () => {
    const brain = new EnemyBrain(TURRET, AGGRO_DELAY_MS);
    expect(brain.decide(context({ playerPosition: { x: 900, y: 60 } })).kind).toBe('hold');
  });

  it('carries its blast radius on the shot, which is how the potion covers ground', () => {
    const brain = new EnemyBrain(TURRET, AGGRO_DELAY_MS);
    const action = brain.decide(context());
    if (action.kind !== 'shoot') throw new Error('expected a shot');
    expect(action.hitRadiusPixels).toBe(24);
  });

  it('respects its rate of fire', () => {
    const brain = new EnemyBrain(TURRET, AGGRO_DELAY_MS);
    let shots = 0;
    for (let elapsed = 0; elapsed < 1000; elapsed += 16) {
      if (brain.decide(context({ deltaMs: 16 })).kind === 'shoot') shots += 1;
    }
    expect(shots).toBe(1);
  });
});
