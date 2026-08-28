import { describe, expect, it } from 'vitest';
import type { Bargainable } from './Bargainable';
import { findWithinSphere } from './findWithinSphere';

const at = (x: number, y: number): Bargainable => ({
  position: { x, y },
  demand: { tier: 'Normal', cost: { kind: 'Gold', fractionOfGold: 0.1 } },
  flee: () => undefined,
});

const ORIGIN = { x: 0, y: 0 };

describe('findWithinSphere', () => {
  it('returns only what is inside the radius', () => {
    const near = at(50, 0);
    const far = at(400, 0);
    expect(findWithinSphere(ORIGIN, [near, far], 100)).toEqual([near]);
  });

  it('orders by distance so the first is the one a hold would settle', () => {
    const mid = at(60, 0);
    const closest = at(0, 20);
    const outer = at(0, 95);
    expect(findWithinSphere(ORIGIN, [mid, outer, closest], 100)).toEqual([closest, mid, outer]);
  });

  it('includes an enemy exactly on the boundary', () => {
    const edge = at(100, 0);
    expect(findWithinSphere(ORIGIN, [edge], 100)).toEqual([edge]);
  });

  it('returns nothing for an empty sphere', () => {
    expect(findWithinSphere(ORIGIN, [at(300, 300)], 100)).toEqual([]);
    expect(findWithinSphere(ORIGIN, [], 100)).toEqual([]);
  });
});
