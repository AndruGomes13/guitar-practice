import { useMemo, useState } from 'react';
import { Chip, Field, Segmented, Sheet } from '../../components/controls';
import { ModuleNav } from '../../components/ModuleNav';
import { resolveTab, type TabDef } from '../../components/tabs';
import { TRIAD_QUALITIES, TRIAD_QUALITY_ORDER, triadPool } from '../../lib/music';
import { usePersistentState } from '../../lib/usePersistentState';
import type { ModuleProps } from '../types';
import { Build } from './Build';
import { Explore } from './Explore';
import { Flashcards } from './Flashcards';
import { DEFAULT_TRIAD_SETTINGS, type TriadSettings } from './settings';

const TABS: TabDef[] = [
  { id: 'explore', label: 'Explore' },
  { id: 'build', label: 'Build' },
  { id: 'cards', label: 'Flashcards' },
];

export default function TriadsModule({ tab }: ModuleProps) {
  const active = resolveTab(TABS, tab);
  const [settings, setSettings] = usePersistentState<TriadSettings>(
    'triads.settings',
    DEFAULT_TRIAD_SETTINGS,
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const pool = useMemo(
    () => triadPool(settings.qualities, { sharps: settings.sharpRoots, flats: settings.flatRoots }),
    [settings.qualities, settings.sharpRoots, settings.flatRoots],
  );
  // Remount the quiz when the chord pool changes so it picks a fresh chord.
  const poolKey = `${settings.qualities.join(',')}|${settings.sharpRoots}|${settings.flatRoots}`;
  // Without flat roots, label the piano's black keys as sharps only (C♯ rather than C♯/D♭).
  const spelling = settings.flatRoots ? 'both' : 'sharp';

  return (
    <>
      <ModuleNav
        moduleId="triads"
        tabs={TABS}
        active={active}
        onOpenSettings={active === 'explore' ? undefined : () => setSettingsOpen(true)}
      />
      {active === 'explore' && <Explore />}
      {active === 'build' && <Build key={poolKey} pool={pool} spelling={spelling} />}
      {active === 'cards' && <Flashcards key={poolKey} pool={pool} front={settings.cardFront} />}

      <Sheet open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Triad practice">
        <TriadSettingsForm settings={settings} onChange={setSettings} poolSize={pool.length} />
      </Sheet>
    </>
  );
}

interface FormProps {
  settings: TriadSettings;
  onChange: (settings: TriadSettings) => void;
  poolSize: number;
}

function TriadSettingsForm({ settings, onChange, poolSize }: FormProps) {
  return (
    <div className="stack">
      <Field label="Chord qualities" hint={`${poolSize} chords in the practice pool.`}>
        <div className="chip-row">
          {TRIAD_QUALITY_ORDER.map((q) => {
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
                    qualities: TRIAD_QUALITY_ORDER.filter((x) =>
                      x === q ? on : settings.qualities.includes(x),
                    ),
                  })
                }
              >
                {TRIAD_QUALITIES[q].label}
              </Chip>
            );
          })}
        </div>
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
