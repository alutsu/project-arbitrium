import type Phaser from 'phaser';
import type { WeaponData } from '../data/WeaponData';

const BASE_COLOR = 0x4a4a5e;
const BASE_RIM_COLOR = 0xffd166;
const BASE_HALF = 17;
const BASE_SIZE = BASE_HALF + BASE_HALF;
const BASE_RIM_WIDTH = 2;

const LABEL_OFFSET_Y = -34;
const PROMPT_OFFSET_Y = 26;
const LABEL_ORIGIN = 0.5;
const LABEL_STYLE = { fontFamily: 'monospace', fontSize: '13px', color: '#f2f2f7' };
const PROMPT_STYLE = { fontFamily: 'monospace', fontSize: '12px', color: '#ffd166' };
const OUT_OF_REACH_PROMPT = 'step closer';

/**
 * The Weapon Pedestal that rises at the end of a cleared room (GDD 2.1 phase 5, 6.1
 * step 5), and the Swap or Sell prompt it offers.
 */
export class PedestalView {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly label: Phaser.GameObjects.Text;
  private readonly prompt: Phaser.GameObjects.Text;

  public constructor(scene: Phaser.Scene, depth: number) {
    this.graphics = scene.add.graphics().setDepth(depth);
    this.label = scene.add.text(0, 0, '', LABEL_STYLE).setOrigin(LABEL_ORIGIN).setDepth(depth);
    this.prompt = scene.add.text(0, 0, '', PROMPT_STYLE).setOrigin(LABEL_ORIGIN).setDepth(depth);
  }

  public show(weapon: WeaponData, at: { x: number; y: number }, withinReach: boolean): void {
    this.graphics.clear();
    this.graphics
      .fillStyle(BASE_COLOR)
      .fillRect(at.x - BASE_HALF, at.y - BASE_HALF, BASE_SIZE, BASE_SIZE)
      .lineStyle(BASE_RIM_WIDTH, BASE_RIM_COLOR, withinReach ? 1 : LABEL_ORIGIN)
      .strokeRect(at.x - BASE_HALF, at.y - BASE_HALF, BASE_SIZE, BASE_SIZE);

    this.label.setText(`${weapon.name}  (${String(weapon.goldValue)}g)`);
    this.label.setPosition(at.x, at.y + LABEL_OFFSET_Y);
    this.label.setVisible(true);

    this.prompt.setText(withinReach ? 'E Swap    R Sell' : OUT_OF_REACH_PROMPT);
    this.prompt.setPosition(at.x, at.y + PROMPT_OFFSET_Y);
    this.prompt.setVisible(true);
  }

  public hide(): void {
    this.graphics.clear();
    this.label.setVisible(false);
    this.prompt.setVisible(false);
  }

  public destroy(): void {
    this.graphics.destroy();
    this.label.destroy();
    this.prompt.destroy();
  }
}
