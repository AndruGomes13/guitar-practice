import { useState } from 'react';
import { Chip, Field, Segmented, Sheet } from '../../components/controls';
import { FretRange, StringChips } from '../../components/guitarControls';
import { ModuleNav } from '../../components/ModuleNav';
import { resolveTab, type TabDef } from '../../components/tabs';
import { DIRECTION_LABELS, INTERVALS, intervalInfo, type Direction } from '../../lib/intervals';
import { usePersistentState } from '../../lib/usePersistentState';
import type { ModuleProps } from '../types';
import { EarIntervals } from './EarIntervals';
import { FretboardIntervals } from './FretboardIntervals';
import {
  ALL_INTERVALS,
  BEGINNER_INTERVALS,
  boardItems,
  boardKey,
  DEFAULT_INTERVAL_SETTINGS,
  earKey,
  HAND_SPAN,
  type BoardDirection,
  type IntervalSettings,
} from './settings';

const TABS: TabDef[] = [
  { id: 'board', label: 'Fretboard' },
  { id: 'ear', label: 'Ear' },
];

const INTROS: Record<string, string> = {
  board: 'Name the interval from the root (R) to the other note.',
  ear: 'Listen to two notes and name the interval.',
};

export default function IntervalsModule({ tab }: ModuleProps) {
  const active = resolveTab(TABS, tab) as 'board' | 'ear';
  const [settings, setSettings] = usePersistentState<IntervalSettings>(
    'intervals.settings',
    DEFAULT_INTERVAL_SETTINGS,
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const openSettings = () => setSettingsOpen(true);

  const directions = active === 'board' ? settings.boardDirections : settings.earDirections;
  const hasQuestions = active === 'ear' || boardItems(settings).length > 0;

  return (
    <>
      <ModuleNav moduleId="intervals" tabs={TABS} active={active} onOpenSettings={openSettings} />
      <p className="muted intro">{INTROS[active]}</p>

      <button type="button" className="summary-bar" onClick={openSettings}>
        <span className="summary-tags">
          {settings.intervals.map((s) => (
            <span key={s} className="tag">
              {intervalInfo(s).short}
            </span>
          ))}
        </span>
        <span className="summary-meta">
          {directions.map((d) => DIRECTION_LABELS[d]).join(' · ')}
          <span className="summary-edit">Change</span>
        </span>
      </button>

      {!hasQuestions ? (
        <div className="card empty-state">
          <p>None of these intervals fit on the selected strings and frets.</p>
          <button type="button" className="btn btn-primary" onClick={openSettings}>
            Change settings
          </button>
        </div>
      ) : active === 'board' ? (
        <FretboardIntervals key={boardKey(settings)} settings={settings} />
      ) : (
        <EarIntervals key={earKey(settings)} settings={settings} />
      )}

      <Sheet open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Interval practice">
        <IntervalSettingsForm settings={settings} onChange={setSettings} mode={active} />
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
  settings: IntervalSettings;
  onChange: (settings: IntervalSettings) => void;
  mode: 'board' | 'ear';
}

const BOARD_DIRECTIONS: BoardDirection[] = ['up', 'down'];
const EAR_DIRECTIONS: Direction[] = ['up', 'down', 'together'];

function IntervalSettingsForm({ settings, onChange, mode }: FormProps) {
  const set = (patch: Partial<IntervalSettings>) => onChange({ ...settings, ...patch });
  const only = (list: readonly unknown[], item: unknown) => list.length === 1 && list[0] === item;

  return (
    <div className="stack">
      <Field label="Intervals" hint="Start with a few, and add more as they get easy.">
        <div className="chip-row">
          {INTERVALS.map(({ semitones, short, name }) => {
            const checked = settings.intervals.includes(semitones);
            return (
              <Chip
                key={semitones}
                checked={checked}
                disabled={checked && only(settings.intervals, semitones)}
                onChange={(on) =>
                  set({ intervals: toggle(settings.intervals, semitones, on, ALL_INTERVALS) })
                }
              >
                <span title={name}>{short}</span>
              </Chip>
            );
          })}
        </div>
        <div className="preset-row">
          <button
            type="button"
            className="btn btn-ghost btn-small"
            onClick={() => set({ intervals: BEGINNER_INTERVALS })}
          >
            Beginner set
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-small"
            onClick={() => set({ intervals: ALL_INTERVALS })}
          >
            All
          </button>
        </div>
      </Field>

      {mode === 'board' ? (
        <>
          <Field label="Direction">
            <div className="chip-row">
              {BOARD_DIRECTIONS.map((d) => {
                const checked = settings.boardDirections.includes(d);
                return (
                  <Chip
                    key={d}
                    checked={checked}
                    disabled={checked && only(settings.boardDirections, d)}
                    onChange={(on) =>
                      set({
                        boardDirections: toggle(settings.boardDirections, d, on, BOARD_DIRECTIONS),
                      })
                    }
                  >
                    {d === 'up' ? '↑ Up' : '↓ Down'}
                  </Chip>
                );
              })}
            </div>
          </Field>
          <Field label="Shape size">
            <Segmented
              label="Shape size"
              value={settings.span}
              onChange={(span) => set({ span })}
              options={[
                { value: 'hand', label: `Within ${HAND_SPAN} frets` },
                { value: 'neck', label: 'Anywhere' },
              ]}
            />
          </Field>
          <Field label="Strings">
            <StringChips value={settings.strings} onChange={(strings) => set({ strings })} />
          </Field>
          <Field label="Frets">
            <FretRange
              minFret={settings.minFret}
              maxFret={settings.maxFret}
              onChange={(minFret, maxFret) => set({ minFret, maxFret })}
            />
          </Field>
          <Field label="Labels" hint="Off: the notes show as R and ? until you answer.">
            <Chip checked={settings.showNoteNames} onChange={(on) => set({ showNoteNames: on })}>
              Show note names
            </Chip>
          </Field>
        </>
      ) : (
        <Field label="Play the notes">
          <div className="chip-row">
            {EAR_DIRECTIONS.map((d) => {
              const checked = settings.earDirections.includes(d);
              return (
                <Chip
                  key={d}
                  checked={checked}
                  disabled={checked && only(settings.earDirections, d)}
                  onChange={(on) =>
                    set({ earDirections: toggle(settings.earDirections, d, on, EAR_DIRECTIONS) })
                  }
                >
                  {DIRECTION_LABELS[d]}
                </Chip>
              );
            })}
          </div>
        </Field>
      )}
    </div>
  );
}
