import { describe, expect, it } from 'vitest';
import { shakeForDamage, shakeForLandedHit } from './feedbackStrength';

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

describe('shakeForLandedHit', () => {
  it('kicks harder for a bigger hit, like taking one does', () => {
    expect(shakeForLandedHit(14).intensity).toBeGreaterThan(shakeForLandedHit(3).intensity);
  });

  it('is gentler and shorter than taking the same hit', () => {
    for (const damage of [1, 7, 14, 20]) {
      const landed = shakeForLandedHit(damage);
      const taken = shakeForDamage(damage);
      expect(landed.intensity).toBeLessThan(taken.intensity);
      expect(landed.durationMs).toBeLessThan(taken.durationMs);
    }
  });

  it('still registers the smallest hit', () => {
    expect(shakeForLandedHit(1).intensity).toBeGreaterThan(0);
  });

  it('stops growing once the hit is already devastating', () => {
    expect(shakeForLandedHit(20)).toEqual(shakeForLandedHit(200));
  });

  it('stays small enough that rapid fire does not make the screen unreadable', () => {
    for (const damage of [0, 1, 7, 14, 20, 90]) {
      expect(shakeForLandedHit(damage).intensity).toBeLessThanOrEqual(0.003);
      expect(shakeForLandedHit(damage).durationMs).toBeLessThanOrEqual(80);
    }
  });
});
