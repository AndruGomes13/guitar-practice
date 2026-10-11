/**
 * Safari's Audio Session API (iOS 17+). By default iOS treats web audio as
 * "ambient", which the silent switch mutes; "playback" plays like a music app.
 * Recording needs "play-and-record".
 */
type AudioSessionType =
  'auto' | 'playback' | 'transient' | 'transient-solo' | 'ambient' | 'play-and-record';

function session(): { type: AudioSessionType } | undefined {
  return (navigator as Navigator & { audioSession?: { type: AudioSessionType } }).audioSession;
}

/** Lets synthesized notes play even with the phone on silent (unless the mic is in use). */
export function preferPlaybackSession(): void {
  const s = session();
  if (s && s.type !== 'play-and-record') s.type = 'playback';
}

export function setRecordingSession(recording: boolean): void {
  const s = session();
  if (s) s.type = recording ? 'play-and-record' : 'auto';
}
