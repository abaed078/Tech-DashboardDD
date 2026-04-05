import { useState, useRef } from "react";
import { ScanLine, AlertTriangle, CheckCircle, Zap } from "lucide-react";
import { useLang } from "@/context/LanguageContext";
import { PanelBox } from "@/components/PanelBox";

type ScanState = "idle" | "running" | "done_fault" | "done_clean";

interface LogEntry {
  time: string;
  msg: string;
  type: "info" | "warn" | "error" | "ok";
}

interface DTC {
  code: string;
  system: string;
  desc_en: string;
  desc_ar: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
}

const FAULT_DTCS: DTC[] = [
  { code: "P0A80", system: "BMS", desc_en: "Replace Hybrid Battery Pack — cell imbalance detected", desc_ar: "استبدال حزمة بطارية الهجين — تم اكتشاف عدم توازن في الخلايا", severity: "CRITICAL" },
  { code: "U0100", system: "CAN-Bus", desc_en: "Lost communication with ECM/PCM", desc_ar: "فُقد الاتصال بوحدة ECM/PCM", severity: "HIGH" },
  { code: "C1201", system: "ABS/VSC", desc_en: "Engine control system malfunction", desc_ar: "خلل في نظام التحكم بالمحرك", severity: "MEDIUM" },
];

const SCAN_STEPS_EN = [
  "Initializing VCI interface...",
  "Connecting to OBD-II port...",
  "Reading ECU identifiers...",
  "Scanning CAN-Bus network...",
  "Polling BMS module...",
  "Polling ABS/VSC module...",
  "Polling transmission module...",
  "Running expert inference engine...",
  "Cross-referencing DTC database...",
];

const SCAN_STEPS_AR = [
  "تهيئة واجهة VCI...",
  "الاتصال بمنفذ OBD-II...",
  "قراءة معرفات وحدة ECU...",
  "فحص شبكة CAN-Bus...",
  "استطلاع وحدة BMS...",
  "استطلاع وحدة ABS/VSC...",
  "استطلاع وحدة ناقل الحركة...",
  "تشغيل محرك الاستدلال الخبير...",
  "التحقق من قاعدة بيانات DTC...",
];

function getTime() {
  return new Date().toTimeString().slice(0, 8);
}

export function ScanPage() {
  const { t, lang, isRTL } = useLang();
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [progress, setProgress] = useState(0);
  const [dtcs, setDtcs] = useState<DTC[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const STEPS = lang === "ar" ? SCAN_STEPS_AR : SCAN_STEPS_EN;

  const runDiagnostic = () => {
    if (scanState === "running") return;
    setScanState("running");
    setLogs([]);
    setDtcs([]);
    setProgress(0);

    let step = 0;
    const addStep = () => {
      if (step < STEPS.length) {
        const pct = Math.round(((step + 1) / STEPS.length) * 90);
        setProgress(pct);
        setLogs(prev => [...prev, { time: getTime(), msg: STEPS[step], type: "info" }]);
        step++;
        timerRef.current = setTimeout(addStep, 320);
      } else {
        // finalize
        setProgress(100);
        setDtcs(FAULT_DTCS);
        setLogs(prev => [
          ...prev,
          { time: getTime(), msg: lang === "ar" ? "اكتمل الفحص — تم العثور على 3 أكواد أعطال" : "Scan complete — 3 fault codes found", type: "warn" },
        ]);
        setScanState("done_fault");
      }
    };
    timerRef.current = setTimeout(addStep, 200);
  };

  const SEV_COLOR = { CRITICAL: "var(--launch-red)", HIGH: "var(--warning-amber)", MEDIUM: "var(--neon-blue)" };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "var(--panel-bg)", padding: "12px 22px",
        borderBottom: "2px solid var(--launch-red)", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <ScanLine size={16} color="var(--launch-red)" />
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: "700", letterSpacing: isRTL ? "0.02em" : "0.2em", color: "#fff" }} data-i18n="scan_title">
              {t("scan_title")}
            </div>
            <div style={{ fontSize: "0.5rem", color: "var(--text-muted)", letterSpacing: "0.06em", marginTop: "1px" }} data-i18n="scan_subtitle">
              {t("scan_subtitle")}
            </div>
          </div>
        </div>

        {/* Run button */}
        <button
          onClick={runDiagnostic}
          disabled={scanState === "running"}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "8px 18px",
            background: scanState === "running" ? "rgba(230,0,18,0.05)" : "rgba(230,0,18,0.15)",
            border: `1px solid ${scanState === "running" ? "rgba(230,0,18,0.3)" : "var(--launch-red)"}`,
            borderRadius: "6px",
            color: scanState === "running" ? "rgba(230,0,18,0.5)" : "var(--launch-red)",
            cursor: scanState === "running" ? "not-allowed" : "pointer",
            fontSize: isRTL ? "0.75rem" : "0.6rem",
            letterSpacing: isRTL ? "0.02em" : "0.1em",
            fontFamily: isRTL ? "Cairo, sans-serif" : "Orbitron, sans-serif",
            boxShadow: scanState !== "running" ? "0 0 10px rgba(230,0,18,0.2)" : "none",
            transition: "all 0.2s",
          }}
        >
          <Zap size={13} />
          <span data-i18n="scan_run">{t("scan_run")}</span>
        </button>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>

        {/* Status + progress */}
        <PanelBox
          title={t("scan_status")}
          accentColor={scanState === "done_fault" ? "var(--launch-red)" : scanState === "done_clean" ? "var(--success-green)" : "var(--neon-blue)"}
        >
          <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {scanState === "idle" && (
                <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }} data-i18n="scan_ready">{t("scan_ready")}</span>
              )}
              {scanState === "running" && (
                <>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--neon-blue)", boxShadow: "0 0 8px var(--neon-blue)", animation: "pulse-red 0.8s ease-in-out infinite" }} />
                  <span style={{ fontSize: "0.65rem", color: "var(--neon-blue)" }} data-i18n="scanning_msg">{t("scanning_msg")}</span>
                </>
              )}
              {scanState === "done_fault" && (
                <>
                  <AlertTriangle size={14} color="var(--launch-red)" />
                  <span style={{ fontSize: "0.65rem", color: "var(--launch-red)" }} data-i18n="scan_complete">{t("scan_complete")}</span>
                </>
              )}
              {scanState === "done_clean" && (
                <>
                  <CheckCircle size={14} color="var(--success-green)" />
                  <span style={{ fontSize: "0.65rem", color: "var(--success-green)" }}>{t("scan_clean")}</span>
                </>
              )}
            </div>

            {/* Progress bar */}
            {scanState !== "idle" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                  <span style={{ fontSize: "0.5rem", color: "var(--text-muted)", letterSpacing: "0.1em" }}>PROGRESS</span>
                  <span style={{ fontSize: "0.55rem", color: "var(--neon-blue)", fontFamily: "Share Tech Mono, monospace" }}>{progress}%</span>
                </div>
                <div style={{ height: "5px", background: "var(--border-dim)", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{
                    width: `${progress}%`, height: "100%",
                    background: scanState === "done_fault" ? "var(--launch-red)" : "var(--neon-blue)",
                    boxShadow: `0 0 8px ${scanState === "done_fault" ? "var(--launch-red)" : "var(--neon-blue)"}`,
                    transition: "width 0.3s ease",
                  }} />
                </div>
              </div>
            )}
          </div>
        </PanelBox>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          {/* Diagnostic log */}
          <PanelBox title={t("scan_log")} accentColor="var(--neon-blue)">
            <div style={{
              padding: "10px 14px",
              fontFamily: "Share Tech Mono, monospace",
              fontSize: "0.6rem",
              display: "flex",
              flexDirection: "column",
              gap: "5px",
              minHeight: "180px",
              maxHeight: "280px",
              overflowY: "auto",
            }}>
              {logs.length === 0 && (
                <span style={{ color: "var(--text-muted)" }}>—</span>
              )}
              {logs.map((l, i) => (
                <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <span style={{ color: "var(--text-muted)", flexShrink: 0, fontSize: "0.55rem" }}>{l.time}</span>
                  <span style={{
                    color: l.type === "warn" ? "var(--warning-amber)" : l.type === "error" ? "var(--launch-red)" : l.type === "ok" ? "var(--success-green)" : "var(--text-primary)",
                    lineHeight: 1.5,
                  }}>{l.msg}</span>
                </div>
              ))}
            </div>
          </PanelBox>

          {/* DTC results */}
          <PanelBox
            title={dtcs.length > 0 ? `${t("dtc_found")} (${dtcs.length})` : t("no_dtc")}
            accentColor={dtcs.length > 0 ? "var(--launch-red)" : "var(--success-green)"}
          >
            <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: "8px", minHeight: "180px" }}>
              {dtcs.length === 0 && (
                <span style={{ color: "var(--text-muted)", fontSize: "0.6rem" }}>—</span>
              )}
              {dtcs.map((d, i) => (
                <div key={i} style={{
                  padding: "10px 12px",
                  background: `${SEV_COLOR[d.severity]}0d`,
                  border: `1px solid ${SEV_COLOR[d.severity]}44`,
                  borderLeft: `3px solid ${SEV_COLOR[d.severity]}`,
                  borderRadius: "6px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <span style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "0.7rem", color: SEV_COLOR[d.severity], fontWeight: "700" }}>{d.code}</span>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <span style={{ fontSize: "0.48rem", padding: "1px 6px", borderRadius: "3px", background: `${SEV_COLOR[d.severity]}18`, border: `1px solid ${SEV_COLOR[d.severity]}44`, color: SEV_COLOR[d.severity] }}>{d.severity}</span>
                      <span style={{ fontSize: "0.48rem", padding: "1px 6px", borderRadius: "3px", background: "rgba(0,242,255,0.08)", border: "1px solid rgba(0,242,255,0.2)", color: "var(--neon-blue)" }}>{d.system}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: "0.57rem", color: "var(--text-muted)", lineHeight: 1.5 }} data-i18n={`dtc_${d.code}`}>
                    {lang === "ar" ? d.desc_ar : d.desc_en}
                  </div>
                </div>
              ))}
            </div>
          </PanelBox>
        </div>
      </div>
    </div>
  );
}
