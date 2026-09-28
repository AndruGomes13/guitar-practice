import { PitchDetector } from 'pitchy';
import { frequencyToMidi, mod12 } from './music';

/** Frequency range we accept: a bit below low E (82 Hz) up to past fret 22 on the high e. */
export const MIN_FREQUENCY = 70;
export const MAX_FREQUENCY = 1400;

export interface DetectionThresholds {
  /** Frames quieter than this (RMS amplitude) are treated as silence. */
  minRms: number;
  /** MPM "clarity" (0–1) below which a pitch estimate is ignored. */
  minClarity: number;
}

export type MicSensitivity = 'low' | 'medium' | 'high' | 'max';

/**
 * How loud (and how clean) a note must be to count. Higher sensitivity picks up
 * softer plucks but is more easily fooled by background noise.
 */
export const MIC_SENSITIVITY: Record<MicSensitivity, DetectionThresholds & { label: string }> = {
  low: { label: 'Low', minRms: 0.02, minClarity: 0.92 },
  medium: { label: 'Medium', minRms: 0.01, minClarity: 0.9 },
  high: { label: 'High', minRms: 0.005, minClarity: 0.88 },
  max: { label: 'Max', minRms: 0.0025, minClarity: 0.85 },
};

export const MIC_SENSITIVITY_ORDER: readonly MicSensitivity[] = ['low', 'medium', 'high', 'max'];

export interface Pitch {
  frequency: number;
  clarity: number;
  /** Nearest MIDI note. */
  midi: number;
  /** Deviation from `midi` in cents (-50..50). */
  cents: number;
}

export interface AudioFrame {
  rms: number;
  pitch: Pitch | null;
}

export function rootMeanSquare(buffer: ArrayLike<number>): number {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
  return Math.sqrt(sum / buffer.length);
}

/** Wraps the McLeod pitch method detector with guitar-specific filtering. */
export class PitchAnalyzer {
  private readonly detector: PitchDetector<Float32Array>;

  constructor(
    readonly bufferSize: number,
    public thresholds: DetectionThresholds = MIC_SENSITIVITY.medium,
  ) {
    this.detector = PitchDetector.forFloat32Array(bufferSize);
  }

  analyze(buffer: Float32Array, sampleRate: number): AudioFrame {
    const { minRms, minClarity } = this.thresholds;
    const rms = rootMeanSquare(buffer);
    if (rms < minRms) return { rms, pitch: null };

    const [frequency, clarity] = this.detector.findPitch(buffer, sampleRate);
    if (clarity < minClarity || frequency < MIN_FREQUENCY || frequency > MAX_FREQUENCY) {
      return { rms, pitch: null };
    }
    const exact = frequencyToMidi(frequency);
    const midi = Math.round(exact);
    return { rms, pitch: { frequency, clarity, midi, cents: (exact - midi) * 100 } };
  }
}

export interface StableNoteOptions {
  /** How long a note must hold steady before it counts as played. */
  stableMs: number;
  /** How long without a pitch before we consider the guitar silent again. */
  silenceMs: number;
}

/**
 * Turns a noisy stream of per-frame pitches into discrete "note played" events.
 *
 * A note is reported once it has held steady for `stableMs`, and only once per
 * pluck: it won't be reported again until the pitch changes or the guitar goes
 * quiet.
 */
export class StableNoteTracker {
  private candidate: number | null = null;
  private candidateSince = 0;
  private lastVoicedAt = Number.NEGATIVE_INFINITY;
  private reported: number | null = null;
  private ignoredPc: number | null = null;

  constructor(private readonly options: StableNoteOptions = { stableMs: 100, silenceMs: 150 }) {}

  /** Feeds one analysis frame. Returns a MIDI note when a new note is detected. */
  feed(pitch: Pitch | null, now: number): number | null {
    if (!pitch) {
      if (now - this.lastVoicedAt >= this.options.silenceMs) {
        this.candidate = null;
        this.reported = null;
        this.ignoredPc = null;
      }
      return null;
    }

    this.lastVoicedAt = now;
    if (pitch.midi !== this.candidate) {
      this.candidate = pitch.midi;
      this.candidateSince = now;
      return null;
    }
    if (now - this.candidateSince < this.options.stableMs || this.candidate === this.reported) {
      return null;
    }

    this.reported = this.candidate;
    if (this.ignoredPc !== null && mod12(this.candidate) === this.ignoredPc) return null;
    this.ignoredPc = null;
    return this.candidate;
  }

  /**
   * Ignores the note that is currently ringing (in any octave, to be robust to
   * octave errors) until the guitar goes quiet or a different note is played.
   * Call this when moving on to a new question so a still-ringing answer isn't
   * judged against the new question.
   */
  ignoreRingingNote(): void {
    const ringing = this.reported ?? this.candidate;
    this.ignoredPc = ringing === null ? null : mod12(ringing);
  }
}
