import { useState } from "react";
import { LanguageProvider, useLang } from "@/context/LanguageContext";
import { Sidebar } from "@/components/Sidebar";
import { DashboardPage } from "@/pages/DashboardPage";
import { NetworkPage } from "@/pages/NetworkPage";
import { SecurityPage } from "@/pages/SecurityPage";
import { SystemsPage } from "@/pages/SystemsPage";
import { TerminalPage } from "@/pages/TerminalPage";
import { AlertsPage } from "@/pages/AlertsPage";

export type PageId = "dashboard" | "network" | "security" | "systems" | "terminal" | "alerts";

function AppInner() {
  const [activePage, setActivePage] = useState<PageId>("dashboard");
  const { lang, toggle, isRTL } = useLang();

  const renderPage = () => {
    switch (activePage) {
      case "dashboard": return <DashboardPage />;
      case "network":   return <NetworkPage />;
      case "security":  return <SecurityPage />;
      case "systems":   return <SystemsPage />;
      case "terminal":  return <TerminalPage />;
      case "alerts":    return <AlertsPage />;
      default:          return <DashboardPage />;
    }
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isRTL ? '1fr 240px' : '240px 1fr',
      gridTemplateRows: '36px 1fr',
      height: '100vh',
      background: '#000',
    }}>
      {/* ── Global top bar ── */}
      <div style={{
        gridColumn: '1 / -1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '12px',
        padding: '0 18px',
        background: '#0c0c0c',
        borderBottom: '1px solid #2a2a2a',
        flexShrink: 0,
        zIndex: 10,
      }}>
        {/* Clock */}
        <LiveClock />

        {/* Language toggle */}
        <button
          onClick={toggle}
          title={lang === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 10px',
            background: 'rgba(0,242,255,0.08)',
            border: '1px solid rgba(0,242,255,0.25)',
            borderRadius: '4px',
            color: 'var(--neon-blue)',
            cursor: 'pointer',
            fontSize: '0.6rem',
            letterSpacing: '0.1em',
            fontFamily: 'Orbitron, sans-serif',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(0,242,255,0.15)';
            e.currentTarget.style.boxShadow = '0 0 8px rgba(0,242,255,0.3)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(0,242,255,0.08)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {/* globe-like icon */}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          {lang === 'en' ? 'العربية' : 'English'}
        </button>
      </div>

      {/* ── Sidebar ── */}
      <div style={{ gridRow: 2, order: isRTL ? 2 : 1, overflow: 'hidden' }}>
        <Sidebar activePage={activePage} onNavigate={setActivePage} />
      </div>

      {/* ── Main content ── */}
      <main style={{
        gridRow: 2,
        order: isRTL ? 1 : 2,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: '#0a0a0a',
      }}>
        {renderPage()}
      </main>
    </div>
  );
}

function LiveClock() {
  const [time, setTime] = useState(new Date());
  // tick every second
  useState(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  });

  const pad = (n: number) => String(n).padStart(2, '0');
  const hh = pad(time.getUTCHours());
  const mm = pad(time.getUTCMinutes());
  const ss = pad(time.getUTCSeconds());

  return (
    <span style={{
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '0.7rem',
      color: '#e0e0e0',
      letterSpacing: '0.12em',
    }}>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.55rem', marginRight: '4px' }}>UTC</span>
      {hh}:{mm}:{ss}
    </span>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppInner />
    </LanguageProvider>
  );
}
