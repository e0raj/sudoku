/**
 * audio.js — sound effects synthesised with the Web Audio API.
 *
 * Nothing is downloaded: every effect is a short oscillator with an envelope,
 * so the whole soundscape costs a couple of kilobytes.
 */

const MASTER_VOLUME = 0.16;

let context = null;
let masterGain = null;
let muted = false;

/** Creates the audio graph on first use (browsers require a user gesture). */
function ensureContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!context) {
    context = new AudioContextClass();
    masterGain = context.createGain();
    masterGain.gain.value = MASTER_VOLUME;
    masterGain.connect(context.destination);
  }

  if (context.state === 'suspended') {
    context.resume().catch(() => {});
  }

  return context;
}

/**
 * Plays one short tone.
 * @param {object} options
 * @param {number} options.frequency   starting frequency in Hz
 * @param {number} [options.endFrequency] frequency to glide to
 * @param {number} [options.duration]  length in seconds
 * @param {OscillatorType} [options.type] waveform
 * @param {number} [options.delay]     offset from now, in seconds
 * @param {number} [options.volume]    peak gain, 0–1
 */
function tone({ frequency, endFrequency, duration = 0.12, type = 'sine', delay = 0, volume = 0.4 }) {
  if (muted) return;

  const ctx = ensureContext();
  if (!ctx || !masterGain) return;

  const start = ctx.currentTime + delay;
  const stop = start + duration;
  const oscillator = ctx.createOscillator();
  const envelope = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  if (endFrequency) {
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, stop);
  }

  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  envelope.gain.exponentialRampToValueAtTime(0.0001, stop);

  oscillator.connect(envelope).connect(masterGain);
  oscillator.start(start);
  oscillator.stop(stop + 0.02);
}

const SOUNDS = {
  /** Correct digit dropped into a cell. */
  place: () => tone({ frequency: 620, endFrequency: 780, duration: 0.09, volume: 0.32 }),

  /** Pencil note added or removed. */
  note: () => tone({ frequency: 900, duration: 0.045, volume: 0.16 }),

  /** Cell cleared. */
  erase: () => tone({ frequency: 340, endFrequency: 210, duration: 0.09, volume: 0.22 }),

  /** Wrong digit: a soft, low buzz rather than a harsh alarm. */
  error: () => {
    tone({ frequency: 210, endFrequency: 150, duration: 0.2, type: 'triangle', volume: 0.3 });
    tone({ frequency: 158, endFrequency: 120, duration: 0.24, type: 'sine', delay: 0.03, volume: 0.16 });
  },

  /** Hint revealed. */
  hint: () => {
    tone({ frequency: 660, duration: 0.1, volume: 0.22 });
    tone({ frequency: 990, duration: 0.16, delay: 0.09, volume: 0.2 });
  },

  /** Undo. */
  undo: () => tone({ frequency: 470, endFrequency: 350, duration: 0.09, volume: 0.2 }),

  /** New puzzle. */
  start: () => {
    tone({ frequency: 440, duration: 0.09, volume: 0.2 });
    tone({ frequency: 660, duration: 0.13, delay: 0.08, volume: 0.2 });
  },

  /** Solved: a rising major arpeggio. */
  win: () => {
    [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
      tone({ frequency, duration: 0.3, type: 'triangle', delay: index * 0.1, volume: 0.26 });
    });
  },

  /** Out of mistakes: a short descending figure. */
  lose: () => {
    [392, 311.13, 233.08].forEach((frequency, index) => {
      tone({ frequency, duration: 0.28, type: 'triangle', delay: index * 0.12, volume: 0.24 });
    });
  },
};

/** Plays a named effect. Unknown names are ignored. */
export function play(name) {
  const sound = SOUNDS[name];
  if (sound) sound();
}

/** Warms up the audio context — call from the first user gesture. */
export function unlock() {
  if (!muted) ensureContext();
}

export function setMuted(value) {
  muted = Boolean(value);
}

export function isMuted() {
  return muted;
}
