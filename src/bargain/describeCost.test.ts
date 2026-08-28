import { describe, expect, it } from 'vitest';
import { describeCost } from './describeCost';

describe('describeCost', () => {
  it('reads a gold demand as a percentage', () => {
    expect(describeCost({ kind: 'Gold', fractionOfGold: 0.15 })).toBe('-15% Gold');
  });

  it('rounds an awkward late-bargain fraction to something legible', () => {
    expect(describeCost({ kind: 'Gold', fractionOfGold: 0.30000000000000004 })).toBe('-30% Gold');
  });

  it('reads a vitality demand in points', () => {
    expect(describeCost({ kind: 'Vitality', damage: 8 })).toBe('-8 Vitality');
  });
});
