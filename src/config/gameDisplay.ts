interface GameDisplay {
  readonly width: number;
  readonly height: number;
  readonly backgroundColor: string;
  readonly parentElementId: string;
}

/**
 * Fixed logical resolution for the top-down view. The canvas is scaled to fit the
 * window, so gameplay code can treat these dimensions as constant world units.
 */
export const GAME_DISPLAY: GameDisplay = {
  width: 1280,
  height: 720,
  backgroundColor: '#101014',
  parentElementId: 'game-root',
};
