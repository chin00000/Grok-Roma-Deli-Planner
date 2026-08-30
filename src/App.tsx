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

function isEntryInput(el: EventTarget | null): el is HTMLInputElement {
  if (!(el instanceof HTMLInputElement)) return false;
  if (el.readOnly || el.disabled) return false;
  const type = (el.type || 'text').toLowerCase();
  if (type === 'checkbox' || type === 'radio' || type === 'file' || type === 'hidden' || type === 'button') {
    return false;
  }
  if (el.classList.contains('cell')) return true;
  return type === 'number' || type === 'text' || type === 'search';
}

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [tab, setTab] = useState<TabId>('home');
  const [preview, setPreview] = useState<Preview>(() => defaultPreview(loadState()));

  useEffect(() => {
    saveState(state);
    document.documentElement.dataset.theme = state.theme;
  }, [state]);

  useEffect(() => {
    let justFocused: HTMLInputElement | null = null;

    function onFocusIn(e: FocusEvent) {
      if (!isEntryInput(e.target)) return;
      justFocused = e.target;
      e.target.select();
    }

    function onMouseUp(e: MouseEvent) {
      if (!justFocused) return;
      const input = justFocused;
      justFocused = null;
      if (e.target === input) {
        e.preventDefault();
        input.select();
      }
    }

    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

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
