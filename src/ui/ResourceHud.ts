import type Phaser from 'phaser';
import type { PlayerState } from '../player/PlayerState';

const MARGIN = 14;
const STYLE = { fontFamily: 'monospace', fontSize: '15px', color: '#c9c9d4' };
const DEFEAT_STYLE = { fontFamily: 'monospace', fontSize: '13px', color: '#ff8f6b' };
const DEFEAT_OFFSET_Y = 22;
const DEFEAT_MESSAGE = 'Bargained away the last of your Vitality.';
const PERCENT = 100;
/** roomsRemaining counts entries still to come, so the current room makes one more. */
const ROOMS_INCLUSIVE = 1;

function roomsWord(rooms: number): string {
  return rooms === 1 ? '1 room' : `${String(rooms)} rooms`;
}

/** Shows what a Parley actually costs the player. */
export class ResourceHud {
  private readonly readout: Phaser.GameObjects.Text;
  private readonly defeat: Phaser.GameObjects.Text;

  public constructor(scene: Phaser.Scene, depth: number) {
    this.readout = scene.add.text(MARGIN, MARGIN, '', STYLE).setDepth(depth);
    this.defeat = scene.add
      .text(MARGIN, MARGIN + DEFEAT_OFFSET_Y, '', DEFEAT_STYLE)
      .setDepth(depth);
  }

  public render(state: PlayerState, roomLabel: string, weaponLabel: string): void {
    const { resources, pride } = state;
    const humbled = pride.isActive
      ? `    Pride -${String(Math.round(pride.speedPenalty * PERCENT))}% Speed (${roomsWord(pride.roomsRemaining + ROOMS_INCLUSIVE)})`
      : '';
    this.readout.setText(
      `Gold ${String(resources.gold)}    Vitality ${String(resources.vitality)}    ${weaponLabel}    ${roomLabel}${humbled}`,
    );
    this.defeat.setText(resources.isDefeated ? DEFEAT_MESSAGE : '');
  }

  public destroy(): void {
    this.readout.destroy();
    this.defeat.destroy();
  }
}
