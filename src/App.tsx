import { useEffect, useState } from 'react';
import { Nav } from './components/Nav';
import { Home } from './pages/Home';
import { Labour } from './pages/Labour';
import { Outgoings } from './pages/Outgoings';
import { Payback } from './pages/Payback';
import { Revenue } from './pages/Revenue';
import { Settings } from './pages/Settings';
import { Startup } from './pages/Startup';
import { loadState, saveState } from './store';
import type { AppState, Preview, TabId } from './types';
import { defaultPreview } from './types';

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [tab, setTab] = useState<TabId>('home');
  const [preview, setPreview] = useState<Preview>(() => defaultPreview(loadState()));

  useEffect(() => {
    saveState(state);
    document.documentElement.dataset.theme = state.theme;
  }, [state]);

  return (
    <div className="app">
      <Nav tab={tab} onTab={setTab} />
      <main className="stage">
        {tab === 'home' && <Home state={state} preview={preview} setPreview={setPreview} />}
        {tab === 'startup' && <Startup state={state} setState={setState} />}
        {tab === 'outgoings' && <Outgoings state={state} setState={setState} />}
        {tab === 'labour' && <Labour state={state} setState={setState} />}
        {tab === 'revenue' && <Revenue state={state} setState={setState} />}
        {tab === 'payback' && <Payback state={state} setState={setState} />}
        {tab === 'settings' && <Settings state={state} setState={setState} />}
        <p className="footer-note">
          Roma Deli Cafe planner · local only · seed 30 Aug 2026 (Darwin) · figures in AUD (en-AU).
          Extra helpers are labelled as assumptions.
        </p>
      </main>
    </div>
  );
}
