import { err, ok, type Result } from '../core/Result';
import type { JsonRecord } from './JsonRecord';

const MIN_ARRAY_LENGTH = 0;

/**
 * Field readers for untrusted JSON. Each returns a `Result` naming the offending
 * field, so a bad data file reports what is wrong rather than failing later as an
 * undefined at runtime (CLAUDE.md 2.3, 4.4).
 */
export const readField = {
  string(source: JsonRecord, key: string): Result<string> {
    const value = source[key];
    if (typeof value !== 'string' || value.length === MIN_ARRAY_LENGTH) {
      return err(`"${key}" must be a non-empty string`);
    }
    return ok(value);
  },

  number(source: JsonRecord, key: string): Result<number> {
    const value = source[key];
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return err(`"${key}" must be a finite number`);
    }
    return ok(value);
  },

  optionalNumber(source: JsonRecord, key: string): Result<number | undefined> {
    if (!(key in source)) {
      return ok(undefined);
    }
    return readField.number(source, key);
  },

  optionalBoolean(source: JsonRecord, key: string): Result<boolean | undefined> {
    if (!(key in source)) {
      return ok(undefined);
    }
    const value = source[key];
    if (typeof value !== 'boolean') {
      return err(`"${key}" must be a boolean`);
    }
    return ok(value);
  },

  oneOf<T extends string>(source: JsonRecord, key: string, allowed: readonly T[]): Result<T> {
    const value = source[key];
    const match = allowed.find((candidate) => candidate === value);
    if (match === undefined) {
      return err(`"${key}" must be one of ${allowed.join(', ')}`);
    }
    return ok(match);
  },

  arrayOf<T extends string>(source: JsonRecord, key: string, allowed: readonly T[]): Result<T[]> {
    const value = source[key];
    if (!Array.isArray(value)) {
      return err(`"${key}" must be an array`);
    }
    const parsed: T[] = [];
    for (const entry of value) {
      const match = allowed.find((candidate) => candidate === entry);
      if (match === undefined) {
        return err(`"${key}" contains an unknown value; allowed: ${allowed.join(', ')}`);
      }
      parsed.push(match);
    }
    return ok(parsed);
  },
};
