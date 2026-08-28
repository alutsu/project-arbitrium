import type { Bargainable } from './Bargainable';

export interface ParleyInput {
  readonly isParleying: boolean;
  readonly target: Bargainable | null;
  readonly deltaMs: number;
}

/**
 * Where a Parley has got to this frame. `completed` is emitted on exactly one frame,
 * so the caller settles the cost once.
 */
export type ParleyStatus =
  | { readonly kind: 'inactive' }
  | { readonly kind: 'charging'; readonly target: Bargainable; readonly progress: number }
  | { readonly kind: 'completed'; readonly target: Bargainable };

const NO_PROGRESS = 0;
const FULL_PROGRESS = 1;

/**
 * The hold that settles a Parley. The player must keep the button down with the same
 * enemy inside the Sphere of Influence; letting go, or drifting onto a different
 * enemy, starts over. That exposure at reduced speed is the risk the mechanic trades
 * against (GDD 2.2.1).
 */
export class ParleySession {
  private target: Bargainable | null = null;
  private heldMs = NO_PROGRESS;

  public constructor(private readonly holdDurationMs: number) {}

  public update(input: ParleyInput): ParleyStatus {
    if (!input.isParleying || input.target === null) {
      this.reset();
      return { kind: 'inactive' };
    }

    if (input.target !== this.target) {
      this.target = input.target;
      this.heldMs = NO_PROGRESS;
    }

    this.heldMs += input.deltaMs;

    if (this.heldMs >= this.holdDurationMs) {
      const settled = input.target;
      this.reset();
      return { kind: 'completed', target: settled };
    }

    return {
      kind: 'charging',
      target: input.target,
      progress: Math.min(FULL_PROGRESS, this.heldMs / this.holdDurationMs),
    };
  }

  private reset(): void {
    this.target = null;
    this.heldMs = NO_PROGRESS;
  }
}
