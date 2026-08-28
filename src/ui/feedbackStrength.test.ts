import { describe, expect, it } from 'vitest';
import { shakeForDamage } from './feedbackStrength';

describe('shakeForDamage', () => {
  it('kicks harder for a bigger hit', () => {
    const scratch = shakeForDamage(3);
    const wallop = shakeForDamage(14);
    expect(wallop.intensity).toBeGreaterThan(scratch.intensity);
    expect(wallop.durationMs).toBeGreaterThan(scratch.durationMs);
  });

  it('still registers the smallest hit', () => {
    const shake = shakeForDamage(1);
    expect(shake.intensity).toBeGreaterThan(0);
    expect(shake.durationMs).toBeGreaterThan(0);
  });

  it('stops growing once the hit is already devastating', () => {
    expect(shakeForDamage(20)).toEqual(shakeForDamage(200));
  });

  it('treats a zero or negative hit as the gentlest kick rather than a negative one', () => {
    expect(shakeForDamage(0).intensity).toBeGreaterThan(0);
    expect(shakeForDamage(-5)).toEqual(shakeForDamage(0));
  });

  it('stays gentle enough that the world never shoves the HUD aside', () => {
    // Phaser treats intensity as a fraction of the viewport; 0.007 of 1280 is ~9px.
    for (const damage of [0, 1, 7, 14, 20, 90]) {
      const shake = shakeForDamage(damage);
      expect(shake.intensity).toBeLessThanOrEqual(0.007);
      expect(shake.durationMs).toBeLessThanOrEqual(220);
    }
  });
});
