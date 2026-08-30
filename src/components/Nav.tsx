import {
  LayoutDashboard,
  Landmark,
  Receipt,
  Users,
  TrendingUp,
  Scale,
  Settings,
} from 'lucide-react';
import type { TabId } from '../types';

const TABS: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'home', label: 'Home', icon: LayoutDashboard },
  { id: 'startup', label: 'Startup', icon: Landmark },
  { id: 'outgoings', label: 'Outgoings', icon: Receipt },
  { id: 'labour', label: 'Labour', icon: Users },
  { id: 'revenue', label: 'Revenue', icon: TrendingUp },
  { id: 'payback', label: 'Payback', icon: Scale },
];

const SETTINGS = { id: 'settings' as const, label: 'Settings', icon: Settings };

export function Nav({ tab, onTab }: { tab: TabId; onTab: (t: TabId) => void }) {
  return (
    <header className="topnav">
      <div className="brand">
        <strong>Roma Deli</strong>
        <small>Planner</small>
      </div>
      <nav className="tabs" aria-label="Primary">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              className={`tab${tab === t.id ? ' active' : ''}`}
              aria-label={t.label}
              aria-current={tab === t.id ? 'page' : undefined}
              onClick={() => onTab(t.id)}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span className="tip">{t.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="nav-end">
        <button
          type="button"
          className={`tab${tab === SETTINGS.id ? ' active' : ''}`}
          aria-label={SETTINGS.label}
          aria-current={tab === SETTINGS.id ? 'page' : undefined}
          onClick={() => onTab(SETTINGS.id)}
        >
          <SETTINGS.icon size={18} strokeWidth={1.8} />
          <span className="tip">{SETTINGS.label}</span>
        </button>
      </div>
    </header>
  );
}
