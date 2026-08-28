import type Phaser from 'phaser';
import type { PlayerResources } from '../player/PlayerResources';

const MARGIN = 14;
const STYLE = { fontFamily: 'monospace', fontSize: '15px', color: '#c9c9d4' };
const DEFEAT_STYLE = { fontFamily: 'monospace', fontSize: '13px', color: '#ff8f6b' };
const DEFEAT_OFFSET_Y = 22;
const DEFEAT_MESSAGE = 'Bargained away the last of your Vitality.';

/** Shows what a Parley actually costs the player. */
export class ResourceHud {
  private readonly readout: Phaser.GameObjects.Text;
  private readonly defeat: Phaser.GameObjects.Text;

  public constructor(scene: Phaser.Scene) {
    this.readout = scene.add.text(MARGIN, MARGIN, '', STYLE);
    this.defeat = scene.add.text(MARGIN, MARGIN + DEFEAT_OFFSET_Y, '', DEFEAT_STYLE);
  }

  public render(resources: PlayerResources): void {
    this.readout.setText(
      `Gold ${String(resources.gold)}    Vitality ${String(resources.vitality)}`,
    );
    this.defeat.setText(resources.isDefeated ? DEFEAT_MESSAGE : '');
  }

  public destroy(): void {
    this.readout.destroy();
    this.defeat.destroy();
  }
}
