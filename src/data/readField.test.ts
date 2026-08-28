import { describe, expect, it } from 'vitest';
import { readField } from './readField';

const ALLOWED = ['Ranged', 'Melee'] as const;

describe('readField', () => {
  it('accepts a non-empty string and rejects everything else', () => {
    expect(readField.string({ id: 'pistol' }, 'id')).toEqual({ ok: true, value: 'pistol' });
    expect(readField.string({ id: '' }, 'id').ok).toBe(false);
    expect(readField.string({ id: 7 }, 'id').ok).toBe(false);
    expect(readField.string({}, 'id').ok).toBe(false);
  });

  it('rejects non-finite numbers', () => {
    expect(readField.number({ n: 3.5 }, 'n')).toEqual({ ok: true, value: 3.5 });
    expect(readField.number({ n: Number.NaN }, 'n').ok).toBe(false);
    expect(readField.number({ n: Number.POSITIVE_INFINITY }, 'n').ok).toBe(false);
    expect(readField.number({ n: '3' }, 'n').ok).toBe(false);
  });

  it('treats an absent optional field as absent, but still validates a present one', () => {
    expect(readField.optionalNumber({}, 'n')).toEqual({ ok: true, value: undefined });
    expect(readField.optionalNumber({ n: 2 }, 'n')).toEqual({ ok: true, value: 2 });
    expect(readField.optionalNumber({ n: 'two' }, 'n').ok).toBe(false);
    expect(readField.optionalBoolean({}, 'b')).toEqual({ ok: true, value: undefined });
    expect(readField.optionalBoolean({ b: 'yes' }, 'b').ok).toBe(false);
  });

  it('constrains a value to the allowed set', () => {
    expect(readField.oneOf({ type: 'Melee' }, 'type', ALLOWED)).toEqual({
      ok: true,
      value: 'Melee',
    });
    expect(readField.oneOf({ type: 'Thrown' }, 'type', ALLOWED).ok).toBe(false);
  });

  it('rejects an array containing an unknown member', () => {
    expect(readField.arrayOf({ t: ['Melee'] }, 't', ALLOWED)).toEqual({
      ok: true,
      value: ['Melee'],
    });
    expect(readField.arrayOf({ t: ['Melee', 'Cursed'] }, 't', ALLOWED).ok).toBe(false);
    expect(readField.arrayOf({ t: 'Melee' }, 't', ALLOWED).ok).toBe(false);
  });

  it('names the offending field in the error', () => {
    const outcome = readField.number({ damage: 'lots' }, 'damage');
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.error).toContain('damage');
  });
});
