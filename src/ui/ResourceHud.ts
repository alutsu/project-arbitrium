import type Phaser from 'phaser';
import type { PlayerState } from '../player/PlayerState';

const MARGIN = 14;
const STYLE = { fontFamily: 'monospace', fontSize: '15px', color: '#c9c9d4' };
const PERCENT = 100;
/** roomsRemaining counts entries still to come, so the current room makes one more. */
const ROOMS_INCLUSIVE = 1;

function roomsWord(rooms: number): string {
  return rooms === 1 ? '1 room' : `${String(rooms)} rooms`;
}

/**
 * Shows what a Parley actually costs the player. Defeat is announced by `DefeatView`;
 * saying it here as well once claimed a bargain was to blame, which combat made untrue.
 */
export class ResourceHud {
  private readonly readout: Phaser.GameObjects.Text;

  public constructor(scene: Phaser.Scene, depth: number) {
    // Fixed to the viewport, so a camera kick shakes the world and not the readout.
    this.readout = scene.add.text(MARGIN, MARGIN, '', STYLE).setDepth(depth).setScrollFactor(0);
  }

  public render(state: PlayerState, roomLabel: string, weaponLabel: string): void {
    const { resources, pride } = state;
    const humbled = pride.isActive
      ? `    Pride -${String(Math.round(pride.speedPenalty * PERCENT))}% Speed (${roomsWord(pride.roomsRemaining + ROOMS_INCLUSIVE)})`
      : '';
    this.readout.setText(
      `Gold ${String(resources.gold)}    Vitality ${String(resources.vitality)}    ${weaponLabel}    ${roomLabel}${humbled}`,
    );
  }

  public destroy(): void {
    this.readout.destroy();
  }
}
