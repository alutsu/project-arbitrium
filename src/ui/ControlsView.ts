import type Phaser from 'phaser';
import { GAME_DISPLAY } from '../config/gameDisplay';

const MARGIN = 14;
/**
 * Bright enough to read over the wall band it usually sits on, dim enough to stay behind
 * the HUD in the reading order. The first colour tried, #6f6f80, vanished into the wall.
 */
const STYLE = { fontFamily: 'monospace', fontSize: '12px', color: '#9fa0ad', lineSpacing: 4 };
const ANCHOR_LEFT = 0;
const ANCHOR_BOTTOM = 1;

/**
 * The control legend (GDD 3.3), in the game's own vocabulary rather than generic verbs:
 * the player holds *Parley*, not "hold to interact".
 *
 * Always on screen. The Pedestal and the Forge print their own prompts when the player is
 * close enough to use them, so this stays a standing reference rather than a tutorial.
 */
const LINES = [
  'WASD move     mouse aim     click attack     hold SPACE parley',
  'E swap     R sell     1-3 buy at the Forge',
].join('\n');

export class ControlsView {
  private readonly text: Phaser.GameObjects.Text;

  public constructor(scene: Phaser.Scene, depth: number) {
    this.text = scene.add
      .text(MARGIN, GAME_DISPLAY.height - MARGIN, LINES, STYLE)
      .setOrigin(ANCHOR_LEFT, ANCHOR_BOTTOM)
      // Fixed to the viewport, so a camera kick never drags the legend about.
      .setScrollFactor(0)
      .setDepth(depth);
  }

  public destroy(): void {
    this.text.destroy();
  }
}
