import type { Direction } from '../lib/intervals';
import { midiToFrequency } from '../lib/music';
import { synthesizePluck } from '../lib/pluck';

let ctx: AudioContext | null = null;
let current: GainNode | null = null;

function audioContext(): AudioContext {
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Plays MIDI notes; `delays` are start offsets in seconds (defaults to all at once). */
export function playNotes(midis: readonly number[], delays: readonly number[] = []): void {
  const ac = audioContext();
  const start = ac.currentTime + 0.03;

  // Fade out whatever is still ringing so replays don't pile up.
  if (current) {
    const previous = current;
    previous.gain.setTargetAtTime(0, ac.currentTime, 0.03);
    window.setTimeout(() => previous.disconnect(), 300);
  }
  const master = ac.createGain();
  master.gain.value = 0.35;
  master.connect(ac.destination);
  current = master;

  midis.forEach((midi, i) => {
    const samples = synthesizePluck(midiToFrequency(midi), ac.sampleRate, 2.5);
    const buffer = ac.createBuffer(1, samples.length, ac.sampleRate);
    buffer.getChannelData(0).set(samples);
    const source = ac.createBufferSource();
    source.buffer = buffer;
    source.connect(master);
    source.start(start + (delays[i] ?? 0));
  });
}

/** Arpeggiates the notes, then strums them together. */
export function playArpeggioThenChord(midis: readonly number[]): void {
  const n = midis.length;
  const arpeggio = midis.map((_, i) => i * 0.4);
  const strum = midis.map((_, i) => n * 0.4 + 0.3 + i * 0.03);
  playNotes([...midis, ...midis], [...arpeggio, ...strum]);
}

/** Strums each chord in turn, `gap` seconds apart. */
export function playChords(chords: readonly (readonly number[])[], gap = 0.9): void {
  const notes: number[] = [];
  const delays: number[] = [];
  chords.forEach((chord, i) =>
    chord.forEach((midi, j) => {
      notes.push(midi);
      delays.push(i * gap + j * 0.03);
    }),
  );
  playNotes(notes, delays);
}

/** Plays two notes one after the other, or together. */
export function playInterval(first: number, second: number, direction: Direction): void {
  playNotes([first, second], direction === 'together' ? [0, 0] : [0, 0.75]);
}
