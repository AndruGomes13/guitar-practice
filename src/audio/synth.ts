import { midiToFrequency } from '../lib/music';

let ctx: AudioContext | null = null;

function audioContext(): AudioContext {
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Synthesizes a plucked string with the Karplus–Strong algorithm. */
function pluckBuffer(ac: AudioContext, frequency: number, seconds = 2.5): AudioBuffer {
  const sampleRate = ac.sampleRate;
  const length = Math.floor(sampleRate * seconds);
  const buffer = ac.createBuffer(1, length, sampleRate);
  const out = buffer.getChannelData(0);
  // The two-point average below adds half a sample of delay.
  const period = Math.max(2, Math.round(sampleRate / frequency - 0.5));
  const ring = new Float32Array(period);
  let prev = 0;
  for (let i = 0; i < period; i++) {
    // Slightly low-passed noise burst sounds less harsh than raw white noise.
    prev = 0.5 * prev + 0.5 * (Math.random() * 2 - 1);
    ring[i] = prev;
  }
  let idx = 0;
  for (let i = 0; i < length; i++) {
    const next = idx + 1 === period ? 0 : idx + 1;
    const value = ring[idx];
    out[i] = value;
    ring[idx] = 0.996 * 0.5 * (value + ring[next]);
    idx = next;
  }
  return buffer;
}

/** Plays MIDI notes; `delays` are start offsets in seconds (defaults to all at once). */
export function playNotes(midis: readonly number[], delays: readonly number[] = []): void {
  const ac = audioContext();
  const start = ac.currentTime + 0.03;
  const master = ac.createGain();
  master.gain.value = 0.35;
  master.connect(ac.destination);
  midis.forEach((midi, i) => {
    const source = ac.createBufferSource();
    source.buffer = pluckBuffer(ac, midiToFrequency(midi));
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
