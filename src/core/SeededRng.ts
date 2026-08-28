import type { Rng } from './Rng';

const MULBERRY_INCREMENT = 0x6d2b79f5;
const MULBERRY_SHIFT_A = 15;
const MULBERRY_SHIFT_B = 7;
const MULBERRY_SHIFT_C = 14;
const MULBERRY_MULTIPLIER_A = 1;
const MULBERRY_MULTIPLIER_B = 61;
const UINT32 = 4294967296;
const EMPTY = 0;

/**
 * Mulberry32. Small, fast, and good enough for level layout; the property that matters
 * is that a seed always replays the same sequence (CLAUDE.md 6).
 */
export class SeededRng implements Rng {
  private state: number;

  public constructor(seed: number) {
    this.state = seed >>> 0;
  }

  public nextInt(exclusiveMax: number): number {
    if (exclusiveMax <= EMPTY) {
      throw new Error(`Cannot draw a random number below ${String(exclusiveMax)}`);
    }
    return Math.floor(this.nextFloat() * exclusiveMax);
  }

  private nextFloat(): number {
    this.state = (this.state + MULBERRY_INCREMENT) >>> 0;
    let drawn = this.state;
    drawn = Math.imul(drawn ^ (drawn >>> MULBERRY_SHIFT_A), drawn | MULBERRY_MULTIPLIER_A);
    drawn ^= drawn + Math.imul(drawn ^ (drawn >>> MULBERRY_SHIFT_B), drawn | MULBERRY_MULTIPLIER_B);
    return ((drawn ^ (drawn >>> MULBERRY_SHIFT_C)) >>> 0) / UINT32;
  }
}
