import { describe, expect, it } from 'vitest';
import { spreadAngles } from './spreadAngles';

const AIM = 0;
const SPREAD = 30;
const DEGREE = Math.PI / 180;

describe('spreadAngles', () => {
  it('sends a single projectile exactly where the player aims', () => {
    expect(spreadAngles(AIM, 1, SPREAD)).toEqual([AIM]);
    expect(spreadAngles(1.2, 1, SPREAD)).toEqual([1.2]);
  });

  it('fans several evenly across the spread, centred on the aim', () => {
    const angles = spreadAngles(AIM, 3, SPREAD);
    expect(angles).toHaveLength(3);
    expect(angles[0]).toBeCloseTo(-15 * DEGREE);
    expect(angles[1]).toBeCloseTo(0);
    expect(angles[2]).toBeCloseTo(15 * DEGREE);
  });

  it('stays centred on the aim when the aim is not zero', () => {
    const angles = spreadAngles(Math.PI, 5, SPREAD);
    const middle = angles[2];
    expect(middle).toBeCloseTo(Math.PI);
  });

  it('spans exactly the spread requested', () => {
    const angles = spreadAngles(AIM, 5, SPREAD);
    const first = angles[0];
    const last = angles[angles.length - 1];
    if (first === undefined || last === undefined) throw new Error('expected angles');
    expect(last - first).toBeCloseTo(SPREAD * DEGREE);
  });

  it('treats a zero or negative count as a single shot rather than firing nothing', () => {
    expect(spreadAngles(AIM, 0, SPREAD)).toEqual([AIM]);
  });
});
