import { Suspense } from 'react';
import { BackIcon, ChevronRightIcon } from './components/icons';
import { MODULES } from './modules/registry';
import { href, useRoute } from './router';

export default function App() {
  const [moduleId, tab] = useRoute();
  const current = MODULES.find((m) => m.id === moduleId);
  const ModuleComponent = current?.component;

  return (
    <div className="app">
      <header className="topbar">
        {current ? (
          <a className="icon-btn" href={href()} aria-label="Back to all exercises">
            <BackIcon />
          </a>
        ) : null}
        <h1>{current ? current.title : 'Guitar Practice'}</h1>
      </header>
      <main className="content">
        {ModuleComponent ? (
          <Suspense fallback={<p className="muted center">Loading…</p>}>
            <ModuleComponent tab={tab} />
          </Suspense>
        ) : (
          <Home />
        )}
      </main>
    </div>
  );
}

function Home() {
  return (
    <div className="stack">
      <p className="muted intro">Pick something to practice.</p>
      <div className="module-grid">
        {MODULES.map(({ id, title, description, icon: Icon }) => (
          <a key={id} className="module-card" href={href(id)}>
            <span className="module-card-icon">
              <Icon width={28} height={28} />
            </span>
            <span className="module-card-text">
              <span className="module-card-title">{title}</span>
              <span className="module-card-desc">{description}</span>
            </span>
            <ChevronRightIcon className="module-card-chevron" />
          </a>
        ))}
      </div>
    </div>
  );
}
