import type Phaser from 'phaser';
import type { JsonSource } from './JsonSource';

/**
 * Reads decoded JSON out of Phaser's cache. The cache is typed `any`, so this is the
 * one place that widens it to `unknown` and hands it to a parser to prove.
 */
export class PhaserJsonSource implements JsonSource {
  public constructor(private readonly cache: Phaser.Cache.BaseCache) {}

  public read(key: string): unknown {
    const value: unknown = this.cache.get(key);
    return value;
  }
}
