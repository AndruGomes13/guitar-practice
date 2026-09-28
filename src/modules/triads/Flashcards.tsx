import { useEffect, useEffectEvent, useState } from 'react';
import { triadName, triadSymbol, type Triad } from '../../lib/music';
import { pickWeighted, recordResult, type StatsMap } from '../../lib/stats';
import { usePersistentState } from '../../lib/usePersistentState';
import type { TriadSettings } from './settings';
import { ToneList } from '../../components/ToneList';

const idOf = (t: Triad) => t.id;

interface Props {
  pool: readonly Triad[];
  front: TriadSettings['cardFront'];
}

/** Classic flashcards: think of the answer, flip, and be honest with yourself. */
export function Flashcards({ pool, front }: Props) {
  const [stats, setStats] = usePersistentState<StatsMap>('triads.stats.cards', {});
  const [card, setCard] = useState(() => pickWeighted(pool, idOf, stats));
  const [flipped, setFlipped] = useState(false);
  const [session, setSession] = useState({ known: 0, again: 0 });

  const grade = (knew: boolean) => {
    const newStats = recordResult(stats, card.id, knew);
    setStats(newStats);
    setSession((s) => (knew ? { ...s, known: s.known + 1 } : { ...s, again: s.again + 1 }));
    setCard(pickWeighted(pool, idOf, newStats, card.id));
    setFlipped(false);
  };

  // Keyboard: space/enter flips, 1 or ← = again, 2 or → = got it.
  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (e.target instanceof HTMLElement && e.target.closest('dialog, input, select')) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      setFlipped((f) => !f);
    } else if (flipped && (e.key === '1' || e.key === 'ArrowLeft')) {
      grade(false);
    } else if (flipped && (e.key === '2' || e.key === 'ArrowRight')) {
      grade(true);
    }
  });
  useEffect(() => {
    const handler = (e: KeyboardEvent) => onKey(e);
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const nameFace = (
    <>
      <div className="flashcard-main">{triadSymbol(card)}</div>
      <div className="flashcard-sub">{triadName(card)}</div>
    </>
  );
  const notesFace = <ToneList triad={card} />;

  return (
    <div className="stack">
      <div className="score-bar">
        <span>
          Got it <strong>{session.known}</strong>
        </span>
        <span>
          Again <strong>{session.again}</strong>
        </span>
      </div>

      <button
        type="button"
        className={`flashcard${flipped ? ' flipped' : ''}`}
        onClick={() => setFlipped((f) => !f)}
        aria-label={flipped ? 'Card back. Tap to flip.' : 'Card front. Tap to reveal.'}
      >
        <div className="flashcard-inner">
          <div className="flashcard-face flashcard-front">
            {front === 'name' ? nameFace : notesFace}
            <div className="flashcard-hint">
              {front === 'name' ? 'What notes make this chord?' : 'Which chord is this?'}
            </div>
          </div>
          <div className="flashcard-face flashcard-back">
            {front === 'name' ? (
              <>
                <div className="flashcard-sub">{triadName(card)}</div>
                {notesFace}
              </>
            ) : (
              <>
                {nameFace}
                <ToneList triad={card} size="small" />
              </>
            )}
          </div>
        </div>
      </button>

      {flipped ? (
        <div className="button-row">
          <button type="button" className="btn btn-danger" onClick={() => grade(false)}>
            Again
          </button>
          <button type="button" className="btn btn-success" onClick={() => grade(true)}>
            Got it
          </button>
        </div>
      ) : (
        <div className="button-row">
          <button type="button" className="btn btn-primary" onClick={() => setFlipped(true)}>
            Show answer
          </button>
        </div>
      )}
      <p className="muted center small keyboard-hint">
        Keyboard: Space to flip · 1 again · 2 got it
      </p>
    </div>
  );
}
