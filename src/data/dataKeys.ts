interface DataKeys {
  readonly weapons: string;
  readonly upgrades: string;
  readonly playerStats: string;
}

/** Cache keys shared by the scene that loads the JSON and the code that parses it. */
export const DATA_KEYS: DataKeys = {
  weapons: 'weapons',
  upgrades: 'upgrades',
  playerStats: 'playerStats',
};
