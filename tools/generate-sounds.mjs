/**
 * Generates the game's sound effects as WAV files.
 *
 * The repository ships no audio assets, so the effects are synthesised here rather than
 * committed as unexplained binaries: `npm run sounds` rebuilds every file from this
 * script. The noise source is a seeded generator, so regenerating produces byte-identical
 * output and never shows up as a spurious diff.
 *
 * Run with: npm run sounds
 */
import { writeFileSync } from 'node:fs';

const SAMPLE_RATE = 22050;
const BITS_PER_SAMPLE = 16;
const CHANNELS = 1;
const PEAK = 0x7fff;
const HEADROOM = 0.55;

/** Mulberry32, so the noise in these files is the same on every machine. */
const seededNoise = (seed) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let drawn = state;
    drawn = Math.imul(drawn ^ (drawn >>> 15), drawn | 1);
    drawn ^= drawn + Math.imul(drawn ^ (drawn >>> 7), drawn | 61);
    return (((drawn ^ (drawn >>> 14)) >>> 0) / 4294967296) * 2 - 1;
  };
};

const square = (phase) => (Math.sin(phase) >= 0 ? 1 : -1);
const triangle = (phase) => (2 / Math.PI) * Math.asin(Math.sin(phase));
const lerp = (from, to, amount) => from + (to - from) * amount;

/** Attack then exponential decay, which is what makes a blip read as a blip. */
const envelope = (progress, attack, curve) =>
  progress < attack ? progress / attack : Math.pow(1 - (progress - attack) / (1 - attack), curve);

/**
 * The voice is handed the running phase and returns both the sample and the frequency to
 * advance by. Passing the phase is the whole point: an earlier version accumulated it and
 * never handed it over, so every "tone" was a constant and every file was a dull thump.
 */
function render(durationSeconds, voice) {
  const total = Math.floor(SAMPLE_RATE * durationSeconds);
  const samples = new Int16Array(total);
  let phase = 0;
  for (let index = 0; index < total; index++) {
    const progress = index / total;
    const { value, frequency } = voice(progress, phase);
    phase += (2 * Math.PI * frequency) / SAMPLE_RATE;
    samples[index] = Math.max(-PEAK, Math.min(PEAK, Math.round(value * PEAK * HEADROOM)));
  }
  return samples;
}

/** One note out of a sequence of `count`, with its own envelope so it reads as a note. */
const stepOf = (progress, count) => {
  const index = Math.min(count - 1, Math.floor(progress * count));
  return { index, progress: progress * count - index };
};

function toWav(samples) {
  const dataBytes = samples.length * (BITS_PER_SAMPLE / 8);
  const buffer = Buffer.alloc(44 + dataBytes);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataBytes, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(CHANNELS, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE((SAMPLE_RATE * CHANNELS * BITS_PER_SAMPLE) / 8, 28);
  buffer.writeUInt16LE((CHANNELS * BITS_PER_SAMPLE) / 8, 32);
  buffer.writeUInt16LE(BITS_PER_SAMPLE, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataBytes, 40);
  for (let index = 0; index < samples.length; index++) {
    buffer.writeInt16LE(samples[index], 44 + index * 2);
  }
  return buffer;
}

const noise = seededNoise(20260828);

const effects = {
  /** Firing: a short descending chirp with a little grit. */
  shot: () =>
    render(0.08, (progress, phase) => ({
      frequency: lerp(900, 240, progress),
      value: (square(phase) * 0.7 + noise() * 0.3) * envelope(progress, 0.02, 2.6),
    })),

  /** A hit connecting: a dry noise smack. */
  hit: () =>
    render(0.06, (progress) => ({
      frequency: 300,
      value: noise() * envelope(progress, 0.01, 3.4),
    })),

  /** Something dying: a falling three-step figure with a noise tail. */
  kill: () =>
    render(0.3, (progress, phase) => {
      const step = stepOf(progress, 3);
      return {
        frequency: [660, 494, 330][step.index],
        value: (square(phase) * 0.6 + noise() * 0.2) * envelope(step.progress, 0.02, 1.8),
      };
    }),

  /** Taking a hit: low and unpleasant. */
  hurt: () =>
    render(0.24, (progress, phase) => ({
      frequency: lerp(220, 70, progress),
      value: (square(phase) * 0.8 + noise() * 0.2) * envelope(progress, 0.02, 1.6),
    })),

  /** A Parley settled: two rising tones, a deal struck. */
  bargain: () =>
    render(0.3, (progress, phase) => {
      const step = stepOf(progress, 2);
      return {
        frequency: [440, 660][step.index],
        value: triangle(phase) * envelope(step.progress, 0.06, 1.4),
      };
    }),

  /** Gold changing hands, at the pedestal or the Forge. */
  purchase: () =>
    render(0.22, (progress, phase) => {
      const step = stepOf(progress, 3);
      return {
        frequency: [523, 659, 784][step.index],
        value: triangle(phase) * envelope(step.progress, 0.03, 1.5),
      };
    }),
};

/**
 * Zero crossings per second, halved, approximates the pitch. Reported so a file that
 * came out as a silent or tuneless thump is obvious without listening to it.
 */
function approximateHz(samples) {
  let crossings = 0;
  for (let index = 1; index < samples.length; index++) {
    if (samples[index - 1] < 0 !== samples[index] < 0) crossings += 1;
  }
  return Math.round((crossings / 2 / (samples.length / SAMPLE_RATE)) * 1) || 0;
}

for (const [name, build] of Object.entries(effects)) {
  const samples = build();
  const wav = toWav(samples);
  writeFileSync(`public/audio/${name}.wav`, wav);
  const peak = samples.reduce((most, sample) => Math.max(most, Math.abs(sample)), 0);
  console.log(
    `${name.padEnd(9)} ${String(wav.length).padStart(6)} bytes  ` +
      `${(samples.length / SAMPLE_RATE).toFixed(2)}s  ~${String(approximateHz(samples)).padStart(4)}Hz  ` +
      `peak ${((peak / PEAK) * 100).toFixed(0)}%`,
  );
}
