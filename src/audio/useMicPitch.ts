import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';
import type { AudioFrame } from '../lib/pitch';
import { MicPitchDetector } from './MicPitchDetector';

export type MicStatus = 'idle' | 'starting' | 'listening' | 'error';

export type MicControls = ReturnType<typeof useMicPitch>;

/**
 * Owns the microphone. Keep this high enough in the tree that the mic survives
 * the exercise below it restarting; read frames with `useMicFrames`.
 */
export function useMicPitch() {
  const [detector, setDetector] = useState<MicPitchDetector | null>(null);
  const [status, setStatus] = useState<MicStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const pendingRef = useRef<MicPitchDetector | null>(null);

  useEffect(() => {
    if (!detector) return;
    return () => detector.stop();
  }, [detector]);

  // If we unmount while the permission prompt is still open, stop that detector too.
  useEffect(() => () => pendingRef.current?.stop(), []);

  const start = useCallback(async () => {
    const next = new MicPitchDetector();
    pendingRef.current?.stop();
    pendingRef.current = next;
    setStatus('starting');
    setError(null);
    try {
      await next.start();
      if (pendingRef.current !== next) return;
      pendingRef.current = null;
      setDetector(next);
      setStatus('listening');
    } catch (e) {
      next.stop();
      if (pendingRef.current !== next) return;
      pendingRef.current = null;
      setStatus('error');
      setError(describeError(e));
    }
  }, []);

  const stop = useCallback(() => {
    pendingRef.current?.stop();
    pendingRef.current = null;
    setDetector(null);
    setStatus('idle');
  }, []);

  return { detector, status, error, start, stop };
}

/** Calls `onFrame` ~30 times a second while the mic is listening; it always sees the latest props/state. */
export function useMicFrames(
  detector: MicPitchDetector | null,
  onFrame: (frame: AudioFrame) => void,
) {
  const handleFrame = useEffectEvent(onFrame);
  useEffect(() => {
    if (!detector) return;
    return detector.subscribe((frame) => handleFrame(frame));
  }, [detector]);
}

function describeError(e: unknown): string {
  if (e instanceof DOMException) {
    if (e.name === 'NotAllowedError') {
      return 'Microphone permission was denied. Allow it in your browser’s site settings and try again.';
    }
    if (e.name === 'NotFoundError') return 'No microphone was found.';
  }
  return e instanceof Error ? e.message : 'Could not start the microphone.';
}
