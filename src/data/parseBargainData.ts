import { err, ok, type Result } from '../core/Result';
import { BARGAIN_COST_KINDS, type BargainCost } from '../bargain/BargainCost';
import type { BargainData } from '../bargain/BargainData';
import { ENEMY_TIERS, type BargainDemand } from '../bargain/BargainDemand';
import type { BargainSettings } from '../bargain/BargainSettings';
import { isJsonRecord, type JsonRecord } from './JsonRecord';
import { readField } from './readField';

const MIN_MULTIPLIER = 1;
const MIN_DURATION_MS = 0;
const MIN_FRACTION = 0;
const MAX_FRACTION = 1;
const MIN_DAMAGE = 0;
const MIN_DEMANDS = 1;

/** Validates the contents of `bargain.json` (GDD 2.2.1, 4.1). */
export function parseBargainData(raw: unknown): Result<BargainData> {
  if (!isJsonRecord(raw)) {
    return err('bargain.json must contain an object');
  }

  const settings = parseSettings(raw);
  if (!settings.ok) return settings;

  const demandsRaw = raw['demands'];
  if (!Array.isArray(demandsRaw) || demandsRaw.length < MIN_DEMANDS) {
    return err('bargain.json: "demands" must be a non-empty array');
  }

  const demands: BargainDemand[] = [];
  for (const [index, entry] of demandsRaw.entries()) {
    const demand = parseDemand(entry, index);
    if (!demand.ok) return demand;
    demands.push(demand.value);
  }

  return ok({ settings: settings.value, demands });
}

function parseSettings(raw: JsonRecord): Result<BargainSettings> {
  const aggroDelayMs = readField.number(raw, 'aggroDelayMs');
  if (!aggroDelayMs.ok) return err(`bargain.json: ${aggroDelayMs.error}`);
  const lateCostMultiplier = readField.number(raw, 'lateCostMultiplier');
  if (!lateCostMultiplier.ok) return err(`bargain.json: ${lateCostMultiplier.error}`);
  const holdDurationMs = readField.number(raw, 'holdDurationMs');
  if (!holdDurationMs.ok) return err(`bargain.json: ${holdDurationMs.error}`);
  const sphereRadiusPixels = readField.number(raw, 'sphereRadiusPixels');
  if (!sphereRadiusPixels.ok) return err(`bargain.json: ${sphereRadiusPixels.error}`);
  const prideRoomsAffected = readField.number(raw, 'prideRoomsAffected');
  if (!prideRoomsAffected.ok) return err(`bargain.json: ${prideRoomsAffected.error}`);
  if (!Number.isInteger(prideRoomsAffected.value) || prideRoomsAffected.value < MIN_FRACTION) {
    return err('bargain.json: "prideRoomsAffected" must be a whole number of at least 0');
  }

  const vitalityForUnpayableGold = readField.number(raw, 'vitalityForUnpayableGold');
  if (!vitalityForUnpayableGold.ok) return err(`bargain.json: ${vitalityForUnpayableGold.error}`);
  if (vitalityForUnpayableGold.value <= MIN_DURATION_MS) {
    return err('bargain.json: "vitalityForUnpayableGold" must be greater than zero');
  }

  if (lateCostMultiplier.value < MIN_MULTIPLIER) {
    return err('bargain.json: "lateCostMultiplier" must be at least 1, or late is cheaper');
  }
  if (holdDurationMs.value <= MIN_DURATION_MS) {
    return err('bargain.json: "holdDurationMs" must be greater than zero');
  }
  if (sphereRadiusPixels.value <= MIN_DURATION_MS) {
    return err('bargain.json: "sphereRadiusPixels" must be greater than zero');
  }

  return ok({
    aggroDelayMs: aggroDelayMs.value,
    lateCostMultiplier: lateCostMultiplier.value,
    holdDurationMs: holdDurationMs.value,
    prideRoomsAffected: prideRoomsAffected.value,
    vitalityForUnpayableGold: vitalityForUnpayableGold.value,
    sphereRadiusPixels: sphereRadiusPixels.value,
  });
}

function parseDemand(entry: unknown, index: number): Result<BargainDemand> {
  if (!isJsonRecord(entry)) {
    return err(`bargain.json: demands[${String(index)}] must be an object`);
  }
  const at = (message: string): string => `bargain.json: demands[${String(index)}]: ${message}`;

  const tier = readField.oneOf(entry, 'tier', ENEMY_TIERS);
  if (!tier.ok) return err(at(tier.error));

  const costRaw = entry['cost'];
  if (!isJsonRecord(costRaw)) {
    return err(at('"cost" must be an object'));
  }
  const cost = parseCost(costRaw, at);
  if (!cost.ok) return cost;

  return ok({ tier: tier.value, cost: cost.value });
}

function parseCost(raw: JsonRecord, at: (message: string) => string): Result<BargainCost> {
  const kind = readField.oneOf(raw, 'kind', BARGAIN_COST_KINDS);
  if (!kind.ok) return err(at(kind.error));

  if (kind.value === 'Gold') {
    const fractionOfGold = readField.number(raw, 'fractionOfGold');
    if (!fractionOfGold.ok) return err(at(fractionOfGold.error));
    if (fractionOfGold.value <= MIN_FRACTION || fractionOfGold.value > MAX_FRACTION) {
      return err(at('"fractionOfGold" must be above 0 and at most 1'));
    }
    return ok({ kind: 'Gold', fractionOfGold: fractionOfGold.value });
  }

  if (kind.value === 'Pride') {
    const speedPenalty = readField.number(raw, 'speedPenalty');
    if (!speedPenalty.ok) return err(at(speedPenalty.error));
    if (speedPenalty.value <= MIN_FRACTION || speedPenalty.value >= MAX_FRACTION) {
      return err(at('"speedPenalty" must be above 0 and below 1, or the player cannot move'));
    }
    return ok({ kind: 'Pride', speedPenalty: speedPenalty.value });
  }

  const damage = readField.number(raw, 'damage');
  if (!damage.ok) return err(at(damage.error));
  if (damage.value <= MIN_DAMAGE) {
    return err(at('"damage" must be greater than zero'));
  }
  return ok({ kind: 'Vitality', damage: damage.value });
}
