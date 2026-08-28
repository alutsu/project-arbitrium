import type Phaser from 'phaser';
import { GAME_DISPLAY } from '../config/gameDisplay';

const CENTRE = 0.5;
const TITLE = 'DEFEATED';
const SUBTITLE = 'the ledger closed';
const TITLE_STYLE = { fontFamily: 'monospace', fontSize: '42px', color: '#ff8f6b' };
const SUBTITLE_STYLE = { fontFamily: 'monospace', fontSize: '15px', color: '#c9c9d4' };
const SUBTITLE_OFFSET_Y = 44;

/**
 * Shown when the player's Vitality runs out. There is no restart flow: a run lifecycle
 * belongs with the meta-progression sprint, so this states the outcome and stops.
 */
export class DefeatView {
  private readonly title: Phaser.GameObjects.Text;
  private readonly subtitle: Phaser.GameObjects.Text;

  public constructor(scene: Phaser.Scene, depth: number) {
    const x = GAME_DISPLAY.width * CENTRE;
    const y = GAME_DISPLAY.height * CENTRE;
    this.title = scene.add
      .text(x, y, TITLE, TITLE_STYLE)
      .setOrigin(CENTRE)
      .setDepth(depth)
      .setScrollFactor(0)
      .setVisible(false);
    this.subtitle = scene.add
      .text(x, y + SUBTITLE_OFFSET_Y, SUBTITLE, SUBTITLE_STYLE)
      .setOrigin(CENTRE)
      .setDepth(depth)
      .setScrollFactor(0)
      .setVisible(false);
  }

  public show(): void {
    this.title.setVisible(true);
    this.subtitle.setVisible(true);
  }

  public destroy(): void {
    this.title.destroy();
    this.subtitle.destroy();
  }
}
