import type Phaser from 'phaser';
import type { PlayerResources } from '../player/PlayerResources';

const MARGIN = 14;
const STYLE = { fontFamily: 'monospace', fontSize: '15px', color: '#c9c9d4' };
const REFUSAL_STYLE = { fontFamily: 'monospace', fontSize: '13px', color: '#ff8f6b' };
const REFUSAL_OFFSET_Y = 22;
const REFUSAL_LINGER_MS = 2000;
const NO_TIME = 0;

/** Shows what a Parley actually costs the player, and why one was refused. */
export class ResourceHud {
  private readonly readout: Phaser.GameObjects.Text;
  private readonly refusal: Phaser.GameObjects.Text;
  private refusalRemainingMs = NO_TIME;

  public constructor(scene: Phaser.Scene) {
    this.readout = scene.add.text(MARGIN, MARGIN, '', STYLE);
    this.refusal = scene.add.text(MARGIN, MARGIN + REFUSAL_OFFSET_Y, '', REFUSAL_STYLE);
  }

  public render(resources: PlayerResources, refusal: string | null, deltaMs: number): void {
    this.readout.setText(
      `Gold ${String(resources.gold)}    Vitality ${String(resources.vitality)}`,
    );

    if (refusal !== null) {
      this.refusal.setText(refusal);
      this.refusalRemainingMs = REFUSAL_LINGER_MS;
      return;
    }

    if (this.refusalRemainingMs > NO_TIME) {
      this.refusalRemainingMs -= deltaMs;
      if (this.refusalRemainingMs <= NO_TIME) {
        this.refusal.setText('');
      }
    }
  }

  public destroy(): void {
    this.readout.destroy();
    this.refusal.destroy();
  }
}
