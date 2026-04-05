import { useState } from "react";
import { BookOpen, Download, Search } from "lucide-react";
import { useLang } from "@/context/LanguageContext";
import { exportToPdf } from "@/utils/exportPdf";
import { AnatomyOverlay, AnatomyData } from "@/components/AnatomyOverlay";

interface ExpertEntry extends AnatomyData {}

const expertData: ExpertEntry[] = [
  {
    id: "MAF", sys: "Engine", volt: "0.5–4.5V", temp: "-40–120°C",
    name_en: "Mass Air Flow Sensor", name_ar: "حساس كتلة تدفق الهواء",
    desc_en: "Measures the mass of air entering the intake manifold per unit time. Used by the ECU to determine the correct fuel injection quantity. A faulty MAF causes rich/lean conditions and poor acceleration.",
    desc_ar: "يقيس كتلة الهواء الداخل إلى مشعب السحب بوحدة الزمن. تستخدمه وحدة ECU لتحديد كمية الوقود الصحيحة للحقن. عطل في MAF يسبب خللاً في نسبة الخليط وضعف في التسارع.",
    logic_en: "Measuring intake air mass flow for fuel calculation", logic_ar: "قياس كتلة تدفق الهواء الداخل لحساب الوقود",
    category: "sensor",
  },
  {
    id: "MAP", sys: "Engine", volt: "1–5V", temp: "-40–125°C",
    name_en: "Manifold Absolute Pressure", name_ar: "حساس الضغط المطلق للمشعب",
    desc_en: "Monitors intake manifold pressure to calculate engine load. Works alongside the IAT sensor to determine air density. Used in speed-density fuel injection systems as an alternative to MAF.",
    desc_ar: "يراقب ضغط مشعب السحب لحساب حمل المحرك. يعمل جنباً إلى جنب مع حساس IAT لتحديد كثافة الهواء. يُستخدم في أنظمة الحقن القائمة على كثافة السرعة.",
    logic_en: "Manifold absolute pressure for load calculation", logic_ar: "قياس الضغط المطلق في المشعب لحساب الحمل",
    category: "sensor",
  },
  {
    id: "CKP", sys: "Ignition", volt: "AC Sine", temp: "-40–150°C",
    name_en: "Crankshaft Position Sensor", name_ar: "حساس موضع عمود المرفق",
    desc_en: "Determines the rotational position and speed of the crankshaft. Critical for injection timing, ignition timing, and misfire detection. A failed CKP sensor typically causes no-start conditions.",
    desc_ar: "يحدد الموضع الدوراني وسرعة عمود المرفق. أساسي لتوقيت الحقن والاشتعال واكتشاف التقطيع. عطل CKP يُسبب عادةً عدم بدء تشغيل المحرك.",
    logic_en: "Crankshaft position — determines RPM and injection timing", logic_ar: "موضع عمود المرفق — يحدد عدد الدورات وتوقيت الحقن",
    category: "sensor",
  },
  {
    id: "CMP", sys: "Ignition", volt: "0–5V sq", temp: "-40–150°C",
    name_en: "Camshaft Position Sensor", name_ar: "حساس موضع عمود الكامة",
    desc_en: "Tracks the camshaft position to coordinate valve timing with piston position. Essential for variable valve timing (VVT) systems. Used together with CKP to identify cylinder 1 TDC.",
    desc_ar: "يتتبع موضع عمود الكامة لتنسيق توقيت الصمامات مع موضع المكبس. أساسي لأنظمة توقيت الصمامات المتغير (VVT).",
    logic_en: "Camshaft position for valve timing coordination", logic_ar: "موضع عمود الكامة لتنسيق توقيت صمامات الدخول",
    category: "sensor",
  },
  {
    id: "TPS", sys: "Engine", volt: "0.5–4.5V", temp: "-40–125°C",
    name_en: "Throttle Position Sensor", name_ar: "حساس موضع خانق الهواء",
    desc_en: "Monitors the angle of the throttle plate. The ECU uses this data to determine acceleration enrichment, deceleration fuel cut, and idle speed control. Worn TPS causes hesitation and erratic idle.",
    desc_ar: "يراقب زاوية صفيحة الخانق. تستخدم ECU هذه البيانات لإثراء الوقود عند التسارع وقطع الوقود عند التباطؤ والتحكم في سرعة الخمول.",
    logic_en: "Throttle position sensor — throttle opening percentage", logic_ar: "حساس موضع خانق الهواء — نسبة فتح الخانق",
    category: "sensor",
  },
  {
    id: "O2", sys: "Emission", volt: "0.1–0.9V", temp: "350–850°C",
    name_en: "Oxygen (Lambda) Sensor", name_ar: "حساس الأكسجين (لامبدا)",
    desc_en: "Measures residual oxygen in the exhaust stream to provide closed-loop fuel trim feedback. The upstream (pre-cat) sensor controls the fuel mixture; the downstream (post-cat) monitors catalyst efficiency.",
    desc_ar: "يقيس الأكسجين المتبقي في تيار العادم لتوفير ردود فعل تصحيح الوقود في الحلقة المغلقة. الحساس الأمامي يتحكم في نسبة الخليط، والخلفي يراقب كفاءة المحفز.",
    logic_en: "Upstream lambda sensor — rich/lean exhaust feedback", logic_ar: "حساس الأكسجين — قياس نسبة الخليط غني/فقير",
    category: "sensor",
  },
  {
    id: "IAT", sys: "Engine", volt: "0.5–4.5V", temp: "-40–120°C",
    name_en: "Intake Air Temperature Sensor", name_ar: "حساس درجة حرارة هواء السحب",
    desc_en: "Measures the temperature of incoming air. Colder air is denser and requires more fuel; the ECU adjusts fuel trims accordingly. Often integrated within the MAF or MAP sensor housing.",
    desc_ar: "يقيس درجة حرارة الهواء الداخل. الهواء البارد أكثر كثافة ويحتاج وقوداً أكثر؛ وتقوم ECU بضبط تصحيحات الوقود وفقاً لذلك.",
    logic_en: "Intake air temperature — affects fuel trim", logic_ar: "حساس درجة حرارة هواء السحب — يؤثر على تصحيح الوقود",
    category: "sensor",
  },
  {
    id: "ECT", sys: "Cooling", volt: "0.5–4.5V", temp: "-40–130°C",
    name_en: "Engine Coolant Temperature", name_ar: "حساس درجة حرارة سائل التبريد",
    desc_en: "Monitors engine coolant temperature and signals the ECU for warm-up fuel enrichment, fan activation, and transmission shift points. A faulty ECT can cause overheating or excessive fuel consumption.",
    desc_ar: "يراقب درجة حرارة سائل التبريد ويُشير إلى ECU للإثراء في الإحماء وتفعيل المروحة ونقاط تغيير التروس.",
    logic_en: "Engine coolant temperature — warm-up enrichment", logic_ar: "حساس درجة حرارة سائل التبريد — إثراء الوقود أثناء الإحماء",
    category: "sensor",
  },
  {
    id: "VSS", sys: "Trans", volt: "AC pulse", temp: "-40–120°C",
    name_en: "Vehicle Speed Sensor", name_ar: "حساس سرعة السيارة",
    desc_en: "Generates a pulsed signal proportional to wheel or transmission output speed. Used by the ABS module, speedometer, transmission shift logic, and cruise control system.",
    desc_ar: "يولّد إشارة نبضية تتناسب مع سرعة الإطار أو مخرج ناقل الحركة. يُستخدم من قبل وحدة ABS وعداد السرعة ومنطق تغيير التروس ونظام التحكم في السرعة.",
    logic_en: "Vehicle speed sensor — ABS, speedometer, transmission shift", logic_ar: "حساس سرعة السيارة — ABS وعداد السرعة وناقل الحركة",
    category: "sensor",
  },
  {
    id: "KS", sys: "Engine", volt: "AC mv", temp: "-40–150°C",
    name_en: "Knock Sensor", name_ar: "حساس الطرق",
    desc_en: "Detects abnormal combustion (knock/detonation) by sensing high-frequency vibration on the engine block. When knock is detected, the ECU retards ignition timing to protect the engine from damage.",
    desc_ar: "يكتشف الاحتراق غير الطبيعي (الطرق/الاشتعال المبكر) عبر استشعار الاهتزازات عالية التردد على كتلة المحرك. عند اكتشاف الطرق، تُؤخّر ECU توقيت الاشتعال لحماية المحرك.",
    logic_en: "Knock sensor — detects detonation, retards timing", logic_ar: "حساس الطرق — يكتشف الاشتعال المبكر ويؤخر التوقيت",
    category: "sensor",
  },
  // DTC codes
  {
    id: "P0A80", sys: "BMS", volt: "N/A", temp: "N/A",
    name_en: "Hybrid Battery Pack Fault", name_ar: "عطل حزمة بطارية الهجين",
    desc_en: "Indicates cell voltage imbalance or degraded capacity in the high-voltage hybrid battery pack. Requires immediate inspection. Typically resolved by replacing the battery pack or individual modules.",
    desc_ar: "يُشير إلى عدم توازن في جهد الخلايا أو تراجع في سعة حزمة بطارية الجهد العالي الهجينة. يتطلب فحصاً فورياً.",
    logic_en: "Replace Hybrid Battery Pack — cell balance failure", logic_ar: "استبدال حزمة بطارية الهجين — فشل في توازن خلايا البطارية",
    category: "dtc",
  },
  {
    id: "P0171", sys: "Engine", volt: "N/A", temp: "N/A",
    name_en: "System Too Lean — Bank 1", name_ar: "الخليط فقير جداً — بنك 1",
    desc_en: "Long-term fuel trim (LTFT) has exceeded +25%, indicating the ECU is adding excessive fuel to compensate. Common causes: vacuum leaks, weak fuel pump, clogged injectors, or a failed MAF sensor.",
    desc_ar: "تجاوز تصحيح الوقود طويل المدى (LTFT) نسبة +25%، مما يشير إلى أن ECU تُضيف وقوداً زائداً للتعويض.",
    logic_en: "System too lean (Bank 1) — check MAF, vacuum leaks, fuel pressure", logic_ar: "الخليط فقير جداً — تحقق من MAF وتسريبات الفراغ وضغط الوقود",
    category: "dtc",
  },
  {
    id: "P0300", sys: "Ignition", volt: "N/A", temp: "N/A",
    name_en: "Random Cylinder Misfire", name_ar: "تقطيع عشوائي في الأسطوانات",
    desc_en: "Multiple or random cylinder misfires detected via crankshaft speed variation. Can be caused by faulty spark plugs, ignition coils, fuel injectors, low compression, or a vacuum leak.",
    desc_ar: "تم اكتشاف تقطيع في أسطوانات متعددة أو عشوائية عبر تغير سرعة عمود المرفق. الأسباب الشائعة: شمعات أو ملفات أو بخاخات معطوبة.",
    logic_en: "Random/Multiple cylinder misfire — check spark plugs, coils, injectors", logic_ar: "تقطيع عشوائي في أسطوانات متعددة — تحقق من الشمعات والملفات والبخاخات",
    category: "dtc",
  },
  {
    id: "P0420", sys: "Emission", volt: "N/A", temp: "N/A",
    name_en: "Catalyst Efficiency Below Threshold", name_ar: "كفاءة المحفز الحفازي أقل من الحد",
    desc_en: "The downstream O2 sensor signal is too similar to the upstream signal, indicating the catalytic converter is no longer efficiently oxidizing CO and HC. Most commonly resolved by replacing the catalyst.",
    desc_ar: "إشارة حساس O2 الخلفي مشابهة جداً للإشارة الأمامية، مما يُشير إلى أن المحول الحفاز لا يُؤكسد CO وHC بكفاءة.",
    logic_en: "Catalyst system efficiency below threshold (Bank 1)", logic_ar: "كفاءة نظام المحول الحفاز أقل من الحد (بنك 1)",
    category: "dtc",
  },
  {
    id: "U0100", sys: "CAN-Bus", volt: "N/A", temp: "N/A",
    name_en: "Lost Comm with ECM/PCM", name_ar: "فُقد الاتصال مع ECM/PCM",
    desc_en: "The vehicle's CAN-Bus network has lost communication with the Engine/Powertrain Control Module. Check CAN-H/CAN-L wiring for shorts, opens, or corrosion. Also verify the ECM power and ground circuits.",
    desc_ar: "فُقد الاتصال في شبكة CAN-Bus مع وحدة التحكم في المحرك/قطار القوى. تحقق من أسلاك CAN-H وCAN-L بحثاً عن أعطال.",
    logic_en: "Lost communication with ECM/PCM — check CAN wiring", logic_ar: "فُقد الاتصال مع ECM/PCM — تحقق من أسلاك CAN",
    category: "dtc",
  },
  {
    id: "B1479", sys: "Body", volt: "N/A", temp: "N/A",
    name_en: "A/C Pressure Sensor Fault", name_ar: "عطل حساس ضغط مكيف الهواء",
    desc_en: "Malfunction in the A/C refrigerant pressure sensor circuit. The BCM cannot read system pressure, disabling compressor clutch engagement. Check sensor wiring, connector, and refrigerant charge level.",
    desc_ar: "خلل في دائرة حساس ضغط مبرد التكييف. لا يمكن لوحدة BCM قراءة ضغط النظام، مما يُعطّل تشغيل الكمبروسر.",
    logic_en: "A/C refrigerant pressure sensor circuit malfunction", logic_ar: "خلل في دائرة حساس ضغط مبرد التكييف",
    category: "dtc",
  },
  // Protocols
  {
    id: "CAN", sys: "Network", volt: "2.5–3.5V", temp: "-40–85°C",
    name_en: "Controller Area Network", name_ar: "شبكة منطقة التحكم (CAN)",
    desc_en: "High-speed differential serial bus protocol designed by Bosch for automotive ECUs. Supports up to 1 Mb/s. Uses two wires (CAN-H and CAN-L) with 120Ω termination resistors at each end of the bus.",
    desc_ar: "بروتوكول ناقل تسلسلي تفاضلي عالي السرعة صمّمته Bosch لوحدات ECU. يدعم حتى 1 ميجابت/ث. يستخدم سلكين (CAN-H وCAN-L) مع مقاومات إنهاء 120Ω.",
    logic_en: "Controller Area Network — high-speed differential bus, up to 1 Mb/s", logic_ar: "شبكة منطقة التحكم — ناقل تفاضلي عالي السرعة حتى 1 ميجابت/ث",
    category: "protocol",
  },
  {
    id: "LIN", sys: "Network", volt: "0–12V", temp: "-40–85°C",
    name_en: "Local Interconnect Network", name_ar: "شبكة الربط المحلي (LIN)",
    desc_en: "Low-cost single-wire serial protocol used for non-critical subsystems like seat adjustment, mirror control, window motors, and HVAC. Operates at up to 20 kb/s with a master/slave architecture.",
    desc_ar: "بروتوكول تسلسلي أحادي السلك منخفض التكلفة يُستخدم للأنظمة الفرعية غير الحيوية مثل ضبط المقاعد والمرايا ومحركات النوافذ والتكييف.",
    logic_en: "Local Interconnect Network — single-wire, 20 kb/s, seat/mirror modules", logic_ar: "شبكة الربط المحلي — سلك واحد، 20 كيلوبت/ث، وحدات المقاعد والمرايا",
    category: "protocol",
  },
  {
    id: "OBD2", sys: "Diagnostic", volt: "12V", temp: "N/A",
    name_en: "On-Board Diagnostics II", name_ar: "نظام التشخيص المتكامل II",
    desc_en: "Standardized vehicle self-diagnostic and reporting protocol mandated in the US since 1996. Provides access to ECU data via PID requests over CAN, K-Line, or J1850. Enables DTC readout and live data monitoring.",
    desc_ar: "بروتوكول تشخيص ذاتي موحد للسيارات إلزامي في الولايات المتحدة منذ 1996. يوفر الوصول إلى بيانات ECU عبر طلبات PID على شبكات CAN وK-Line وJ1850.",
    logic_en: "On-Board Diagnostics II — standardized fault reporting since 1996", logic_ar: "التشخيص المتكامل الثاني — معياري لإبلاغ الأعطال منذ 1996",
    category: "protocol",
  },
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
  const [exporting, setExporting] = useState(false);
  const [selected, setSelected] = useState<ExpertEntry | null>(null);

  const handleExport = async () => {
    setExporting(true);
    const date = new Date().toISOString().slice(0, 10);
    await exportToPdf("library-export", `LaunchOPS_ExpertLibrary_${date}.pdf`);
    setExporting(false);
  };

  const filtered = expertData.filter(e => {
    const q = search.toLowerCase();
    const matchSearch =
      e.id.toLowerCase().includes(q) ||
      e.sys.toLowerCase().includes(q) ||
      e.logic_en.toLowerCase().includes(q) ||
      e.logic_ar.includes(q) ||
      e.name_en.toLowerCase().includes(q) ||
      e.name_ar.includes(q);
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

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", fontFamily: "Share Tech Mono, monospace" }}>
            {filtered.length} / {expertData.length}
          </span>
          <button
            onClick={handleExport}
            disabled={exporting}
            title={lang === "ar" ? "تصدير PDF" : "Export PDF"}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "5px 12px",
              background: exporting ? "rgba(0,242,255,0.05)" : "rgba(0,242,255,0.1)",
              border: `1px solid ${exporting ? "rgba(0,242,255,0.2)" : "rgba(0,242,255,0.4)"}`,
              borderRadius: "5px",
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
        </div>
      </div>

      {/* Filter tabs + search */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--dark-surface)", borderBottom: "1px solid var(--border-dim)", padding: "0 14px", flexShrink: 0 }}>
        <div style={{ display: "flex" }}>
          {(["all", "sensor", "dtc", "protocol"] as const).map(cat => (
            <button key={cat} style={tabStyle(cat)} onClick={() => setCategory(cat)}>
              {CATEGORY_LABELS[cat][lang]}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "7px", padding: "5px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-mid)", borderRadius: "5px", margin: "6px 0" }}>
          <Search size={11} color="var(--text-muted)" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t("lib_search")}
            dir={isRTL ? "rtl" : "ltr"}
            style={{
              background: "transparent", border: "none", outline: "none",
              color: "var(--text-primary)",
              fontSize: isRTL ? "0.65rem" : "0.6rem",
              fontFamily: isRTL ? "Cairo, sans-serif" : "Share Tech Mono, monospace",
              width: "160px",
            }}
          />
        </div>
      </div>

      {/* Hint */}
      <div style={{ padding: "5px 18px", background: "rgba(0,242,255,0.04)", borderBottom: "1px solid var(--border-dim)", flexShrink: 0 }}>
        <span style={{ fontSize: "0.5rem", color: "rgba(0,242,255,0.45)", letterSpacing: "0.08em" }}>
          {lang === "ar" ? "انقر على أي صف لعرض التفاصيل الهندسية الكاملة" : "CLICK ANY ROW TO INSPECT FULL ENGINEERING DETAILS"}
        </span>
      </div>

      {/* Table */}
      <div id="library-export" style={{ flex: 1, overflow: "auto", background: "#0a0a0a" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ position: "sticky", top: 0, background: "var(--dark-surface)", zIndex: 1 }}>
            <tr style={{ borderBottom: "1px solid var(--border-dim)" }}>
              {[
                { key: "th_sensor",  label: t("th_sensor") },
                { key: "th_system",  label: t("th_system") },
                { key: "th_voltage", label: t("th_voltage") },
                { key: "th_logic",   label: t("th_logic") },
              ].map(h => (
                <th key={h.key} data-i18n={h.key} style={{ padding: "10px 16px", textAlign: isRTL ? "right" : "left", fontSize: "0.5rem", color: "var(--text-muted)", letterSpacing: "0.1em", fontWeight: "400" }}>
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
                onClick={() => setSelected(item)}
                title={lang === "ar" ? "انقر لعرض التفاصيل" : "Click to inspect"}
                style={{ borderBottom: "1px solid #333", cursor: "pointer", transition: "background 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.background = `${CAT_COLOR[item.category]}0d`; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              >
                <td style={{ padding: "13px 16px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ color: CAT_COLOR[item.category], fontWeight: "700", fontFamily: "Share Tech Mono, monospace", fontSize: "0.7rem" }}>
                      {item.id}
                    </span>
                    <span style={{ fontSize: "0.52rem", color: "var(--text-muted)", fontFamily: isRTL ? "Cairo, sans-serif" : "inherit" }}>
                      {lang === "ar" ? item.name_ar : item.name_en}
                    </span>
                  </div>
                </td>
                <td style={{ padding: "13px 16px", fontSize: "0.62rem", color: "var(--text-primary)", letterSpacing: "0.05em" }}>
                  {item.sys}
                </td>
                <td style={{ padding: "13px 16px", fontSize: "0.62rem", color: "orange", fontFamily: "Share Tech Mono, monospace" }}>
                  {item.volt}
                </td>
                <td style={{ padding: "13px 16px", fontSize: isRTL ? "0.68rem" : "0.6rem", color: "var(--text-muted)", lineHeight: 1.6, maxWidth: "300px", fontFamily: isRTL ? "Cairo, sans-serif" : "inherit" }}>
                  {lang === "ar" ? item.logic_ar : item.logic_en}
                </td>
                <td style={{ padding: "13px 16px" }}>
                  <span style={{ fontSize: "0.48rem", padding: "2px 7px", borderRadius: "3px", background: `${CAT_COLOR[item.category]}18`, border: `1px solid ${CAT_COLOR[item.category]}44`, color: CAT_COLOR[item.category], letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
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

      {/* Anatomy overlay — portal-like, mounts over everything */}
      <AnatomyOverlay data={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
