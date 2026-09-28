import { PitchAnalyzer, type AudioFrame } from '../lib/pitch';

const BUFFER_SIZE = 4096; // ~85 ms at 48 kHz: several periods of the low E string.
const ANALYSIS_INTERVAL_MS = 30;

type FrameListener = (frame: AudioFrame) => void;

/**
 * Captures the microphone and emits a pitch estimate roughly every 30 ms.
 * `start()` must be called from a user gesture (a click) so that mobile
 * browsers allow the audio context to run.
 */
export class MicPitchDetector {
  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private timer: number | undefined;
  private wakeLock: WakeLockSentinel | null = null;
  private stopped = false;
  private readonly listeners = new Set<FrameListener>();

  async start(): Promise<void> {
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      throw new Error(
        'Microphone access needs a secure connection. Open the app via https:// (or localhost on this computer).',
      );
    }

    // Create the context synchronously, while we're still inside the click handler.
    const ctx = new AudioContext();
    this.ctx = ctx;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    this.stream = stream;
    if (this.stopped) {
      this.release();
      throw new Error('Stopped');
    }

    const source = ctx.createMediaStreamSource(stream);
    // Guitar fundamentals top out around 1.2 kHz; filtering above that reduces noise.
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 1500;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = BUFFER_SIZE;
    source.connect(lowpass).connect(analyser);

    if (ctx.state === 'suspended') await ctx.resume();
    if (this.stopped) {
      this.release();
      throw new Error('Stopped');
    }

    const buffer = new Float32Array(analyser.fftSize);
    const pitchAnalyzer = new PitchAnalyzer(analyser.fftSize);
    this.timer = window.setInterval(() => {
      analyser.getFloatTimeDomainData(buffer);
      const frame = pitchAnalyzer.analyze(buffer, ctx.sampleRate);
      for (const listener of this.listeners) listener(frame);
    }, ANALYSIS_INTERVAL_MS);

    void this.requestWakeLock();
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  subscribe(listener: FrameListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  stop(): void {
    this.stopped = true;
    this.release();
  }

  private release(): void {
    window.clearInterval(this.timer);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    void this.ctx?.close().catch(() => {});
    this.ctx = null;
    void this.wakeLock?.release().catch(() => {});
    this.wakeLock = null;
    this.listeners.clear();
  }

  /** Keeps the phone screen on while practicing with the guitar in hand. */
  private async requestWakeLock(): Promise<void> {
    try {
      this.wakeLock = (await navigator.wakeLock?.request('screen')) ?? null;
    } catch {
      // Not supported or not allowed; not essential.
    }
  }

  private onVisibilityChange = () => {
    // Wake locks are released when the page is hidden; take it again on return.
    if (document.visibilityState === 'visible' && !this.stopped) void this.requestWakeLock();
  };
}
