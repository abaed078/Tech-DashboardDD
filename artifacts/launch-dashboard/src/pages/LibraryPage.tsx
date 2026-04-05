import { useState } from "react";
import { BookOpen, Search } from "lucide-react";
import { useLang } from "@/context/LanguageContext";
import { PanelBox } from "@/components/PanelBox";

interface ExpertEntry {
  id: string;
  sys: string;
  volt: string;
  logic_ar: string;
  logic_en: string;
  category: "sensor" | "dtc" | "protocol";
}

const expertData: ExpertEntry[] = [
  { id: "MAF",   sys: "Engine",     volt: "0.5–4.5V",  logic_en: "Measuring intake air mass flow for fuel calculation", logic_ar: "قياس كتلة تدفق الهواء الداخل لحساب الوقود", category: "sensor" },
  { id: "MAP",   sys: "Engine",     volt: "1–5V",       logic_en: "Manifold absolute pressure for load calculation", logic_ar: "قياس الضغط المطلق في المشعب لحساب الحمل", category: "sensor" },
  { id: "CKP",   sys: "Ignition",   volt: "AC Sine",    logic_en: "Crankshaft position — determines RPM and injection timing", logic_ar: "موضع عمود المرفق — يحدد عدد الدورات وتوقيت الحقن", category: "sensor" },
  { id: "CMP",   sys: "Ignition",   volt: "0–5V sq",    logic_en: "Camshaft position for valve timing coordination", logic_ar: "موضع عمود الكامة لتنسيق توقيت صمامات الدخول", category: "sensor" },
  { id: "TPS",   sys: "Engine",     volt: "0.5–4.5V",   logic_en: "Throttle position sensor — throttle opening percentage", logic_ar: "حساس موضع خانق الهواء — نسبة فتح الخانق", category: "sensor" },
  { id: "O2",    sys: "Emission",   volt: "0.1–0.9V",   logic_en: "Upstream lambda sensor — rich/lean exhaust feedback", logic_ar: "حساس الأكسجين — قياس نسبة الخليط غني/فقير", category: "sensor" },
  { id: "IAT",   sys: "Engine",     volt: "0.5–4.5V",   logic_en: "Intake air temperature — affects fuel trim", logic_ar: "حساس درجة حرارة هواء السحب — يؤثر على تصحيح الوقود", category: "sensor" },
  { id: "ECT",   sys: "Cooling",    volt: "0.5–4.5V",   logic_en: "Engine coolant temperature — warm-up enrichment", logic_ar: "حساس درجة حرارة سائل التبريد — إثراء الوقود أثناء الإحماء", category: "sensor" },
  { id: "VSS",   sys: "Trans",      volt: "AC pulse",   logic_en: "Vehicle speed sensor — ABS, speedometer, transmission shift", logic_ar: "حساس سرعة السيارة — ABS وعداد السرعة وناقل الحركة", category: "sensor" },
  { id: "KS",    sys: "Engine",     volt: "AC mv",      logic_en: "Knock sensor — detects detonation, retards timing", logic_ar: "حساس الطرق — يكتشف الاشتعال المبكر ويؤخر التوقيت", category: "sensor" },
  // DTC codes
  { id: "P0A80", sys: "BMS",        volt: "N/A",        logic_en: "Replace Hybrid Battery Pack — cell balance failure", logic_ar: "استبدال حزمة بطارية الهجين — فشل في توازن خلايا البطارية", category: "dtc" },
  { id: "P0171", sys: "Engine",     volt: "N/A",        logic_en: "System too lean (Bank 1) — check MAF, vacuum leaks, fuel pressure", logic_ar: "الخليط فقير جداً (بنك 1) — تحقق من MAF وتسريبات الفراغ وضغط الوقود", category: "dtc" },
  { id: "P0300", sys: "Ignition",   volt: "N/A",        logic_en: "Random/Multiple cylinder misfire — check spark plugs, coils, injectors", logic_ar: "تقطيع عشوائي في أسطوانات متعددة — تحقق من الشمعات والملفات والبخاخات", category: "dtc" },
  { id: "P0420", sys: "Emission",   volt: "N/A",        logic_en: "Catalyst system efficiency below threshold (Bank 1)", logic_ar: "كفاءة نظام المحول الحفاز أقل من الحد (بنك 1)", category: "dtc" },
  { id: "U0100", sys: "CAN-Bus",    volt: "N/A",        logic_en: "Lost communication with ECM/PCM — check CAN wiring", logic_ar: "فُقد الاتصال مع ECM/PCM — تحقق من أسلاك CAN", category: "dtc" },
  { id: "B1479", sys: "Body",       volt: "N/A",        logic_en: "A/C refrigerant pressure sensor circuit malfunction", logic_ar: "خلل في دائرة حساس ضغط مبرد التكييف", category: "dtc" },
  // Protocols
  { id: "CAN",   sys: "Network",    volt: "2.5–3.5V",   logic_en: "Controller Area Network — high-speed differential bus, up to 1 Mb/s", logic_ar: "شبكة منطقة التحكم — ناقل تفاضلي عالي السرعة حتى 1 ميجابت/ث", category: "protocol" },
  { id: "LIN",   sys: "Network",    volt: "0–12V",      logic_en: "Local Interconnect Network — single-wire, 20 kb/s, seat/mirror modules", logic_ar: "شبكة الربط المحلي — سلك واحد، 20 كيلوبت/ث، وحدات المقاعد والمرايا", category: "protocol" },
  { id: "OBD2",  sys: "Diagnostic", volt: "12V",        logic_en: "On-Board Diagnostics II — standardized fault reporting since 1996", logic_ar: "التشخيص المتكامل الثاني — معياري لإبلاغ الأعطال منذ 1996", category: "protocol" },
];

const CATEGORY_LABELS = {
  all:      { en: "ALL",       ar: "الكل" },
  sensor:   { en: "SENSORS",   ar: "الحساسات" },
  dtc:      { en: "DTC CODES", ar: "أكواد الأعطال" },
  protocol: { en: "PROTOCOLS", ar: "البروتوكولات" },
};

const CAT_COLOR: Record<string, string> = {
  sensor:   "var(--neon-blue)",
  dtc:      "var(--launch-red)",
  protocol: "var(--success-green)",
};

export function LibraryPage() {
  const { t, lang, isRTL } = useLang();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"all" | "sensor" | "dtc" | "protocol">("all");

  const filtered = expertData.filter(e => {
    const q = search.toLowerCase();
    const matchSearch =
      e.id.toLowerCase().includes(q) ||
      e.sys.toLowerCase().includes(q) ||
      e.logic_en.toLowerCase().includes(q) ||
      e.logic_ar.includes(q);
    const matchCat = category === "all" || e.category === category;
    return matchSearch && matchCat;
  });

  const tabStyle = (cat: string) => ({
    padding: "6px 14px",
    border: "none",
    background: category === cat ? `${CAT_COLOR[cat] ?? "rgba(0,242,255,0.12)"}18` : "transparent",
    color: category === cat ? (CAT_COLOR[cat] ?? "var(--neon-blue)") : "var(--text-muted)",
    borderBottom: `2px solid ${category === cat ? (CAT_COLOR[cat] ?? "var(--neon-blue)") : "transparent"}`,
    cursor: "pointer",
    fontSize: isRTL ? "0.65rem" : "0.58rem",
    letterSpacing: isRTL ? "0.02em" : "0.1em",
    fontFamily: isRTL ? "Cairo, sans-serif" : "Orbitron, sans-serif",
    transition: "all 0.2s",
    whiteSpace: "nowrap" as const,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "var(--panel-bg)", padding: "12px 22px",
        borderBottom: "2px solid var(--neon-blue)", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <BookOpen size={16} color="var(--neon-blue)" />
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: "700", letterSpacing: isRTL ? "0.02em" : "0.2em", color: "#fff" }} data-i18n="lib_title">
              {t("lib_title")}
            </div>
            <div style={{ fontSize: "0.5rem", color: "var(--text-muted)", letterSpacing: "0.06em", marginTop: "1px" }} data-i18n="lib_subtitle">
              {t("lib_subtitle")}
            </div>
          </div>
        </div>
        <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", fontFamily: "Share Tech Mono, monospace" }}>
          {filtered.length} / {expertData.length}
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--dark-surface)", borderBottom: "1px solid var(--border-dim)", padding: "0 14px", flexShrink: 0 }}>
        <div style={{ display: "flex" }}>
          {(["all", "sensor", "dtc", "protocol"] as const).map(cat => (
            <button key={cat} style={tabStyle(cat)} onClick={() => setCategory(cat)}>
              {CATEGORY_LABELS[cat][lang]}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ display: "flex", alignItems: "center", gap: "7px", padding: "5px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-mid)", borderRadius: "5px", margin: "6px 0" }}>
          <Search size={11} color="var(--text-muted)" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t("lib_search")}
            dir={isRTL ? "rtl" : "ltr"}
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text-primary)",
              fontSize: isRTL ? "0.65rem" : "0.6rem",
              fontFamily: isRTL ? "Cairo, sans-serif" : "Share Tech Mono, monospace",
              width: "160px",
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ position: "sticky", top: 0, background: "var(--dark-surface)", zIndex: 1 }}>
            <tr style={{ borderBottom: "1px solid var(--border-dim)" }}>
              {[
                { key: "th_sensor", label: t("th_sensor") },
                { key: "th_system", label: t("th_system") },
                { key: "th_voltage", label: t("th_voltage") },
                { key: "th_logic", label: t("th_logic") },
              ].map(h => (
                <th
                  key={h.key}
                  data-i18n={h.key}
                  style={{
                    padding: "10px 16px",
                    textAlign: isRTL ? "right" : "left",
                    fontSize: "0.5rem",
                    color: "var(--text-muted)",
                    letterSpacing: "0.1em",
                    fontWeight: "400",
                  }}
                >
                  {h.label}
                </th>
              ))}
              <th style={{ padding: "10px 16px", width: "80px", fontSize: "0.5rem", color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: "400" }}>TYPE</th>
            </tr>
          </thead>
          <tbody id="library-body">
            {filtered.map((item, i) => (
              <tr
                key={i}
                style={{ borderBottom: "1px solid #333" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <td style={{ padding: "13px 16px", color: CAT_COLOR[item.category] ?? "var(--neon-blue)", fontWeight: "700", fontFamily: "Share Tech Mono, monospace", fontSize: "0.7rem" }}>
                  {item.id}
                </td>
                <td style={{ padding: "13px 16px", fontSize: "0.62rem", color: "var(--text-primary)", letterSpacing: "0.05em" }}>
                  {item.sys}
                </td>
                <td style={{ padding: "13px 16px", fontSize: "0.62rem", color: "orange", fontFamily: "Share Tech Mono, monospace" }}>
                  {item.volt}
                </td>
                <td style={{ padding: "13px 16px", fontSize: isRTL ? "0.68rem" : "0.6rem", color: "var(--text-muted)", lineHeight: 1.6, maxWidth: "340px", fontFamily: isRTL ? "Cairo, sans-serif" : "inherit" }}>
                  {lang === "ar" ? item.logic_ar : item.logic_en}
                </td>
                <td style={{ padding: "13px 16px" }}>
                  <span style={{
                    fontSize: "0.48rem",
                    padding: "2px 7px",
                    borderRadius: "3px",
                    background: `${CAT_COLOR[item.category] ?? "var(--neon-blue)"}18`,
                    border: `1px solid ${CAT_COLOR[item.category] ?? "var(--neon-blue)"}44`,
                    color: CAT_COLOR[item.category] ?? "var(--neon-blue)",
                    letterSpacing: "0.08em",
                    whiteSpace: "nowrap",
                  }}>
                    {CATEGORY_LABELS[item.category][lang]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)", fontSize: "0.65rem", letterSpacing: "0.1em" }}>
            {lang === "ar" ? "لا توجد نتائج" : "NO RESULTS FOUND"}
          </div>
        )}
      </div>
    </div>
  );
}
