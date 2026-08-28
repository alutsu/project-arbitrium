const MIN_GOLD = 0;
const MIN_VITALITY = 0;
const NOTHING = 0;

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

  /** Gold from selling a weapon at the pedestal (GDD 2.3.1). */
  public gainGold(amount: number): PlayerResources {
    return new PlayerResources(this.gold + amount, this.vitality);
  }

  public loseVitality(damage: number): PlayerResources {
    return new PlayerResources(this.gold, Math.max(MIN_VITALITY, this.vitality - damage));
  }

  /**
   * Whether this fraction of the purse is worth anything. An empty, or nearly empty,
   * purse pays nothing, so the demand is taken in Vitality instead (GDD 4.1.2).
   */
  public canPayGoldFraction(fraction: number): boolean {
    return Math.floor(this.gold * fraction) > NOTHING;
  }

  public get isDefeated(): boolean {
    return this.vitality <= MIN_VITALITY;
  }
}
