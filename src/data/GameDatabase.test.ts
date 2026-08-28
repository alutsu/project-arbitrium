import { describe, expect, it } from 'vitest';
import { GameDatabase } from './GameDatabase';
import type { PlayerStats } from './PlayerStats';
import type { UpgradeData, UpgradeId } from './UpgradeData';
import type { WeaponData, WeaponId } from './WeaponData';

const STATS: PlayerStats = { moveSpeedPixelsPerSecond: 220, parleyMovementPenalty: 0.3 };

const weapon = (id: string): WeaponData => ({
  id: id as WeaponId,
  name: id,
  type: 'Melee',
  tags: ['Melee', 'Blade'],
  spriteKey: `sprite_${id}`,
  damage: 10,
  attackRate: 2,
  knockbackForce: 50,
  swingArc: 90,
  lungeAmount: 20,
});

const upgrade = (id: string): UpgradeData => ({
  id: id as UpgradeId,
  name: id,
  goldCost: 40,
  iconKey: `icon_${id}`,
  requiredTags: ['Melee'],
  forbiddenTags: ['Ranged'],
});

const build = (weapons: WeaponData[], upgrades: UpgradeData[]): GameDatabase => {
  const outcome = GameDatabase.create(weapons, upgrades, STATS);
  if (!outcome.ok) throw new Error(outcome.error);
  return outcome.value;
};

describe('GameDatabase', () => {
  it('looks records up by id', () => {
    const database = build([weapon('sabre')], [upgrade('phase_blade')]);
    expect(database.weapon('sabre' as WeaponId).name).toBe('sabre');
    expect(database.upgrade('phase_blade' as UpgradeId).goldCost).toBe(40);
    expect(database.playerStats).toEqual(STATS);
  });

  it('exposes every record for iteration', () => {
    const database = build([weapon('sabre'), weapon('maul')], []);
    expect(database.weapons.map((w) => w.id)).toEqual(['sabre', 'maul']);
    expect(database.upgrades).toEqual([]);
  });

  it('throws on an unknown id, naming it', () => {
    const database = build([weapon('sabre')], []);
    expect(() => database.weapon('missing' as WeaponId)).toThrow('missing');
    expect(() => database.upgrade('missing' as UpgradeId)).toThrow('missing');
  });

  it('refuses to build with duplicate ids', () => {
    const weapons = GameDatabase.create([weapon('sabre'), weapon('sabre')], [], STATS);
    expect(weapons.ok).toBe(false);
    if (!weapons.ok) expect(weapons.error).toContain('duplicate weapon id "sabre"');

    const upgrades = GameDatabase.create([], [upgrade('grip'), upgrade('grip')], STATS);
    expect(upgrades.ok).toBe(false);
    if (!upgrades.ok) expect(upgrades.error).toContain('duplicate upgrade id "grip"');
  });
});
