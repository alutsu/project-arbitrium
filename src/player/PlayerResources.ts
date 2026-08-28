const MIN_GOLD = 0;
const MIN_SURVIVABLE_VITALITY = 1;

/**
 * The player's spendable resources. Immutable: paying returns a new instance rather
 * than mutating shared state (CLAUDE.md 4.2).
 */
export class PlayerResources {
  public constructor(
    public readonly gold: number,
    public readonly vitality: number,
  ) {}

  /** Gold demands are a fraction of what the player is carrying (GDD 4.1.2). */
  public spendGoldFraction(fraction: number): PlayerResources {
    const spent = Math.floor(this.gold * fraction);
    return new PlayerResources(Math.max(MIN_GOLD, this.gold - spent), this.vitality);
  }

  public loseVitality(damage: number): PlayerResources {
    return new PlayerResources(this.gold, this.vitality - damage);
  }

  /**
   * Whether the player would survive paying this much Vitality. A Parley is meant to
   * be 100% survival (GDD 8.3), so a demand that would kill is refused rather than
   * honoured.
   */
  public canSurviveVitalityCost(damage: number): boolean {
    return this.vitality - damage >= MIN_SURVIVABLE_VITALITY;
  }
}
