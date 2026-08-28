import type Phaser from 'phaser';
import type { ForgeOffer } from '../forge/ForgeService';

const ANVIL_COLOR = 0x8a6b4f;
const ANVIL_RIM_COLOR = 0xffd166;
const ANVIL_HALF = 20;
const ANVIL_SIZE = ANVIL_HALF + ANVIL_HALF;
const ANVIL_RIM_WIDTH = 2;
const DIMMED = 0.5;

const PANEL_OFFSET_Y = -110;
const LINE_HEIGHT = 18;
const ORIGIN_CENTRE = 0.5;
const TITLE_STYLE = { fontFamily: 'monospace', fontSize: '14px', color: '#ffd166' };
const OFFER_STYLE = { fontFamily: 'monospace', fontSize: '13px', color: '#f2f2f7' };
const UNAFFORDABLE_COLOR = '#7a7a88';
const AFFORDABLE_COLOR = '#f2f2f7';
const NOTICE_STYLE = { fontFamily: 'monospace', fontSize: '12px', color: '#ff8f6b' };
const NOTICE_OFFSET_Y = 30;
const OUT_OF_REACH = 'step closer to the Forge';

/**
 * The Forge's shelf (GDD 2.4). Built from Phaser text and graphics rather than DOM
 * elements: GDD 7 allows either, and staying in-canvas keeps the HUD consistent and
 * avoids a second styling system.
 */
export class ForgeView {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly title: Phaser.GameObjects.Text;
  private readonly lines: Phaser.GameObjects.Text[] = [];
  private readonly notice: Phaser.GameObjects.Text;

  public constructor(
    private readonly scene: Phaser.Scene,
    private readonly depth: number,
  ) {
    this.graphics = scene.add.graphics().setDepth(depth);
    this.title = scene.add.text(0, 0, '', TITLE_STYLE).setOrigin(ORIGIN_CENTRE).setDepth(depth);
    this.notice = scene.add.text(0, 0, '', NOTICE_STYLE).setOrigin(ORIGIN_CENTRE).setDepth(depth);
  }

  public show(
    stock: readonly ForgeOffer[],
    at: { x: number; y: number; gold: number; withinReach: boolean },
    notice: string | null,
  ): void {
    this.graphics.clear();
    this.graphics
      .fillStyle(ANVIL_COLOR)
      .fillRect(at.x - ANVIL_HALF, at.y - ANVIL_HALF, ANVIL_SIZE, ANVIL_SIZE)
      .lineStyle(ANVIL_RIM_WIDTH, ANVIL_RIM_COLOR, at.withinReach ? 1 : DIMMED)
      .strokeRect(at.x - ANVIL_HALF, at.y - ANVIL_HALF, ANVIL_SIZE, ANVIL_SIZE);

    this.title.setText(at.withinReach ? 'FORGE' : OUT_OF_REACH);
    this.title.setPosition(at.x, at.y + PANEL_OFFSET_Y);
    this.title.setVisible(true);

    stock.forEach((offer, index) => {
      const line = this.lineAt(index);
      line.setText(`${String(index + 1)})  ${offer.upgrade.name}   ${String(offer.cost)}g`);
      line.setColor(offer.cost <= at.gold ? AFFORDABLE_COLOR : UNAFFORDABLE_COLOR);
      line.setPosition(at.x, at.y + PANEL_OFFSET_Y + LINE_HEIGHT * (index + 1));
      line.setVisible(at.withinReach);
    });
    for (let index = stock.length; index < this.lines.length; index++) {
      this.lines[index]?.setVisible(false);
    }

    this.notice.setText(notice ?? '');
    this.notice.setPosition(at.x, at.y + NOTICE_OFFSET_Y);
    this.notice.setVisible(notice !== null);
  }

  public hide(): void {
    this.graphics.clear();
    this.title.setVisible(false);
    this.notice.setVisible(false);
    for (const line of this.lines) {
      line.setVisible(false);
    }
  }

  private lineAt(index: number): Phaser.GameObjects.Text {
    const existing = this.lines[index];
    if (existing !== undefined) {
      return existing;
    }
    const line = this.scene.add
      .text(0, 0, '', OFFER_STYLE)
      .setOrigin(ORIGIN_CENTRE)
      .setDepth(this.depth);
    this.lines.push(line);
    return line;
  }

  public destroy(): void {
    this.graphics.destroy();
    this.title.destroy();
    this.notice.destroy();
    for (const line of this.lines) {
      line.destroy();
    }
    this.lines.length = 0;
  }
}
