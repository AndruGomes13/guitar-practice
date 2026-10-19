import { useMemo, useState } from 'react';
import { Chip, Field, Segmented, Sheet } from '../../components/controls';
import { ModuleNav } from '../../components/ModuleNav';
import { resolveTab, type TabDef } from '../../components/tabs';
import {
  CHORD_QUALITIES,
  CHORD_QUALITY_ORDER,
  SEVENTH_QUALITY_ORDER,
  TRIAD_QUALITY_ORDER,
  chordPool,
  type ChordQuality,
} from '../../lib/music';
import { usePersistentState } from '../../lib/usePersistentState';
import type { ModuleProps } from '../types';
import { Build } from './Build';
import { Explore } from './Explore';
import { Flashcards } from './Flashcards';
import { DEFAULT_CHORD_SETTINGS, type ChordSettings } from './settings';

const TABS: TabDef[] = [
  { id: 'explore', label: 'Explore' },
  { id: 'build', label: 'Build' },
  { id: 'cards', label: 'Flashcards' },
];

export default function ChordsModule({ tab }: ModuleProps) {
  const active = resolveTab(TABS, tab);
  const [settings, setSettings] = usePersistentState<ChordSettings>(
    'triads.settings',
    DEFAULT_CHORD_SETTINGS,
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const pool = useMemo(
    () => chordPool(settings.qualities, { sharps: settings.sharpRoots, flats: settings.flatRoots }),
    [settings.qualities, settings.sharpRoots, settings.flatRoots],
  );
  // Settings and stats keep their old "triads.*" storage keys so earlier progress carries over.
  // Remount the quiz when the chord pool changes so it picks a fresh chord.
  const poolKey = `${settings.qualities.join(',')}|${settings.sharpRoots}|${settings.flatRoots}`;
  // Without flat roots, label the piano's black keys as sharps only (C♯ rather than C♯/D♭).
  const spelling = settings.flatRoots ? 'both' : 'sharp';

  return (
    <>
      <ModuleNav
        moduleId="chords"
        tabs={TABS}
        active={active}
        onOpenSettings={active === 'explore' ? undefined : () => setSettingsOpen(true)}
      />
      {active === 'explore' && <Explore />}
      {active === 'build' && <Build key={poolKey} pool={pool} spelling={spelling} />}
      {active === 'cards' && <Flashcards key={poolKey} pool={pool} front={settings.cardFront} />}

      <Sheet open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Chord practice">
        <ChordSettingsForm settings={settings} onChange={setSettings} poolSize={pool.length} />
      </Sheet>
    </>
  );
}

interface FormProps {
  settings: ChordSettings;
  onChange: (settings: ChordSettings) => void;
  poolSize: number;
}

function ChordSettingsForm({ settings, onChange, poolSize }: FormProps) {
  const qualityChip = (q: ChordQuality) => {
    const checked = settings.qualities.includes(q);
    return (
      <Chip
        key={q}
        checked={checked}
        // Keep at least one quality selected.
        disabled={checked && settings.qualities.length === 1}
        onChange={(on) =>
          onChange({
            ...settings,
            qualities: CHORD_QUALITY_ORDER.filter((x) =>
              x === q ? on : settings.qualities.includes(x),
            ),
          })
        }
      >
        {CHORD_QUALITIES[q].label}
      </Chip>
    );
  };

  return (
    <div className="stack">
      <Field label="Triads" hint={`${poolSize} chords in the practice pool.`}>
        <div className="chip-row">{TRIAD_QUALITY_ORDER.map(qualityChip)}</div>
      </Field>
      <Field label="7th chords">
        <div className="chip-row">{SEVENTH_QUALITY_ORDER.map(qualityChip)}</div>
      </Field>
      <Field label="Roots">
        <div className="chip-row">
          <Chip checked disabled onChange={() => {}}>
            C D E F G A B
          </Chip>
          <Chip
            checked={settings.sharpRoots}
            onChange={(on) => onChange({ ...settings, sharpRoots: on })}
          >
            ♯ Sharps (C♯, F♯…)
          </Chip>
          <Chip
            checked={settings.flatRoots}
            onChange={(on) => onChange({ ...settings, flatRoots: on })}
          >
            ♭ Flats (B♭, E♭…)
          </Chip>
        </div>
      </Field>
      <Field label="Flashcard front">
        <Segmented
          label="Flashcard front"
          value={settings.cardFront}
          onChange={(v) => onChange({ ...settings, cardFront: v })}
          options={[
            { value: 'name', label: 'Chord name' },
            { value: 'notes', label: 'Notes' },
          ]}
        />
      </Field>
    </div>
  );
}
