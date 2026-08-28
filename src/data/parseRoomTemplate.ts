import { err, ok, type Result } from '../core/Result';
import { DIRECTIONS, type Direction } from '../dungeon/Direction';
import {
  ROOM_TAGS,
  type RoomExit,
  type RoomTag,
  type RoomTemplate,
  type RoomTemplateId,
} from '../dungeon/RoomTemplate';
import { isJsonRecord, type JsonRecord } from './JsonRecord';
import { readField } from './readField';

const TERRAIN_LAYER = 'terrain';
const META_LAYER = 'meta';
const EXIT_CLASS = 'exit';
const TAGS_PROPERTY = 'tags';
const DIRECTION_PROPERTY = 'direction';
const MIN_SIZE = 1;
const EMPTY = 0;

/**
 * Validates one Tiled map into a `RoomTemplate` (GDD 3.2.1).
 *
 * Tiled JSON is read here rather than through Phaser's tilemap loader so that room
 * data passes the same validation as every other data file: a cache read is untrusted
 * input (CLAUDE.md 2.3).
 */
export function parseRoomTemplate(raw: unknown, id: string): Result<RoomTemplate> {
  if (!isJsonRecord(raw)) {
    return err(`room "${id}" must contain an object`);
  }
  const at = (message: string): string => `room "${id}": ${message}`;

  const widthInTiles = readField.number(raw, 'width');
  if (!widthInTiles.ok) return err(at(widthInTiles.error));
  const heightInTiles = readField.number(raw, 'height');
  if (!heightInTiles.ok) return err(at(heightInTiles.error));
  const tileWidth = readField.number(raw, 'tilewidth');
  if (!tileWidth.ok) return err(at(tileWidth.error));
  const tileHeight = readField.number(raw, 'tileheight');
  if (!tileHeight.ok) return err(at(tileHeight.error));
  if (widthInTiles.value < MIN_SIZE || heightInTiles.value < MIN_SIZE) {
    return err(at('must be at least one tile across'));
  }

  const layers = raw['layers'];
  if (!Array.isArray(layers)) {
    return err(at('"layers" must be an array'));
  }

  const tiles = readTerrain(layers, widthInTiles.value * heightInTiles.value, at);
  if (!tiles.ok) return tiles;

  const exits = readExits(layers, { width: tileWidth.value, height: tileHeight.value }, at);
  if (!exits.ok) return exits;
  if (exits.value.length === EMPTY) {
    return err(at('needs at least one exit, or it cannot be reached'));
  }

  const tags = readTags(raw, at);
  if (!tags.ok) return tags;

  return ok({
    // Safe to brand: the caller derives the id from the file it loaded.
    id: id as RoomTemplateId,
    widthInTiles: widthInTiles.value,
    heightInTiles: heightInTiles.value,
    tileWidth: tileWidth.value,
    tileHeight: tileHeight.value,
    tiles: tiles.value,
    exits: exits.value,
    tags: tags.value,
  });
}

type Contextualize = (message: string) => string;

function readTerrain(
  layers: readonly unknown[],
  expectedTiles: number,
  at: Contextualize,
): Result<readonly number[]> {
  const layer = layers.find(
    (candidate) => isJsonRecord(candidate) && candidate['name'] === TERRAIN_LAYER,
  );
  if (!isJsonRecord(layer)) {
    return err(at(`needs a tile layer named "${TERRAIN_LAYER}"`));
  }
  const data = layer['data'];
  if (!Array.isArray(data)) {
    return err(at(`"${TERRAIN_LAYER}" must carry a "data" array`));
  }
  if (data.length !== expectedTiles) {
    return err(
      at(`"${TERRAIN_LAYER}" has ${String(data.length)} tiles, expected ${String(expectedTiles)}`),
    );
  }
  const tiles: number[] = [];
  for (const gid of data) {
    if (typeof gid !== 'number' || !Number.isInteger(gid)) {
      return err(at(`"${TERRAIN_LAYER}" contains a tile that is not a whole number`));
    }
    tiles.push(gid);
  }
  return ok(tiles);
}

interface TileSize {
  readonly width: number;
  readonly height: number;
}

function readExits(
  layers: readonly unknown[],
  tile: TileSize,
  at: Contextualize,
): Result<readonly RoomExit[]> {
  const layer = layers.find(
    (candidate) => isJsonRecord(candidate) && candidate['name'] === META_LAYER,
  );
  if (!isJsonRecord(layer)) {
    return err(at(`needs an object layer named "${META_LAYER}"`));
  }
  const objects = layer['objects'];
  if (!Array.isArray(objects)) {
    return err(at(`"${META_LAYER}" must carry an "objects" array`));
  }

  const exits: RoomExit[] = [];
  const seen = new Set<Direction>();
  for (const entry of objects) {
    if (!isJsonRecord(entry) || !isExitObject(entry)) {
      continue;
    }
    const direction = readObjectDirection(entry);
    if (direction === undefined) {
      return err(at(`an exit object is missing a valid "${DIRECTION_PROPERTY}" property`));
    }
    if (seen.has(direction)) {
      return err(at(`has two exits facing ${direction}`));
    }
    seen.add(direction);

    const x = entry['x'];
    const y = entry['y'];
    if (typeof x !== 'number' || typeof y !== 'number') {
      return err(at(`the ${direction} exit needs numeric coordinates`));
    }
    exits.push({
      direction,
      tileX: Math.floor(x / tile.width),
      tileY: Math.floor(y / tile.height),
    });
  }
  return ok(exits);
}

/** Tiled 1.9 renamed an object's `type` to `class`; accept either. */
function isExitObject(entry: JsonRecord): boolean {
  return entry['class'] === EXIT_CLASS || entry['type'] === EXIT_CLASS;
}

function readObjectDirection(entry: JsonRecord): Direction | undefined {
  const properties = entry['properties'];
  if (!Array.isArray(properties)) {
    return undefined;
  }
  for (const property of properties) {
    if (!isJsonRecord(property) || property['name'] !== DIRECTION_PROPERTY) {
      continue;
    }
    return DIRECTIONS.find((direction) => direction === property['value']);
  }
  return undefined;
}

function readTags(raw: JsonRecord, at: Contextualize): Result<readonly RoomTag[]> {
  const properties = raw['properties'];
  if (!Array.isArray(properties)) {
    return err(at(`needs a map property named "${TAGS_PROPERTY}"`));
  }
  for (const property of properties) {
    if (!isJsonRecord(property) || property['name'] !== TAGS_PROPERTY) {
      continue;
    }
    const value = property['value'];
    if (typeof value !== 'string' || value.length === EMPTY) {
      return err(at(`"${TAGS_PROPERTY}" must be a non-empty comma-separated string`));
    }
    return toTags(value, at);
  }
  return err(at(`needs a map property named "${TAGS_PROPERTY}"`));
}

function toTags(value: string, at: Contextualize): Result<readonly RoomTag[]> {
  const tags: RoomTag[] = [];
  for (const name of value.split(',')) {
    const tag = ROOM_TAGS.find((candidate) => candidate === name.trim());
    if (tag === undefined) {
      return err(at(`unknown tag "${name.trim()}"; allowed: ${ROOM_TAGS.join(', ')}`));
    }
    tags.push(tag);
  }
  return ok(tags);
}
