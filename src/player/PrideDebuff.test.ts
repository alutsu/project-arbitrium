import { describe, expect, it } from 'vitest';
import { PrideDebuff } from './PrideDebuff';

describe('PrideDebuff', () => {
  it('does nothing when there is no debuff', () => {
    expect(PrideDebuff.none.isActive).toBe(false);
    expect(PrideDebuff.none.speedMultiplier).toBe(1);
  });

  it('slows the player by the penalty it carries', () => {
    expect(new PrideDebuff(0.25, 1).speedMultiplier).toBeCloseTo(0.75);
  });

  it('survives into the next room, then expires (GDD 4.1.2)', () => {
    const paid = new PrideDebuff(0.25, 1);
    const nextRoom = paid.afterRoomEntry();
    expect(nextRoom.isActive).toBe(true);
    expect(nextRoom.speedMultiplier).toBeCloseTo(0.75);

    const roomAfter = nextRoom.afterRoomEntry();
    expect(roomAfter.isActive).toBe(false);
    expect(roomAfter.speedMultiplier).toBe(1);
  });

  it('can be configured to outlast more rooms', () => {
    let debuff = new PrideDebuff(0.3, 3);
    for (let room = 0; room < 3; room++) {
      debuff = debuff.afterRoomEntry();
      expect(debuff.isActive).toBe(true);
    }
    expect(debuff.afterRoomEntry().isActive).toBe(false);
  });

  it('stays expired once it has run out', () => {
    expect(PrideDebuff.none.afterRoomEntry().isActive).toBe(false);
  });

  it('leaves the original untouched when aged', () => {
    const paid = new PrideDebuff(0.25, 1);
    paid.afterRoomEntry();
    expect(paid.roomsRemaining).toBe(1);
  });
});
