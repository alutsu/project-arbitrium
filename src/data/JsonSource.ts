/** Somewhere decoded JSON can be read by key, without knowing it is a Phaser cache. */
export interface JsonSource {
  read(key: string): unknown;
}
