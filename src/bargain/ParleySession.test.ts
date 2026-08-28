import { describe, expect, it } from 'vitest';
import type { Bargainable } from './Bargainable';
import { ParleySession } from './ParleySession';

const HOLD_MS = 900;
const FRAME_MS = 100;

/** A fresh object each call, since the session tracks its target by identity. */
const enemy = (): Bargainable => ({
  position: { x: 0, y: 0 },
  demand: { tier: 'Normal', cost: { kind: 'Gold', fractionOfGold: 0.1 } },
  flee: () => undefined,
});

const hold = (session: ParleySession, target: Bargainable, frames: number): string => {
  let last = 'inactive';
  for (let frame = 0; frame < frames; frame++) {
    last = session.update({ isParleying: true, target, deltaMs: FRAME_MS }).kind;
  }
  return last;
};

describe('ParleySession', () => {
  it('is inactive while Parley is not held', () => {
    const session = new ParleySession(HOLD_MS);
    expect(session.update({ isParleying: false, target: enemy(), deltaMs: FRAME_MS })).toEqual({
      kind: 'inactive',
    });
  });

  it('is inactive when the Sphere is empty, even while held', () => {
    const session = new ParleySession(HOLD_MS);
    expect(session.update({ isParleying: true, target: null, deltaMs: FRAME_MS }).kind).toBe(
      'inactive',
    );
  });

  it('reports progress as the hold charges', () => {
    const session = new ParleySession(HOLD_MS);
    const target = enemy();
    session.update({ isParleying: true, target, deltaMs: 300 });
    const status = session.update({ isParleying: true, target, deltaMs: 150 });
    expect(status.kind).toBe('charging');
    if (status.kind !== 'charging') return;
    expect(status.progress).toBeCloseTo(0.5);
  });

  it('completes once the hold duration is reached', () => {
    const session = new ParleySession(HOLD_MS);
    expect(hold(session, enemy(), 9)).toBe('completed');
  });

  it('completes on exactly one frame, so the cost is charged once', () => {
    const session = new ParleySession(HOLD_MS);
    const target = enemy();
    hold(session, target, 9);
    expect(session.update({ isParleying: true, target, deltaMs: FRAME_MS }).kind).toBe('charging');
  });

  it('starts over when Parley is released mid-hold', () => {
    const session = new ParleySession(HOLD_MS);
    const target = enemy();
    hold(session, target, 8);
    session.update({ isParleying: false, target, deltaMs: FRAME_MS });
    expect(hold(session, target, 8)).toBe('charging');
  });

  it('starts over when the player drifts onto a different enemy', () => {
    const session = new ParleySession(HOLD_MS);
    hold(session, enemy(), 8);
    const status = session.update({ isParleying: true, target: enemy(), deltaMs: FRAME_MS });
    expect(status.kind).toBe('charging');
    if (status.kind !== 'charging') return;
    expect(status.progress).toBeCloseTo(FRAME_MS / HOLD_MS);
  });
});
