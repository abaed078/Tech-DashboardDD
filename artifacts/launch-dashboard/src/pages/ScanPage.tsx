import { useState, useRef } from "react";
import { ScanLine, AlertTriangle, CheckCircle, Download, Zap } from "lucide-react";
import { useLang } from "@/context/LanguageContext";
import { PanelBox } from "@/components/PanelBox";
import { exportToPdf } from "@/utils/exportPdf";
import { AnatomyOverlay, AnatomyData } from "@/components/AnatomyOverlay";

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
  anatomy: AnatomyData;
}

const FAULT_DTCS: DTC[] = [
  {
    code: "P0A80", system: "BMS", severity: "CRITICAL",
    desc_en: "Replace Hybrid Battery Pack — cell imbalance detected",
    desc_ar: "استبدال حزمة بطارية الهجين — تم اكتشاف عدم توازن في الخلايا",
    anatomy: {
      id: "P0A80", sys: "BMS", volt: "N/A", temp: "N/A", category: "dtc",
      name_en: "Hybrid Battery Pack Fault", name_ar: "عطل حزمة بطارية الهجين",
      desc_en: "Cell voltage imbalance or degraded capacity detected in the high-voltage hybrid battery pack. Requires immediate inspection. Typically resolved by replacing the battery pack or individual modules. Check BMS wiring and connector integrity first.",
      desc_ar: "تم اكتشاف عدم توازن في جهد الخلايا أو تراجع في سعة حزمة بطارية الجهد العالي الهجينة. يتطلب فحصاً فورياً. يُحل عادةً باستبدال حزمة البطارية أو وحدات فردية منها.",
      logic_en: "Replace Hybrid Battery Pack — cell balance failure",
      logic_ar: "استبدال حزمة بطارية الهجين — فشل في توازن خلايا البطارية",
    },
  },
  {
    code: "U0100", system: "CAN-Bus", severity: "HIGH",
    desc_en: "Lost communication with ECM/PCM",
    desc_ar: "فُقد الاتصال بوحدة ECM/PCM",
    anatomy: {
      id: "U0100", sys: "CAN-Bus", volt: "N/A", temp: "N/A", category: "dtc",
      name_en: "Lost Comm with ECM/PCM", name_ar: "فُقد الاتصال مع ECM/PCM",
      desc_en: "The CAN-Bus network has lost communication with the Engine/Powertrain Control Module. Inspect CAN-H and CAN-L wires for shorts, opens, or corrosion. Verify ECM power supply and ground circuits. Check the 120Ω termination resistors at bus endpoints.",
      desc_ar: "فُقد الاتصال في شبكة CAN-Bus مع وحدة التحكم في المحرك/قطار القوى. افحص أسلاك CAN-H وCAN-L بحثاً عن قصر أو انفصال أو تآكل. تحقق من مقاومات الإنهاء 120Ω.",
      logic_en: "Lost communication with ECM/PCM — check CAN wiring",
      logic_ar: "فُقد الاتصال مع ECM/PCM — تحقق من أسلاك CAN",
    },
  },
  {
    code: "C1201", system: "ABS/VSC", severity: "MEDIUM",
    desc_en: "Engine control system malfunction",
    desc_ar: "خلل في نظام التحكم بالمحرك",
    anatomy: {
      id: "C1201", sys: "ABS/VSC", volt: "N/A", temp: "N/A", category: "dtc",
      name_en: "ABS/VSC Engine Control Fault", name_ar: "عطل ABS/VSC في نظام التحكم بالمحرك",
      desc_en: "The ABS/VSC system has detected a malfunction in the engine control interface. Often a secondary code caused by P0A80 or U0100. Resolve primary codes first and re-scan. If C1201 persists, inspect VSC sensor wiring and ABS module connector.",
      desc_ar: "اكتشف نظام ABS/VSC خللاً في واجهة التحكم بالمحرك. غالباً ما يكون كوداً ثانوياً ناجماً عن P0A80 أو U0100. يُرجى حل الأكواد الرئيسية أولاً ثم إعادة الفحص.",
      logic_en: "Engine control system malfunction — often secondary to P0A80/U0100",
      logic_ar: "خلل في نظام التحكم بالمحرك — غالباً ثانوي لأكواد أخرى",
    },
  },
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
  const [exporting, setExporting] = useState(false);
  const [selectedDtc, setSelectedDtc] = useState<AnatomyData | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleExport = async () => {
    setExporting(true);
    const date = new Date().toISOString().slice(0, 10);
    await exportToPdf("scan-export", `LaunchOPS_DiagnosticReport_${date}.pdf`);
    setExporting(false);
  };

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

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Export button — only shown after a scan */}
          {(scanState === "done_fault" || scanState === "done_clean") && (
            <button
              onClick={handleExport}
              disabled={exporting}
              title={lang === "ar" ? "تصدير تقرير PDF" : "Export PDF Report"}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "7px 14px",
                background: exporting ? "rgba(0,242,255,0.05)" : "rgba(0,242,255,0.1)",
                border: `1px solid ${exporting ? "rgba(0,242,255,0.2)" : "rgba(0,242,255,0.5)"}`,
                borderRadius: "6px",
                color: exporting ? "rgba(0,242,255,0.4)" : "var(--neon-blue)",
                cursor: exporting ? "not-allowed" : "pointer",
                fontSize: isRTL ? "0.65rem" : "0.58rem",
                letterSpacing: isRTL ? "0.02em" : "0.08em",
                fontFamily: isRTL ? "Cairo, sans-serif" : "Orbitron, sans-serif",
                transition: "all 0.2s",
                boxShadow: exporting ? "none" : "0 0 8px rgba(0,242,255,0.15)",
              }}
              onMouseEnter={e => { if (!exporting) e.currentTarget.style.background = "rgba(0,242,255,0.18)"; }}
              onMouseLeave={e => { if (!exporting) e.currentTarget.style.background = "rgba(0,242,255,0.1)"; }}
            >
              <Download size={11} />
              {exporting
                ? (lang === "ar" ? "جاري التصدير..." : "EXPORTING...")
                : (lang === "ar" ? "تصدير PDF" : "EXPORT PDF")}
            </button>
          )}

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
      </div>

      <div id="scan-export" style={{ flex: 1, overflow: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "14px", background: "#0a0a0a" }}>

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
                <div
                  key={i}
                  onClick={() => setSelectedDtc(d.anatomy)}
                  title={lang === "ar" ? "انقر لعرض التفاصيل" : "Click to inspect"}
                  style={{
                    padding: "10px 12px",
                    background: `${SEV_COLOR[d.severity]}0d`,
                    border: `1px solid ${SEV_COLOR[d.severity]}44`,
                    borderLeft: `3px solid ${SEV_COLOR[d.severity]}`,
                    borderRadius: "6px",
                    cursor: "pointer",
                    transition: "background 0.15s, box-shadow 0.15s",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = `${SEV_COLOR[d.severity]}18`;
                    e.currentTarget.style.boxShadow = `0 0 12px ${SEV_COLOR[d.severity]}22`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = `${SEV_COLOR[d.severity]}0d`;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <span style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "0.7rem", color: SEV_COLOR[d.severity], fontWeight: "700" }}>{d.code}</span>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <span style={{ fontSize: "0.48rem", padding: "1px 6px", borderRadius: "3px", background: `${SEV_COLOR[d.severity]}18`, border: `1px solid ${SEV_COLOR[d.severity]}44`, color: SEV_COLOR[d.severity] }}>{d.severity}</span>
                      <span style={{ fontSize: "0.48rem", padding: "1px 6px", borderRadius: "3px", background: "rgba(0,242,255,0.08)", border: "1px solid rgba(0,242,255,0.2)", color: "var(--neon-blue)" }}>{d.system}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: "0.57rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                    {lang === "ar" ? d.desc_ar : d.desc_en}
                  </div>
                  <div style={{ marginTop: "5px", fontSize: "0.48rem", color: `${SEV_COLOR[d.severity]}80`, letterSpacing: "0.08em" }}>
                    {lang === "ar" ? "انقر لعرض التفاصيل ←" : "↗ CLICK TO INSPECT"}
                  </div>
                </div>
              ))}
            </div>
          </PanelBox>
        </div>
      </div>

      {/* Anatomy overlay for DTC deep-dive */}
      <AnatomyOverlay data={selectedDtc} onClose={() => setSelectedDtc(null)} />
    </div>
  );
}
