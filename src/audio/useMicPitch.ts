import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';
import type { AudioFrame } from '../lib/pitch';
import { MicPitchDetector } from './MicPitchDetector';

export type MicStatus = 'idle' | 'starting' | 'listening' | 'error';

/**
 * Microphone pitch detection as a hook. `onFrame` is called ~30 times a second
 * while listening and always sees the latest props/state.
 */
export function useMicPitch(onFrame: (frame: AudioFrame) => void) {
  const [detector, setDetector] = useState<MicPitchDetector | null>(null);
  const [status, setStatus] = useState<MicStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const pendingRef = useRef<MicPitchDetector | null>(null);
  const handleFrame = useEffectEvent(onFrame);

  useEffect(() => {
    if (!detector) return;
    const unsubscribe = detector.subscribe((frame) => handleFrame(frame));
    return () => {
      unsubscribe();
      detector.stop();
    };
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

  return { status, error, start, stop };
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
