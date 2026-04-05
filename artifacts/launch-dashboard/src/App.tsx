import { useState, useEffect, useCallback, useRef } from "react";
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
import { VehicleScanPage } from "@/pages/VehicleScanPage";
import { InstructorWorkstation } from "@/pages/InstructorWorkstation";
import { CarViewerPage } from "@/pages/CarViewerPage";

export type PageId =
  | "dashboard"
  | "network"
  | "security"
  | "systems"
  | "terminal"
  | "alerts"
  | "scan"
  | "lib"
  | "vehicle"
  | "carview";

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

function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        background: "rgba(20,20,20,0.95)",
        border: "1px solid rgba(0,242,255,0.3)",
        color: "#e0e0e0",
        padding: "10px 20px",
        borderRadius: "8px",
        zIndex: 99999,
        fontSize: "0.8rem",
        fontFamily: "Cairo, Orbitron, sans-serif",
        boxShadow: "0 0 16px rgba(0,242,255,0.2)",
        transition: "opacity 0.35s, transform 0.35s",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(10px)",
        pointerEvents: "none",
      }}
    >
      {message}
    </div>
  );
}

function AppInner() {
  const [activePage, setActivePage] = useState<PageId>("dashboard");
  const { lang, toggle, t, isRTL } = useLang();

  const [isInstructorMode, setIsInstructorMode] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMsg(msg);
    setToastVisible(true);
    toastTimer.current = setTimeout(() => setToastVisible(false), 3000);
  }, []);

  const enterInstructorMode = useCallback(() => {
    setIsInstructorMode(true);
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    showToast(t("instructor_on"));
  }, [showToast, t]);

  const exitInstructorMode = useCallback(() => {
    setIsInstructorMode(false);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    showToast(t("instructor_off"));
  }, [showToast, t]);

  const toggleInstructorMode = useCallback(() => {
    if (isInstructorMode) exitInstructorMode();
    else enterInstructorMode();
  }, [isInstructorMode, enterInstructorMode, exitInstructorMode]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === "F" || e.key === "f") {
        e.preventDefault();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      }

      if (e.key === "H" || e.key === "h") {
        e.preventDefault();
        const texts = document.querySelectorAll<HTMLElement>(
          ".anatomy-description, .diagnosis-text"
        );
        if (texts.length === 0) return;
        const isHidden = texts[0].style.display === "none";
        texts.forEach(el => {
          el.style.display = isHidden ? "" : "none";
        });
        showToast(isHidden ? t("answers_visible") : t("answers_hidden"));
      }

      if (e.key === "Escape" && isInstructorMode) {
        exitInstructorMode();
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isInstructorMode, exitInstructorMode, showToast, t]);

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
      case "vehicle":   return <VehicleScanPage />;
      case "carview":   return <CarViewerPage />;
      default:          return <DashboardPage />;
    }
  };

  if (isInstructorMode) {
    return (
      <>
        <InstructorWorkstation onExit={exitInstructorMode} lang={lang} isRTL={isRTL} />
        <Toast message={toastMsg} visible={toastVisible} />
      </>
    );
  }

  return (
    <>
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
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <LiveClock />

            {/* Instructor Mode button */}
            <button
              onClick={toggleInstructorMode}
              title={lang === "ar" ? "وضع المحاضر (Kiosk)" : "Instructor / Kiosk Mode"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "3px 12px",
                background: "rgba(74,222,128,0.08)",
                border: "1px solid rgba(74,222,128,0.25)",
                borderRadius: "4px",
                color: "#4ade80",
                cursor: "pointer",
                fontSize: lang === "ar" ? "0.68rem" : "0.6rem",
                letterSpacing: lang === "ar" ? "0.02em" : "0.08em",
                fontFamily: lang === "ar" ? "Cairo, sans-serif" : "Orbitron, sans-serif",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "rgba(74,222,128,0.18)";
                e.currentTarget.style.boxShadow = "0 0 8px rgba(74,222,128,0.3)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "rgba(74,222,128,0.08)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
              {t("instructor_btn")}
            </button>

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
      <Toast message={toastMsg} visible={toastVisible} />
    </>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppInner />
    </LanguageProvider>
  );
}
