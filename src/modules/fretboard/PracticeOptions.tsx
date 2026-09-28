import { Segmented } from '../../components/controls';
import { StringChips } from '../../components/guitarControls';
import type { FretboardSettings } from './settings';

interface Props {
  settings: FretboardSettings;
  onChange: (settings: FretboardSettings) => void;
  /** Play and Find can name the string to use; Name always shows a specific spot. */
  showScope: boolean;
}

/** The options you change most while practicing, kept on screen instead of in settings. */
export function PracticeOptions({ settings, onChange, showScope }: Props) {
  return (
    <div className="practice-options">
      {showScope ? (
        <Segmented
          label="Which string"
          value={settings.scope}
          onChange={(scope) => onChange({ ...settings, scope })}
          options={[
            { value: 'string', label: 'Tell me the string' },
            { value: 'anywhere', label: 'Any string' },
          ]}
        />
      ) : null}
      <div className="string-picker">
        <span className="string-picker-label">Strings</span>
        <StringChips
          value={settings.strings}
          onChange={(strings) => onChange({ ...settings, strings })}
        />
      </div>
    </div>
  );
}
