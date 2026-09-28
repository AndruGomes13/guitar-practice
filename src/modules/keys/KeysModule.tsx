import { useState } from 'react';
import { Chip, Field, Segmented, Sheet } from '../../components/controls';
import { ModuleNav } from '../../components/ModuleNav';
import { SummaryBar } from '../../components/SummaryBar';
import { resolveTab, type TabDef } from '../../components/tabs';
import { ALL_KEYS, keyById, keyLabel, MAJOR_KEYS, MINOR_KEYS } from '../../lib/keys';
import { usePersistentState } from '../../lib/usePersistentState';
import type { ModuleProps } from '../types';
import { Chart } from './Chart';
import { Progressions } from './Progressions';
import { Quiz } from './Quiz';
import {
  ALL_DEGREES,
  DEFAULT_KEY_SETTINGS,
  DEGREE_CHIP_LABELS,
  GUITAR_KEYS,
  PRIMARY_DEGREES,
  progressionItems,
  progressionKey,
  quizKey,
  type KeySettings,
} from './settings';

const TABS: TabDef[] = [
  { id: 'chart', label: 'Chart' },
  { id: 'quiz', label: 'Quiz' },
  { id: 'progressions', label: 'Progressions' },
];

const INTROS: Record<string, string> = {
  chart: 'The seven chords that belong to each key.',
  quiz: 'Name the chord for a numeral, or the numeral for a chord.',
  progressions: 'Fill in common progressions in a key.',
};

const ALL_KEY_IDS = ALL_KEYS.map((k) => k.id);

export default function KeysModule({ tab }: ModuleProps) {
  const active = resolveTab(TABS, tab);
  const [settings, setSettings] = usePersistentState<KeySettings>(
    'keys.settings',
    DEFAULT_KEY_SETTINGS,
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const openSettings = () => setSettingsOpen(true);

  const degreesSummary =
    settings.degrees.length === 7
      ? 'All degrees'
      : settings.degrees.map((d) => DEGREE_CHIP_LABELS[d]).join(' ');

  return (
    <>
      <ModuleNav moduleId="keys" tabs={TABS} active={active} onOpenSettings={openSettings} />
      <p className="muted intro">{INTROS[active]}</p>

      {active !== 'chart' ? (
        <SummaryBar
          tags={settings.keys.map((id) => keyLabel(keyById(id)))}
          meta={degreesSummary}
          onClick={openSettings}
        />
      ) : null}

      {active === 'chart' ? (
        <Chart majorVInMinor={settings.majorVInMinor} />
      ) : active === 'quiz' ? (
        <Quiz key={quizKey(settings)} settings={settings} />
      ) : progressionItems(settings).length > 0 ? (
        <Progressions key={progressionKey(settings)} settings={settings} />
      ) : (
        <div className="card empty-state">
          <p>None of the progressions fit the selected keys and degrees.</p>
          <button type="button" className="btn btn-primary" onClick={openSettings}>
            Change settings
          </button>
        </div>
      )}

      <Sheet open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Key practice">
        <KeySettingsForm settings={settings} onChange={setSettings} />
      </Sheet>
    </>
  );
}

/** Toggles `item` in `list`, keeping `order` and at least one item selected. */
function toggle<T>(list: readonly T[], item: T, on: boolean, order: readonly T[]): T[] {
  const next = order.filter((x) => (x === item ? on : list.includes(x)));
  return next.length > 0 ? next : [...list];
}

interface FormProps {
  settings: KeySettings;
  onChange: (settings: KeySettings) => void;
}

function KeySettingsForm({ settings, onChange }: FormProps) {
  const set = (patch: Partial<KeySettings>) => onChange({ ...settings, ...patch });
  const keyChip = (id: string, label: string) => {
    const checked = settings.keys.includes(id);
    return (
      <Chip
        key={id}
        checked={checked}
        disabled={checked && settings.keys.length === 1}
        onChange={(on) => set({ keys: toggle(settings.keys, id, on, ALL_KEY_IDS) })}
      >
        {label}
      </Chip>
    );
  };

  return (
    <div className="stack">
      <Field label="Keys" hint="Start with a few keys you play in, and add more over time.">
        <div className="key-group-label">Major</div>
        <div className="chip-row">{MAJOR_KEYS.map((k) => keyChip(k.id, keyLabel(k)))}</div>
        <div className="key-group-label">Minor</div>
        <div className="chip-row">{MINOR_KEYS.map((k) => keyChip(k.id, keyLabel(k)))}</div>
        <div className="preset-row">
          <button
            type="button"
            className="btn btn-ghost btn-small"
            onClick={() => set({ keys: GUITAR_KEYS })}
          >
            Guitar keys
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-small"
            onClick={() => set({ keys: MAJOR_KEYS.map((k) => k.id) })}
          >
            All major
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-small"
            onClick={() => set({ keys: ALL_KEY_IDS })}
          >
            All
          </button>
        </div>
      </Field>

      <Field
        label="Chords (scale degrees)"
        hint="I, IV and V are the most used; add the rest later."
      >
        <div className="chip-row">
          {DEGREE_CHIP_LABELS.map((label, degree) => {
            const checked = settings.degrees.includes(degree);
            return (
              <Chip
                key={degree}
                checked={checked}
                disabled={checked && settings.degrees.length === 1}
                onChange={(on) =>
                  set({ degrees: toggle(settings.degrees, degree, on, ALL_DEGREES) })
                }
              >
                {label}
              </Chip>
            );
          })}
        </div>
        <div className="preset-row">
          <button
            type="button"
            className="btn btn-ghost btn-small"
            onClick={() => set({ degrees: PRIMARY_DEGREES })}
          >
            I IV V
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-small"
            onClick={() => set({ degrees: ALL_DEGREES })}
          >
            All
          </button>
        </div>
      </Field>

      <Field label="Quiz asks for">
        <Segmented
          label="Quiz asks for"
          value={settings.ask}
          onChange={(ask) => set({ ask })}
          options={[
            { value: 'chord', label: 'The chord' },
            { value: 'numeral', label: 'The numeral' },
            { value: 'both', label: 'Both' },
          ]}
        />
      </Field>

      <Field
        label="Minor keys"
        hint="Songs in minor keys often borrow a major V from the harmonic minor scale."
      >
        <Chip checked={settings.majorVInMinor} onChange={(on) => set({ majorVInMinor: on })}>
          Major V (E in A minor)
        </Chip>
      </Field>
    </div>
  );
}
