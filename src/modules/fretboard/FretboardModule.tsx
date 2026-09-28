import { useState } from 'react';
import { Chip, Field, Segmented, Sheet } from '../../components/controls';
import { FretRange } from '../../components/guitarControls';
import { ModuleNav } from '../../components/ModuleNav';
import { resolveTab, type TabDef } from '../../components/tabs';
import { MIC_SENSITIVITY, MIC_SENSITIVITY_ORDER } from '../../lib/pitch';
import { usePersistentState } from '../../lib/usePersistentState';
import type { ModuleProps } from '../types';
import { FindMode } from './FindMode';
import { NameMode } from './NameMode';
import { PlayMode } from './PlayMode';
import { PracticeOptions } from './PracticeOptions';
import {
  DEFAULT_FRETBOARD_SETTINGS,
  noteTargets,
  positionTargets,
  questionKey,
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
  // Restart the exercise when the possible questions change, so it starts with a valid one.
  // Play handles this itself so the mic stays on. Find also restarts on the string toggle,
  // because that changes the set of places to tap.
  const key = questionKey(settings);

  return (
    <>
      <ModuleNav
        moduleId="fretboard"
        tabs={TABS}
        active={active}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <p className="muted intro">{INTROS[active]}</p>
      <PracticeOptions settings={settings} onChange={setSettings} showScope={active !== 'name'} />

      {!hasQuestions ? (
        <div className="card empty-state">
          <p>No notes match these settings.</p>
          <button type="button" className="btn btn-primary" onClick={() => setSettingsOpen(true)}>
            Change settings
          </button>
        </div>
      ) : active === 'play' ? (
        <PlayMode settings={settings} />
      ) : active === 'find' ? (
        <FindMode key={`${key}|${settings.scope}`} settings={settings} />
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

function FretboardSettingsForm({ settings, onChange }: FormProps) {
  const set = (patch: Partial<FretboardSettings>) => onChange({ ...settings, ...patch });

  return (
    <div className="stack">
      <Field label="Frets">
        <FretRange
          minFret={settings.minFret}
          maxFret={settings.maxFret}
          onChange={(minFret, maxFret) => set({ minFret, maxFret })}
        />
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

      <Field
        label="Mic sensitivity (Play)"
        hint="How loud a pluck must be to count. The line on the level meter shows the threshold; if soft plucks are missed, go higher. If noise gets picked up, go lower."
      >
        <Segmented
          label="Mic sensitivity"
          value={settings.micSensitivity}
          onChange={(v) => set({ micSensitivity: v })}
          options={MIC_SENSITIVITY_ORDER.map((level) => ({
            value: level,
            label: MIC_SENSITIVITY[level].label,
          }))}
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
