import type Phaser from 'phaser';
import { GAME_DISPLAY } from '../config/gameDisplay';
import type { Vector2 } from '../math/Vector2';
import { shakeForDamage } from './feedbackStrength';

const SPARK_COUNT_HIT = 6;
const SPARK_COUNT_KILL = 18;
const SPARK_SPEED_MIN = 60;
const SPARK_SPEED_MAX = 220;
const SPARK_LIFESPAN_MS = 320;
const SPARK_SCALE_START = 1;
const SPARK_SCALE_END = 0;

const LABEL_RISE_PIXELS_PER_SECOND = -46;
const LABEL_LIFESPAN_MS = 620;
const LABEL_OFFSET_Y = -18;
const LABEL_ORIGIN = 0.5;
const DAMAGE_STYLE = { fontFamily: 'monospace', fontSize: '14px', color: '#f2f2f7' };
const GOLD_STYLE = { fontFamily: 'monospace', fontSize: '15px', color: '#ffd166' };

const VIGNETTE_COLOR = 0xff3b3b;
const VIGNETTE_PEAK_ALPHA = 0.3;
const VIGNETTE_LIFESPAN_MS = 260;

const MILLISECONDS_PER_SECOND = 1000;
const SPENT = 0;

interface Rising {
  readonly text: Phaser.GameObjects.Text;
  remainingMs: number;
}

/**
 * Combat feedback: sparks, floating numbers, a red flash and a camera kick.
 *
 * This exists for legibility as much as for feel. Before it, damage was invisible unless
 * you happened to be watching a number in the HUD; now a hit reads as a hit.
 *
 * Everything is pooled or reused, since a fight produces these constantly (CLAUDE.md 5).
 */
export class FeedbackView {
  private readonly sparks: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly vignette: Phaser.GameObjects.Graphics;
  private readonly labels: Phaser.GameObjects.Text[] = [];
  private readonly rising: Rising[] = [];
  private vignetteRemainingMs = SPENT;

  public constructor(
    private readonly scene: Phaser.Scene,
    private readonly depth: number,
    sparkTextureKey: string,
  ) {
    this.sparks = scene.add.particles(0, 0, sparkTextureKey, {
      speed: { min: SPARK_SPEED_MIN, max: SPARK_SPEED_MAX },
      lifespan: SPARK_LIFESPAN_MS,
      scale: { start: SPARK_SCALE_START, end: SPARK_SCALE_END },
      emitting: false,
    });
    this.sparks.setDepth(depth);

    // Fixed to the viewport: a flash that slid with the shake would show its edges.
    this.vignette = scene.add.graphics().setDepth(depth).setScrollFactor(0);
  }

  /** A hit landed on something: sparks and the damage dealt. */
  public hit(at: Vector2, damage: number): void {
    this.sparks.explode(SPARK_COUNT_HIT, at.x, at.y);
    this.float(at, `-${String(Math.round(damage))}`, DAMAGE_STYLE);
  }

  /** Something died: a bigger burst, and the Gold it paid out. */
  public kill(at: Vector2, gold: number): void {
    this.sparks.explode(SPARK_COUNT_KILL, at.x, at.y);
    this.float(at, `+${String(gold)}g`, GOLD_STYLE);
  }

  /** The player was hit: kick the camera and flash the screen. */
  public playerHurt(damage: number): void {
    const shake = shakeForDamage(damage);
    this.scene.cameras.main.shake(shake.durationMs, shake.intensity);
    this.vignetteRemainingMs = VIGNETTE_LIFESPAN_MS;
  }

  public render(deltaMs: number): void {
    this.advanceLabels(deltaMs);
    this.advanceVignette(deltaMs);
  }

  private advanceLabels(deltaMs: number): void {
    const seconds = deltaMs / MILLISECONDS_PER_SECOND;
    for (let index = this.rising.length - 1; index >= SPENT; index--) {
      const label = this.rising[index];
      if (label === undefined) {
        continue;
      }
      label.remainingMs -= deltaMs;
      if (label.remainingMs <= SPENT) {
        label.text.setVisible(false).setActive(false);
        this.rising.splice(index, 1);
        continue;
      }
      label.text.y += LABEL_RISE_PIXELS_PER_SECOND * seconds;
      label.text.setAlpha(label.remainingMs / LABEL_LIFESPAN_MS);
    }
  }

  private advanceVignette(deltaMs: number): void {
    this.vignette.clear();
    if (this.vignetteRemainingMs <= SPENT) {
      return;
    }
    this.vignetteRemainingMs -= deltaMs;
    const strength = Math.max(SPENT, this.vignetteRemainingMs) / VIGNETTE_LIFESPAN_MS;
    this.vignette.fillStyle(VIGNETTE_COLOR, VIGNETTE_PEAK_ALPHA * strength);
    this.vignette.fillRect(0, 0, GAME_DISPLAY.width, GAME_DISPLAY.height);
  }

  private float(at: Vector2, message: string, style: typeof DAMAGE_STYLE): void {
    const text = this.take();
    text.setStyle(style);
    text.setText(message);
    text.setPosition(at.x, at.y + LABEL_OFFSET_Y);
    text.setAlpha(1).setVisible(true).setActive(true);
    this.rising.push({ text, remainingMs: LABEL_LIFESPAN_MS });
  }

  private take(): Phaser.GameObjects.Text {
    const idle = this.labels.find((label) => !label.active);
    if (idle !== undefined) {
      return idle;
    }
    const created = this.scene.add
      .text(0, 0, '', DAMAGE_STYLE)
      .setOrigin(LABEL_ORIGIN)
      .setDepth(this.depth);
    this.labels.push(created);
    return created;
  }

  public destroy(): void {
    this.sparks.destroy();
    this.vignette.destroy();
    for (const label of this.labels) {
      label.destroy();
    }
    this.labels.length = SPENT;
    this.rising.length = SPENT;
  }
}
