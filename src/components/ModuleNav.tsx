import { href } from '../router';
import { SettingsIcon } from './icons';
import type { TabDef } from './tabs';

interface Props {
  moduleId: string;
  tabs: readonly TabDef[];
  active: string;
  onOpenSettings?: () => void;
}

/** Tabs for switching between a module's practice modes, plus a settings button. */
export function ModuleNav({ moduleId, tabs, active, onOpenSettings }: Props) {
  return (
    <nav className="module-nav">
      <div className="tabs" role="tablist">
        {tabs.map((tab) => (
          <a
            key={tab.id}
            role="tab"
            aria-selected={tab.id === active}
            className={tab.id === active ? 'tab active' : 'tab'}
            href={href(moduleId, tab.id)}
          >
            {tab.label}
          </a>
        ))}
      </div>
      {onOpenSettings ? (
        <button
          type="button"
          className="icon-btn"
          aria-label="Practice settings"
          onClick={onOpenSettings}
        >
          <SettingsIcon />
        </button>
      ) : null}
    </nav>
  );
}
