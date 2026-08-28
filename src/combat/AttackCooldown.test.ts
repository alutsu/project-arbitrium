import { describe, expect, it } from 'vitest';
import { AttackCooldown } from './AttackCooldown';

const FOUR_PER_SECOND = 4;

describe('AttackCooldown', () => {
  it('is ready before anything has been fired', () => {
    expect(new AttackCooldown().isReady).toBe(true);
  });

  it('is not ready immediately after firing', () => {
    const cooldown = new AttackCooldown();
    cooldown.spend(FOUR_PER_SECOND);
    expect(cooldown.isReady).toBe(false);
  });

  it('becomes ready again after the rate implies, in milliseconds', () => {
    const cooldown = new AttackCooldown();
    cooldown.spend(FOUR_PER_SECOND);
    cooldown.tick(249);
    expect(cooldown.isReady).toBe(false);
    cooldown.tick(1);
    expect(cooldown.isReady).toBe(true);
  });

  it('fires the same number of times per second at any frame rate', () => {
    const shotsOver = (frameMs: number): number => {
      const cooldown = new AttackCooldown();
      let shots = 0;
      for (let elapsed = 0; elapsed < 1000; elapsed += frameMs) {
        if (cooldown.isReady) {
          shots += 1;
          cooldown.spend(FOUR_PER_SECOND);
        }
        cooldown.tick(frameMs);
      }
      return shots;
    };
    expect(shotsOver(16)).toBe(shotsOver(8));
  });

  it('does not bank readiness by waiting a long time', () => {
    const cooldown = new AttackCooldown();
    cooldown.spend(FOUR_PER_SECOND);
    cooldown.tick(5000);
    expect(cooldown.isReady).toBe(true);
    cooldown.spend(FOUR_PER_SECOND);
    expect(cooldown.isReady).toBe(false);
  });
});
