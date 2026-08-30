import { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { Modal } from '../components/Modal';
import { exportWorkbook, importWorkbook } from '../excel/workbook';
import { seedState } from '../seed';
import type { AppState, Theme } from '../types';

export function Settings({
  state,
  setState,
}: {
  state: AppState;
  setState: (s: AppState) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<ArrayBuffer | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  async function onExport() {
    const buf = await exportWorkbook(state);
    const blob = new Blob([buf], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Roma-Deli-Planner.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onPick(file: File) {
    const buf = await file.arrayBuffer();
    setPending(buf);
  }

  async function confirmImport() {
    if (!pending) return;
    const next = await importWorkbook(pending, state);
    setState(next);
    setPending(null);
  }

  return (
    <div className="rise">
      <div className="page-head">
        <div>
          <h1>Settings</h1>
          <p>Theme, persisted unit switches, Excel round-trip, and labelled assumptions.</p>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3>Appearance</h3>
          <div className="row" style={{ marginTop: 12 }}>
            <button
              type="button"
              className={`btn ${state.theme === 'light' ? 'primary' : ''}`}
              onClick={() => setState({ ...state, theme: 'light' satisfies Theme })}
            >
              Light cream
            </button>
            <button
              type="button"
              className={`btn ${state.theme === 'dark' ? 'primary' : ''}`}
              onClick={() => setState({ ...state, theme: 'dark' })}
            >
              Espresso dark
            </button>
          </div>
        </div>

        <div className="card">
          <h3>Persisted units</h3>
          <p className="muted">These write to localStorage. Home preview toggles do not.</p>
          <div className="row" style={{ marginTop: 12 }}>
            <span className="chip on">Cafe always on</span>
            <button
              type="button"
              className={`chip ${state.units.wine ? 'on' : ''}`}
              onClick={() => setState({ ...state, units: { ...state.units, wine: !state.units.wine } })}
            >
              Wine bar {state.units.wine ? 'on' : 'off'}
            </button>
            <button
              type="button"
              className={`chip ${state.units.catering ? 'on' : ''}`}
              onClick={() =>
                setState({ ...state, units: { ...state.units, catering: !state.units.catering } })
              }
            >
              Catering {state.units.catering ? 'on' : 'off'}
            </button>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Assumptions</h3>
        <div className="grid grid-3" style={{ marginTop: 12 }}>
          <label className="field">
            <span>Super % (ATO 2026–27)</span>
            <input
              type="number"
              value={state.assumptions.superPct}
              onChange={(e) =>
                setState({
                  ...state,
                  assumptions: { ...state.assumptions, superPct: Number(e.target.value) },
                })
              }
            />
          </label>
          <label className="field">
            <span>WorkCover WIC 451113 $ / $100 wages</span>
            <input
              type="number"
              step="0.001"
              value={state.assumptions.workCoverPer100}
              onChange={(e) =>
                setState({
                  ...state,
                  assumptions: { ...state.assumptions, workCoverPer100: Number(e.target.value) },
                })
              }
            />
          </label>
          <label className="field">
            <span>Labour weeks / month (52/12)</span>
            <input
              type="number"
              step="0.001"
              value={Number(state.assumptions.weeksPerMonthLabour.toFixed(4))}
              onChange={(e) =>
                setState({
                  ...state,
                  assumptions: { ...state.assumptions, weeksPerMonthLabour: Number(e.target.value) },
                })
              }
            />
          </label>
        </div>
        <p className="notes" style={{ marginTop: 10 }}>
          Award {state.assumptions.hospitalityAward}. Fair Work L2 casual ordinary 1 Jul 2026 $
          {state.assumptions.fairWorkL2CasualOrdinary.toFixed(2)}/h is a reference, not auto-applied
          to every row. Standing WorkCover outgoing of $185/mo may overlap wage-based WorkCover —
          pick one source of truth.
        </p>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Excel</h3>
        <p className="muted">
          Colour-coded workbook: Dashboard, Startup, Outgoings, Labour, Employees, Revenue, Loans,
          Partners, Settings. Frozen headers, AUD formats, notes column. Import overwrites the saved
          JSON.
        </p>
        <div className="row" style={{ marginTop: 12 }}>
          <button type="button" className="btn primary" onClick={onExport}>
            <Download size={14} /> Export .xlsx
          </button>
          <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
            <Upload size={14} /> Import .xlsx
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onPick(f);
              e.target.value = '';
            }}
          />
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Database</h3>
        <p className="muted">Reset to the Darwin 30 Aug 2026 seed. This overwrites local data.</p>
        <button type="button" className="btn danger" onClick={() => setResetOpen(true)}>
          Reset to seed
        </button>
      </div>

      {pending && (
        <Modal
          title="Overwrite saved plan?"
          danger
          confirmLabel="Import and overwrite"
          onCancel={() => setPending(null)}
          onConfirm={() => void confirmImport()}
        >
          <p>
            Importing this spreadsheet will replace the current localStorage database. This cannot
            be undone except by re-importing a previous export.
          </p>
        </Modal>
      )}
      {resetOpen && (
        <Modal
          title="Reset to Darwin seed?"
          danger
          confirmLabel="Reset"
          onCancel={() => setResetOpen(false)}
          onConfirm={() => {
            setState(seedState());
            setResetOpen(false);
          }}
        >
          <p>Restore cafe / wine / catering figures as at 30 August 2026. Your edits will be lost.</p>
        </Modal>
      )}
    </div>
  );
}
