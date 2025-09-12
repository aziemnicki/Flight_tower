"use client"

import { createContext, useContext, useMemo, useState } from "react"
import en from "@/i18n/en.json"
import pl from "@/i18n/pl.json"

type Messages = Record<string, string>
type Dict = Record<"en" | "pl", Messages>

const dictionaries: Dict = { en, pl }

type Ctx = {
  locale: "en" | "pl"
  setLocale: (l: "en" | "pl") => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const I18nCtx = createContext<Ctx>({
  locale: "en",
  setLocale: () => {},
  t: (k) => k,
})

export function I18nProvider({ defaultLocale = "en", children }: { defaultLocale?: "en" | "pl"; children: React.ReactNode }) {
  const [locale, setLocale] = useState<"en" | "pl">(defaultLocale)
  const t = (key: string, vars?: Record<string, string | number>) => {
    const dict = dictionaries[locale] ?? {}
    let msg = dict[key] ?? key
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        msg = msg.replace(new RegExp(`{${k}}`, "g"), String(v))
      })
    }
    return msg
  }
  const value = useMemo(() => ({ locale, setLocale, t }), [locale])
  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>
}

export function useI18n() {
  return useContext(I18nCtx)
}
