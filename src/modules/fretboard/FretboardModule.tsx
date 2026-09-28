import { useState } from 'react';
import { Chip, Field, Segmented, Sheet } from '../../components/controls';
import { ModuleNav } from '../../components/ModuleNav';
import { resolveTab, type TabDef } from '../../components/tabs';
import { MAX_FRET, STANDARD_TUNING } from '../../lib/guitar';
import { usePersistentState } from '../../lib/usePersistentState';
import type { ModuleProps } from '../types';
import { FindMode } from './FindMode';
import { NameMode } from './NameMode';
import { PlayMode } from './PlayMode';
import {
  DEFAULT_FRETBOARD_SETTINGS,
  noteTargets,
  positionTargets,
  type FretboardSettings,
} from './settings';

const TABS: TabDef[] = [
  { id: 'play', label: 'Play' },
  { id: 'find', label: 'Find' },
  { id: 'name', label: 'Name' },
];

const INTROS: Record<string, string> = {
  play: 'Play the note on your guitar. The microphone listens and checks it.',
  find: 'Tap the note on the neck. No guitar needed.',
  name: 'Name the highlighted note.',
};

export default function FretboardModule({ tab }: ModuleProps) {
  const active = resolveTab(TABS, tab);
  const [settings, setSettings] = usePersistentState<FretboardSettings>(
    'fretboard.settings',
    DEFAULT_FRETBOARD_SETTINGS,
  );
  const [settingsOpen, setSettingsOpen] = useState(false);

  const hasQuestions =
    active === 'name' ? positionTargets(settings).length > 0 : noteTargets(settings).length > 0;
  // Remount the exercise when settings change so it starts with a valid question.
  const key = JSON.stringify(settings);

  return (
    <>
      <ModuleNav
        moduleId="fretboard"
        tabs={TABS}
        active={active}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <p className="muted intro">{INTROS[active]}</p>

      {!hasQuestions ? (
        <div className="card empty-state">
          <p>No notes match these settings.</p>
          <button type="button" className="btn btn-primary" onClick={() => setSettingsOpen(true)}>
            Change settings
          </button>
        </div>
      ) : active === 'play' ? (
        <PlayMode key={key} settings={settings} />
      ) : active === 'find' ? (
        <FindMode key={key} settings={settings} />
      ) : (
        <NameMode key={key} settings={settings} />
      )}

      <Sheet open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Fretboard practice">
        <FretboardSettingsForm settings={settings} onChange={setSettings} />
      </Sheet>
    </>
  );
}

interface FormProps {
  settings: FretboardSettings;
  onChange: (settings: FretboardSettings) => void;
}

const fretOptions = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

function FretboardSettingsForm({ settings, onChange }: FormProps) {
  const set = (patch: Partial<FretboardSettings>) => onChange({ ...settings, ...patch });

  return (
    <div className="stack">
      <Field label="Strings">
        <div className="chip-row">
          {STANDARD_TUNING.map((s, i) => {
            const checked = settings.strings.includes(i);
            return (
              <Chip
                key={i}
                checked={checked}
                disabled={checked && settings.strings.length === 1}
                onChange={(on) =>
                  set({
                    strings: STANDARD_TUNING.map((_, j) => j).filter((j) =>
                      j === i ? on : settings.strings.includes(j),
                    ),
                  })
                }
              >
                {s.label}
              </Chip>
            );
          })}
        </div>
      </Field>

      <Field label="Frets">
        <div className="fret-range">
          <label>
            From
            <select
              value={settings.minFret}
              onChange={(e) => set({ minFret: Number(e.target.value) })}
            >
              {fretOptions(0, settings.maxFret).map((f) => (
                <option key={f} value={f}>
                  {f === 0 ? 'Open' : f}
                </option>
              ))}
            </select>
          </label>
          <label>
            To
            <select
              value={settings.maxFret}
              onChange={(e) => set({ maxFret: Number(e.target.value) })}
            >
              {fretOptions(Math.max(1, settings.minFret), MAX_FRET).map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Field>

      <Field label="Notes">
        <Segmented
          label="Notes"
          value={settings.naturalsOnly ? 'naturals' : 'all'}
          onChange={(v) => set({ naturalsOnly: v === 'naturals' })}
          options={[
            { value: 'naturals', label: 'Naturals only' },
            { value: 'all', label: 'All 12' },
          ]}
        />
      </Field>

      <Field label="Sharps / flats">
        <Segmented
          label="Sharps or flats"
          value={settings.spelling}
          onChange={(v) => set({ spelling: v })}
          options={[
            { value: 'sharp', label: '♯ Sharps' },
            { value: 'flat', label: '♭ Flats' },
            { value: 'both', label: 'Both' },
          ]}
        />
      </Field>

      <Field label="Ask for notes" hint="Used by Play and Find.">
        <Segmented
          label="Ask for notes"
          value={settings.scope}
          onChange={(v) => set({ scope: v })}
          options={[
            { value: 'anywhere', label: 'Anywhere' },
            { value: 'string', label: 'On a given string' },
          ]}
        />
      </Field>

      <Field label="After a correct note (Play)">
        <Chip checked={settings.showAnswer} onChange={(on) => set({ showAnswer: on })}>
          Show all its positions
        </Chip>
      </Field>
    </div>
  );
}
