import type Phaser from 'phaser';
import type { SoundKey } from './SoundKey';

const SPENT = 0;

interface Voice {
  readonly volume: number;
  /**
   * Shortest gap between two plays of this effect. A shotgun lands five pellets in one
   * frame and the pistol fires four times a second; without a floor, hit and shot turn
   * into a buzz rather than a sound.
   */
  readonly minGapMs: number;
}

const VOICES: Readonly<Record<SoundKey, Voice>> = {
  shot: { volume: 0.22, minGapMs: 40 },
  hit: { volume: 0.28, minGapMs: 45 },
  kill: { volume: 0.4, minGapMs: 60 },
  hurt: { volume: 0.45, minGapMs: 90 },
  bargain: { volume: 0.4, minGapMs: 120 },
  purchase: { volume: 0.4, minGapMs: 120 },
};

/**
 * Plays the game's sound effects.
 *
 * Thin on purpose: the interesting decisions are the per-effect volume and the minimum
 * gap, both stated in one table above. Nothing here fails if audio is unavailable —
 * Phaser hands back a no-op manager, and a browser that has not seen a gesture yet
 * simply plays nothing until it has.
 */
export class GameSounds {
  private readonly cooldowns = new Map<SoundKey, number>();

  public constructor(private readonly manager: Phaser.Sound.BaseSoundManager) {}

  public tick(deltaMs: number): void {
    for (const [key, remaining] of this.cooldowns) {
      this.cooldowns.set(key, Math.max(SPENT, remaining - deltaMs));
    }
  }

  public play(key: SoundKey): void {
    const voice = VOICES[key];
    if ((this.cooldowns.get(key) ?? SPENT) > SPENT) {
      return;
    }
    this.cooldowns.set(key, voice.minGapMs);
    this.manager.play(key, { volume: voice.volume });
  }
}
