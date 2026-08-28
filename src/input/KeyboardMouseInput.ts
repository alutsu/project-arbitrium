import Phaser from 'phaser';
import type { InputIntent } from './InputIntent';
import type { InputSource } from './InputSource';

const AXIS_NEUTRAL = 0;
const AXIS_POSITIVE = 1;
const AXIS_NEGATIVE = -1;

// A `type` alias, not an interface: that gives it the implicit index signature
// `Object.values` needs to stay typed in destroy().
type ActionKeys = {
  readonly up: Phaser.Input.Keyboard.Key;
  readonly down: Phaser.Input.Keyboard.Key;
  readonly left: Phaser.Input.Keyboard.Key;
  readonly right: Phaser.Input.Keyboard.Key;
  readonly parley: Phaser.Input.Keyboard.Key;
  readonly interact: Phaser.Input.Keyboard.Key;
  readonly sell: Phaser.Input.Keyboard.Key;
};

/**
 * Keyboard and mouse binding for the actions in GDD 3.3. This is the only file in
 * the input layer that touches Phaser, which keeps everything downstream testable.
 */
export class KeyboardMouseInput implements InputSource {
  private readonly keys: ActionKeys;

  public constructor(
    private readonly input: Phaser.Input.InputPlugin,
    private readonly keyboard: Phaser.Input.Keyboard.KeyboardPlugin,
  ) {
    const codes = Phaser.Input.Keyboard.KeyCodes;
    this.keys = {
      up: keyboard.addKey(codes.W),
      down: keyboard.addKey(codes.S),
      left: keyboard.addKey(codes.A),
      right: keyboard.addKey(codes.D),
      parley: keyboard.addKey(codes.SPACE),
      interact: keyboard.addKey(codes.E),
      sell: keyboard.addKey(codes.R),
    };
  }

  public readIntent(): InputIntent {
    const pointer = this.input.activePointer;
    return {
      moveAxes: {
        x: this.readAxis(this.keys.left, this.keys.right),
        y: this.readAxis(this.keys.up, this.keys.down),
      },
      aimPoint: { x: pointer.worldX, y: pointer.worldY },
      isAttacking: pointer.isDown,
      isParleying: this.keys.parley.isDown,
      // JustDown clears the key's edge flag, so these must be read once per frame.
      isInteracting: Phaser.Input.Keyboard.JustDown(this.keys.interact),
      isSelling: Phaser.Input.Keyboard.JustDown(this.keys.sell),
    };
  }

  /** Releases every key binding. Called on scene shutdown (CLAUDE.md 5). */
  public destroy(): void {
    for (const key of Object.values(this.keys)) {
      this.keyboard.removeKey(key, true);
    }
  }

  /** Opposing keys cancel out, so holding both reports a neutral axis. */
  private readAxis(
    negative: Phaser.Input.Keyboard.Key,
    positive: Phaser.Input.Keyboard.Key,
  ): number {
    const negativeValue = negative.isDown ? AXIS_NEGATIVE : AXIS_NEUTRAL;
    const positiveValue = positive.isDown ? AXIS_POSITIVE : AXIS_NEUTRAL;
    return negativeValue + positiveValue;
  }
}
