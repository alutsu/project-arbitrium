import type Phaser from 'phaser';
import type { Swing } from '../combat/isWithinSwing';
import { degreesToRadians } from '../math/degreesToRadians';

const ARC_COLOR = 0xf2f2f7;
const ARC_WIDTH = 3;
const FLASH_MS = 90;
const SPENT = 0;
const HALF = 0.5;

/** A brief arc showing where a melee swing landed (GDD 2.3.2). */
export class SwingView {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private remainingMs = SPENT;
  private swing: Swing | null = null;

  public constructor(scene: Phaser.Scene, depth: number) {
    this.graphics = scene.add.graphics().setDepth(depth);
  }

  public flash(swing: Swing): void {
    this.swing = swing;
    this.remainingMs = FLASH_MS;
  }

  public render(deltaMs: number): void {
    this.graphics.clear();
    if (this.remainingMs <= SPENT || this.swing === null) {
      return;
    }
    this.remainingMs -= deltaMs;
    const halfArc = degreesToRadians(this.swing.swingArc) * HALF;
    this.graphics.lineStyle(ARC_WIDTH, ARC_COLOR, this.remainingMs / FLASH_MS);
    this.graphics.beginPath();
    this.graphics.arc(
      this.swing.origin.x,
      this.swing.origin.y,
      this.swing.reachPixels,
      this.swing.aimRadians - halfArc,
      this.swing.aimRadians + halfArc,
    );
    this.graphics.strokePath();
  }

  public destroy(): void {
    this.graphics.destroy();
  }
}
