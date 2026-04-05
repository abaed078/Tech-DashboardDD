import { useState, useEffect } from "react";
import { LanguageProvider, useLang } from "@/context/LanguageContext";
import { Sidebar } from "@/components/Sidebar";
import { DashboardPage } from "@/pages/DashboardPage";
import { NetworkPage } from "@/pages/NetworkPage";
import { SecurityPage } from "@/pages/SecurityPage";
import { SystemsPage } from "@/pages/SystemsPage";
import { TerminalPage } from "@/pages/TerminalPage";
import { AlertsPage } from "@/pages/AlertsPage";
import { ScanPage } from "@/pages/ScanPage";
import { LibraryPage } from "@/pages/LibraryPage";

export type PageId =
  | "dashboard"
  | "network"
  | "security"
  | "systems"
  | "terminal"
  | "alerts"
  | "scan"
  | "lib";

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <span
      id="digital-clock"
      style={{
        fontFamily: "Share Tech Mono, monospace",
        fontSize: "0.72rem",
        color: "#e0e0e0",
        letterSpacing: "0.12em",
      }}
    >
      <span style={{ color: "var(--text-muted)", fontSize: "0.55rem", marginRight: "5px" }}>
        UTC
      </span>
      {pad(time.getUTCHours())}:{pad(time.getUTCMinutes())}:{pad(time.getUTCSeconds())}
    </span>
  );
}

function AppInner() {
  const [activePage, setActivePage] = useState<PageId>("dashboard");
  const { lang, toggle, t, isRTL } = useLang();

  const renderPage = () => {
    switch (activePage) {
      case "dashboard": return <DashboardPage />;
      case "network":   return <NetworkPage />;
      case "security":  return <SecurityPage />;
      case "systems":   return <SystemsPage />;
      case "terminal":  return <TerminalPage />;
      case "alerts":    return <AlertsPage />;
      case "scan":      return <ScanPage />;
      case "lib":       return <LibraryPage />;
      default:          return <DashboardPage />;
    }
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isRTL ? "1fr 240px" : "240px 1fr",
        gridTemplateRows: "38px 1fr",
        height: "100vh",
        background: "#000",
      }}
    >
      {/* ── Global top bar ── */}
      <div
        style={{
          gridColumn: "1 / -1",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 18px",
          background: "#0c0c0c",
          borderBottom: "1px solid #2a2a2a",
          zIndex: 10,
          gap: "12px",
        }}
      >
        {/* VCI status */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            fontSize: "0.58rem",
            color: "var(--success-green)",
            letterSpacing: "0.1em",
            fontFamily: "Share Tech Mono, monospace",
          }}
        >
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "var(--success-green)",
              boxShadow: "0 0 6px var(--success-green)",
              animation: "pulse-green 2s ease-in-out infinite",
            }}
          />
          {t("vci_status")}
        </div>

        {/* Right controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <LiveClock />

          {/* Language toggle */}
          <button
            onClick={toggle}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "3px 12px",
              background: "rgba(0,242,255,0.08)",
              border: "1px solid rgba(0,242,255,0.25)",
              borderRadius: "4px",
              color: "var(--neon-blue)",
              cursor: "pointer",
              fontSize: lang === "ar" ? "0.7rem" : "0.6rem",
              letterSpacing: lang === "ar" ? "0.02em" : "0.1em",
              fontFamily: lang === "ar" ? "Cairo, sans-serif" : "Orbitron, sans-serif",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(0,242,255,0.15)";
              e.currentTarget.style.boxShadow = "0 0 8px rgba(0,242,255,0.3)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "rgba(0,242,255,0.08)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span id="lang-btn-text">{t("lang_label")}</span>
          </button>
        </div>
      </div>

      {/* ── Sidebar ── */}
      <div style={{ gridRow: 2, order: isRTL ? 2 : 1, overflow: "hidden" }}>
        <Sidebar activePage={activePage} onNavigate={setActivePage} />
      </div>

      {/* ── Main content ── */}
      <main
        style={{
          gridRow: 2,
          order: isRTL ? 1 : 2,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          background: "#0a0a0a",
        }}
      >
        {renderPage()}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppInner />
    </LanguageProvider>
  );
}
