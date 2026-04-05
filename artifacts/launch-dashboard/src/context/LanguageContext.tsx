import { createContext, useContext, useState, useEffect } from "react";

export type Lang = "ar" | "en";

export const translations = {
  ar: {
    nav_dash: "لوحة التحكم",
    nav_topo: "خريطة الأنظمة",
    nav_scan: "الفحص الذكي",
    nav_lib: "المكتبة الهندسية",
    nav_security: "الأمان",
    nav_systems: "الأنظمة",
    nav_terminal: "الطرفية",
    nav_alerts: "التنبيهات",
    vci_status: "VCI: متصل (12.8 فولت)",
    start_scan: "بدء فحص الذكاء الاصطناعي",
    lib_title: "قاعدة بيانات الحساسات والأعطال",
    th_sensor: "الحساس / الكود",
    th_system: "النظام",
    th_voltage: "جهد التشغيل",
    th_logic: "التحليل الهندسي",
    scanning_msg: "جاري تحليل بروتوكولات CAN-Bus...",
    fault_msg: "تم اكتشاف عطل في نظام إدارة البطارية (BMS)",
    lang_label: "English",
    system_online: "النظام متصل",
    all_cores: "جميع الأنظمة تعمل",
    cpu_load: "حمل المعالج",
    mem_usage: "استخدام الذاكرة",
    uptime: "وقت التشغيل",
    threats_blocked: "التهديدات المحجوبة",
    active_nodes: "العقد النشطة",
    packets_sec: "حزمة / ثانية",
    latency_avg: "متوسط الكمون",
    command_overview: "نظرة عامة على القيادة",
    realtime_intel: "ذكاء النظام الفوري",
    vci_active: "VCI نشط",
    live_monitor: "المراقبة الحية",
    cpu_utilization: "استخدام المعالج",
    network_throughput: "معدل نقل الشبكة",
    current_load: "الحمل الحالي",
    bandwidth: "عرض النطاق",
    threat_log: "سجل التهديدات",
    events: "أحداث",
    security_posture: "وضع الأمان",
    service_registry: "سجل الخدمات",
    overall_score: "النتيجة الإجمالية",
    time: "الوقت",
    type: "النوع",
    source_ip: "IP المصدر",
    status: "الحالة",
    sev: "الخطورة",
    name: "الاسم",
    latency: "الكمون",
    // AI Scanner page
    scan_title: "الفحص الذكي بالذكاء الاصطناعي",
    scan_subtitle: "تشخيص بروتوكول CAN-Bus — محرك استدلال الخبراء",
    scan_run: "بدء فحص الذكاء الاصطناعي",
    scan_ready: "النظام جاهز. اضغط لبدء التشخيص.",
    scan_running: "جاري تحليل بروتوكولات CAN-Bus...",
    scan_complete: "اكتمل الفحص — تم العثور على أعطال",
    scan_clean: "اكتمل الفحص — لم يتم اكتشاف أعطال",
    scan_status: "حالة الفحص",
    scan_log: "سجل التشخيص",
    dtc_found: "أكواد الأعطال المكتشفة",
    no_dtc: "لا توجد أكواد أعطال",
    // Library page
    lib_search: "بحث في قاعدة البيانات...",
    lib_subtitle: "قاعدة بيانات الحساسات والأعطال الهندسية",
    // Instructor mode
    instructor_btn: "وضع المحاضر",
    instructor_on: "✅ وضع المحاضر مفعّل — اضغط Esc للخروج",
    instructor_off: "وضع المحاضر متوقف",
    answers_hidden: "الإجابات مخفية",
    answers_visible: "الإجابات ظاهرة",
  },
  en: {
    nav_dash: "Dashboard",
    nav_topo: "Topology Map",
    nav_scan: "AI Scanner",
    nav_lib: "Expert Library",
    nav_security: "Security",
    nav_systems: "Systems",
    nav_terminal: "Terminal",
    nav_alerts: "Alerts",
    vci_status: "VCI: Connected (12.8V)",
    start_scan: "Start AI Diagnostic",
    lib_title: "Sensors & DTC Database",
    th_sensor: "Sensor / Code",
    th_system: "System",
    th_voltage: "Voltage",
    th_logic: "Engineering Logic",
    scanning_msg: "Analyzing CAN-Bus protocols...",
    fault_msg: "Fault detected in Battery Management System (BMS)",
    lang_label: "عربي",
    system_online: "SYSTEM ONLINE",
    all_cores: "ALL CORES OPERATIONAL",
    cpu_load: "CPU LOAD",
    mem_usage: "MEM USAGE",
    uptime: "UPTIME",
    threats_blocked: "THREATS BLOCKED",
    active_nodes: "ACTIVE NODES",
    packets_sec: "PACKETS / SEC",
    latency_avg: "LATENCY AVG",
    command_overview: "COMMAND OVERVIEW",
    realtime_intel: "REAL-TIME SYSTEM INTELLIGENCE",
    vci_active: "VCI ACTIVE",
    live_monitor: "LIVE MONITOR",
    cpu_utilization: "CPU UTILIZATION",
    network_throughput: "NETWORK THROUGHPUT",
    current_load: "CURRENT LOAD",
    bandwidth: "BANDWIDTH",
    threat_log: "THREAT ACTIVITY LOG",
    events: "EVENTS",
    security_posture: "SECURITY POSTURE",
    service_registry: "SERVICE REGISTRY",
    overall_score: "OVERALL SCORE",
    time: "TIME",
    type: "TYPE",
    source_ip: "SOURCE IP",
    status: "STATUS",
    sev: "SEV",
    name: "NAME",
    latency: "LATENCY",
    // AI Scanner page
    scan_title: "AI DIAGNOSTIC SCANNER",
    scan_subtitle: "CAN-Bus Protocol Diagnostics — Expert Inference Engine",
    scan_run: "Start AI Diagnostic",
    scan_ready: "System ready. Press to begin diagnostics.",
    scan_running: "Analyzing CAN-Bus protocols...",
    scan_complete: "Scan complete — faults found",
    scan_clean: "Scan complete — no faults detected",
    scan_status: "SCAN STATUS",
    scan_log: "DIAGNOSTIC LOG",
    dtc_found: "FAULT CODES DETECTED",
    no_dtc: "NO FAULT CODES",
    // Library page
    lib_search: "Search database...",
    lib_subtitle: "Sensors & Engineering Fault Database",
    // Instructor mode
    instructor_btn: "Instructor Mode",
    instructor_on: "✅ Instructor Mode — Press Esc to exit",
    instructor_off: "Instructor Mode deactivated",
    answers_hidden: "Answers hidden",
    answers_visible: "Answers visible",
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

interface LangCtx {
  lang: Lang;
  toggle: () => void;
  t: (key: TranslationKey) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LangCtx>({
  lang: "en",
  toggle: () => {},
  t: (key) => key,
  isRTL: false,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    document.body.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const toggle = () => setLang(l => (l === "en" ? "ar" : "en"));
  const t = (key: TranslationKey): string => translations[lang][key] as string;

  return (
    <LanguageContext.Provider value={{ lang, toggle, t, isRTL: lang === "ar" }}>
      <div
        dir={lang === "ar" ? "rtl" : "ltr"}
        style={{
          height: "100%",
          fontFamily: lang === "ar"
            ? "'Cairo', 'Orbitron', sans-serif"
            : "'Orbitron', sans-serif",
        }}
      >
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
