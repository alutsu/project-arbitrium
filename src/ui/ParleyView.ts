import type Phaser from 'phaser';
import type { Bargainable } from '../bargain/Bargainable';
import { describeCost } from '../bargain/describeCost';
import type { ParleyFrame } from '../bargain/ParleySystem';

const SPHERE_COLOR = 0x6fd3c7;
const SPHERE_FILL_ALPHA = 0.07;
const SPHERE_LINE_ALPHA = 0.5;
const SPHERE_LINE_WIDTH = 2;

const TARGET_COLOR = 0xffd166;
const TARGET_RING_WIDTH = 3;
const TARGET_RING_RADIUS = 18;
const HALF_TURNS_PER_CIRCLE = 2;
const FULL_CIRCLE = Math.PI * HALF_TURNS_PER_CIRCLE;
/** Phaser measures angles from +x, so a progress ring should start at the top. */
const ARC_START = -Math.PI / HALF_TURNS_PER_CIRCLE;

const ICON_OFFSET_Y = -28;
const ICON_ORIGIN = 0.5;
const ICON_STYLE = { fontFamily: 'monospace', fontSize: '13px', color: '#f2f2f7' };
const ICON_LATE_COLOR = '#ff8f6b';
const ICON_NORMAL_COLOR = '#f2f2f7';

/**
 * Draws the Sphere of Influence and the Desire Icons while Parley is held (GDD 2.2.1),
 * plus the ring that fills as the hold completes.
 */
export class ParleyView {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly icons = new Map<Bargainable, Phaser.GameObjects.Text>();

  public constructor(
    private readonly scene: Phaser.Scene,
    private readonly sphereRadiusPixels: number,
  ) {
    this.graphics = scene.add.graphics();
  }

  public render(frame: ParleyFrame, playerX: number, playerY: number): void {
    this.graphics.clear();
    this.pruneIcons(frame);

    if (!frame.isParleying) {
      return;
    }

    this.graphics
      .fillStyle(SPHERE_COLOR, SPHERE_FILL_ALPHA)
      .fillCircle(playerX, playerY, this.sphereRadiusPixels)
      .lineStyle(SPHERE_LINE_WIDTH, SPHERE_COLOR, SPHERE_LINE_ALPHA)
      .strokeCircle(playerX, playerY, this.sphereRadiusPixels);

    for (const target of frame.visible) {
      const icon = this.iconFor(target.bargainable);
      icon.setText(describeCost(target.cost));
      icon.setColor(frame.isLate ? ICON_LATE_COLOR : ICON_NORMAL_COLOR);
      icon.setPosition(
        target.bargainable.position.x,
        target.bargainable.position.y + ICON_OFFSET_Y,
      );
      icon.setVisible(true);
    }

    if (frame.status.kind === 'charging') {
      const { x, y } = frame.status.target.position;
      this.graphics.lineStyle(TARGET_RING_WIDTH, TARGET_COLOR, 1);
      this.graphics.beginPath();
      this.graphics.arc(
        x,
        y,
        TARGET_RING_RADIUS,
        ARC_START,
        ARC_START + FULL_CIRCLE * frame.status.progress,
      );
      this.graphics.strokePath();
    }
  }

  /** Frees the label of anything that has fled, and hides the rest (CLAUDE.md 5). */
  private pruneIcons(frame: ParleyFrame): void {
    const stillVisible = new Set(frame.visible.map((target) => target.bargainable));
    for (const [bargainable, icon] of this.icons) {
      if (stillVisible.has(bargainable)) {
        continue;
      }
      icon.setVisible(false);
    }
  }

  private iconFor(bargainable: Bargainable): Phaser.GameObjects.Text {
    const existing = this.icons.get(bargainable);
    if (existing !== undefined) {
      return existing;
    }
    const icon = this.scene.add.text(0, 0, '', ICON_STYLE).setOrigin(ICON_ORIGIN);
    this.icons.set(bargainable, icon);
    return icon;
  }

  public destroy(): void {
    this.graphics.destroy();
    for (const icon of this.icons.values()) {
      icon.destroy();
    }
    this.icons.clear();
  }
}
