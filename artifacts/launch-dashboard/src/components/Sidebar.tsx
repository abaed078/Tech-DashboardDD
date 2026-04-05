import { PageId } from "@/App";
import { useLang } from "@/context/LanguageContext";
import {
  Activity,
  AlertTriangle,
  BookOpen,
  Globe,
  LayoutDashboard,
  Lock,
  Server,
  ScanLine,
  Terminal,
  Zap,
} from "lucide-react";

const STATUS_COLOR = {
  online: "var(--success-green)",
  warning: "var(--warning-amber)",
  alert: "var(--launch-red)",
};

interface SidebarProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
}

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const { t, isRTL } = useLang();

  const NAV_ITEMS = [
    { id: "dashboard" as PageId, labelKey: "nav_dash", icon: <LayoutDashboard size={15} />, status: "online" as const },
    { id: "network"   as PageId, labelKey: "nav_topo", icon: <Globe size={15} />,           status: "online" as const },
    { id: "scan"      as PageId, labelKey: "nav_scan", icon: <ScanLine size={15} />,         status: undefined },
    { id: "lib"       as PageId, labelKey: "nav_lib",  icon: <BookOpen size={15} />,         status: undefined },
    { id: "security"  as PageId, labelKey: "nav_security", icon: <Lock size={15} />,         status: "warning" as const },
    { id: "systems"   as PageId, labelKey: "nav_systems",  icon: <Server size={15} />,       status: "online" as const },
    { id: "terminal"  as PageId, labelKey: "nav_terminal", icon: <Terminal size={15} />,     status: undefined },
    { id: "alerts"    as PageId, labelKey: "nav_alerts",   icon: <AlertTriangle size={15} />,status: "alert" as const },
  ] as const;

  return (
    <aside
      style={{
        background: "var(--dark-surface)",
        borderRight: isRTL ? "none" : "1px solid var(--border-dim)",
        borderLeft:  isRTL ? "1px solid var(--border-dim)" : "none",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        height: "100%",
      }}
    >
      {/* Logo */}
      <div style={{ padding: "16px 18px 14px", borderBottom: "1px solid var(--border-dim)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "4px" }}>
          <Zap size={18} color="var(--launch-red)" />
          <span style={{ fontSize: "0.83rem", fontWeight: "700", color: "#fff", letterSpacing: "0.15em" }}>
            LAUNCH<span style={{ color: "var(--launch-red)" }}>OPS</span>
          </span>
        </div>
        <div style={{ fontSize: "0.5rem", color: "var(--text-muted)", letterSpacing: "0.1em" }}>
          CONTROL INTERFACE v2.4.1
        </div>
      </div>

      {/* VCI / status pill */}
      <div
        style={{
          margin: "12px 14px",
          padding: "9px 12px",
          background: "rgba(0,255,136,0.06)",
          border: "1px solid rgba(0,255,136,0.2)",
          borderRadius: "6px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <div
          style={{
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            background: "var(--success-green)",
            boxShadow: "0 0 6px var(--success-green)",
            flexShrink: 0,
          }}
        />
        <div>
          <div style={{ fontSize: "0.58rem", color: "var(--success-green)", letterSpacing: "0.08em" }}>
            {t("system_online")}
          </div>
          <div style={{ fontSize: "0.48rem", color: "var(--text-muted)", marginTop: "2px" }}>
            {t("all_cores")}
          </div>
        </div>
      </div>

      {/* Nav label */}
      <div style={{ fontSize: "0.48rem", color: "var(--text-muted)", letterSpacing: "0.15em", padding: "2px 18px 6px" }}>
        NAVIGATION
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: "0 10px", display: "flex", flexDirection: "column", gap: "3px", overflowY: "auto" }}>
        {NAV_ITEMS.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                background: isActive ? "rgba(230,0,18,0.12)" : "#252525",
                border: `1px solid ${isActive ? "var(--launch-red)" : "var(--border-mid)"}`,
                color: isActive ? "#fff" : "var(--text-primary)",
                padding: "10px 12px",
                borderRadius: "6px",
                textAlign: isRTL ? "right" : "left",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                flexDirection: isRTL ? "row-reverse" : "row",
                gap: "9px",
                fontSize: "0.62rem",
                letterSpacing: isRTL ? "0.02em" : "0.08em",
                fontFamily: isRTL ? "Cairo, sans-serif" : "Orbitron, sans-serif",
                boxShadow: isActive ? "0 0 12px rgba(230,0,18,0.2)" : "none",
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = "var(--launch-red)";
                  e.currentTarget.style.boxShadow = "0 0 8px rgba(230,0,18,0.15)";
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = "var(--border-mid)";
                  e.currentTarget.style.boxShadow = "none";
                }
              }}
            >
              <span style={{ color: isActive ? "var(--launch-red)" : "var(--text-muted)", flexShrink: 0 }}>
                {item.icon}
              </span>
              <span style={{ flex: 1 }} data-i18n={item.labelKey}>{t(item.labelKey)}</span>
              {item.status && (
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: STATUS_COLOR[item.status],
                    boxShadow: `0 0 4px ${STATUS_COLOR[item.status]}`,
                    animation: item.status === "alert" ? "pulse-red 1.5s ease-in-out infinite" : undefined,
                    flexShrink: 0,
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom resource bars */}
      <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border-dim)", display: "flex", flexDirection: "column", gap: "7px" }}>
        {[
          { key: "cpu_load", val: 43, valStr: "43%", color: "var(--neon-blue)" },
          { key: "mem_usage", val: 71, valStr: "71%", color: "var(--warning-amber)" },
        ].map(s => (
          <div key={s.key}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
              <span style={{ fontSize: "0.5rem", color: "var(--text-muted)", letterSpacing: "0.08em" }} data-i18n={s.key}>{t(s.key as any)}</span>
              <span style={{ fontSize: "0.52rem", color: s.color, fontFamily: "Share Tech Mono, monospace" }}>{s.valStr}</span>
            </div>
            <div style={{ height: "3px", background: "var(--border-dim)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ width: `${s.val}%`, height: "100%", background: s.color, boxShadow: `0 0 5px ${s.color}` }} />
            </div>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "3px" }}>
          <Activity size={9} color="var(--text-muted)" />
          <span style={{ fontSize: "0.48rem", color: "var(--text-muted)", letterSpacing: "0.06em" }} data-i18n="uptime">
            {t("uptime")}: 14D 07H 32M
          </span>
        </div>
      </div>
    </aside>
  );
}
