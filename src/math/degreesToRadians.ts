const DEGREES_IN_HALF_TURN = 180;

/** Degrees are what the data files use; radians are what the maths and Phaser use. */
export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / DEGREES_IN_HALF_TURN;
}
