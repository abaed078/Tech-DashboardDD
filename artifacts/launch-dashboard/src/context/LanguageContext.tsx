import { createContext, useContext, useState } from "react";

type Lang = "en" | "ar";

interface LangCtx {
  lang: Lang;
  toggle: () => void;
  t: (en: string, ar: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LangCtx>({
  lang: "en",
  toggle: () => {},
  t: (en) => en,
  isRTL: false,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");

  const toggle = () => setLang(l => (l === "en" ? "ar" : "en"));
  const t = (en: string, ar: string) => (lang === "ar" ? ar : en);

  return (
    <LanguageContext.Provider value={{ lang, toggle, t, isRTL: lang === "ar" }}>
      <div dir={lang === "ar" ? "rtl" : "ltr"} style={{ height: "100%", fontFamily: lang === "ar" ? "'Cairo', 'Orbitron', sans-serif" : undefined }}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
