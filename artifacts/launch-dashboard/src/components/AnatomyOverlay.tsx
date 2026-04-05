import { useEffect } from "react";
import { X, Zap, Thermometer, Cpu, AlertTriangle } from "lucide-react";
import { useLang } from "@/context/LanguageContext";

export interface AnatomyData {
  id: string;
  name_en: string;
  name_ar: string;
  desc_en: string;
  desc_ar: string;
  volt: string;
  temp: string;
  system: string;
  category: "sensor" | "dtc" | "protocol";
}

interface Props {
  data: AnatomyData | null;
  onClose: () => void;
}

const CAT_COLOR: Record<string, string> = {
  sensor:   "var(--neon-blue)",
  dtc:      "var(--launch-red)",
  protocol: "var(--success-green)",
};

const CAT_ICON: Record<string, React.ReactNode> = {
  sensor:   <Cpu size={13} />,
  dtc:      <AlertTriangle size={13} />,
  protocol: <Zap size={13} />,
};

export function AnatomyOverlay({ data, onClose }: Props) {
  const { lang, isRTL } = useLang();

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!data) return null;

  const accentColor = CAT_COLOR[data.category] ?? "var(--neon-blue)";
  const name  = lang === "ar" ? data.name_ar  : data.name_en;
  const desc  = lang === "ar" ? data.desc_ar  : data.desc_en;

  return (
    <>
      {/* Backdrop */}
      <div
        id="anatomy-overlay"
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(3px)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "fadeIn 0.15s ease",
        }}
      >
        {/* Card — stop propagation so clicks inside don't close */}
        <div
          className="anatomy-card"
          onClick={e => e.stopPropagation()}
          dir={isRTL ? "rtl" : "ltr"}
          style={{
            background: "linear-gradient(135deg, #131313 0%, #1c1c1c 100%)",
            border: `1px solid ${accentColor}55`,
            borderTop: `3px solid ${accentColor}`,
            borderRadius: "10px",
            padding: "0",
            width: "min(460px, 90vw)",
            boxShadow: `0 0 40px ${accentColor}22, 0 20px 60px rgba(0,0,0,0.6)`,
            position: "relative",
            overflow: "hidden",
            animation: "slideUp 0.2s ease",
          }}
        >
          {/* Glow line top */}
          <div style={{ height: "1px", background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`, marginBottom: "0" }} />

          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "18px 20px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "34px", height: "34px", borderRadius: "8px",
                background: `${accentColor}12`,
                border: `1px solid ${accentColor}44`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: accentColor, flexShrink: 0,
              }}>
                {CAT_ICON[data.category]}
              </div>
              <div>
                <div id="part-name" style={{
                  fontFamily: isRTL ? "Cairo, sans-serif" : "Orbitron, sans-serif",
                  fontSize: isRTL ? "0.9rem" : "0.78rem",
                  fontWeight: "700",
                  color: "#fff",
                  letterSpacing: isRTL ? "0.02em" : "0.15em",
                }}>
                  {name}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
                  <span style={{
                    fontSize: "0.5rem", padding: "2px 7px", borderRadius: "3px",
                    background: `${accentColor}15`,
                    border: `1px solid ${accentColor}40`,
                    color: accentColor, letterSpacing: "0.1em",
                  }}>
                    {data.id}
                  </span>
                  <span style={{ fontSize: "0.5rem", color: "var(--text-muted)", letterSpacing: "0.05em" }}>
                    {data.system}
                  </span>
                </div>
              </div>
            </div>

            {/* Close button */}
            <button
              className="btn-close"
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "6px",
                color: "var(--text-muted)",
                cursor: "pointer",
                width: "28px", height: "28px",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "var(--text-muted)"; }}
            >
              <X size={13} />
            </button>
          </div>

          {/* Divider */}
          <div style={{ height: "1px", background: "var(--border-dim)", margin: "0 20px" }} />

          {/* Description */}
          <div style={{ padding: "14px 20px" }}>
            <p id="part-desc" style={{
              fontFamily: isRTL ? "Cairo, sans-serif" : "inherit",
              fontSize: isRTL ? "0.75rem" : "0.65rem",
              color: "var(--text-muted)",
              lineHeight: 1.8,
              margin: 0,
            }}>
              {desc}
            </p>
          </div>

          {/* Specs grid */}
          <div
            className="specs-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
              padding: "0 20px 20px",
            }}
          >
            {/* Voltage */}
            <div style={{
              padding: "12px 14px",
              background: "rgba(255,165,0,0.06)",
              border: "1px solid rgba(255,165,0,0.2)",
              borderRadius: "7px",
              display: "flex", flexDirection: "column", gap: "5px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "rgba(255,165,0,0.7)", fontSize: "0.5rem", letterSpacing: "0.1em" }}>
                <Zap size={10} />
                {lang === "ar" ? "الجهد" : "VOLTAGE"}
              </div>
              <span id="spec-volt" style={{
                fontFamily: "Share Tech Mono, monospace",
                fontSize: "0.85rem",
                color: "orange",
                fontWeight: "600",
              }}>
                {data.volt}
              </span>
            </div>

            {/* Temperature */}
            <div style={{
              padding: "12px 14px",
              background: "rgba(0,242,255,0.05)",
              border: "1px solid rgba(0,242,255,0.15)",
              borderRadius: "7px",
              display: "flex", flexDirection: "column", gap: "5px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "rgba(0,242,255,0.6)", fontSize: "0.5rem", letterSpacing: "0.1em" }}>
                <Thermometer size={10} />
                {lang === "ar" ? "درجة الحرارة" : "TEMP RANGE"}
              </div>
              <span id="spec-temp" style={{
                fontFamily: "Share Tech Mono, monospace",
                fontSize: "0.85rem",
                color: "var(--neon-blue)",
                fontWeight: "600",
              }}>
                {data.temp}
              </span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(18px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>
    </>
  );
}
