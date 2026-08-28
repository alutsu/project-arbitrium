import type { InputIntent } from './InputIntent';

/** A device binding that can report the player's intent for the current frame. */
export interface InputSource {
  /**
   * Reads this frame's intent. Must be called exactly once per frame: one-shot
   * actions are edge-detected, so a second read in the same frame loses the press.
   */
  readIntent(): InputIntent;
}
