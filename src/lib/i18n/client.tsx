"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { Dictionary } from "./types"

// ── Static English fallback (used when no provider is mounted) ──
import enDict from "@/i18n/dictionaries/en.json"

// ── In-memory cache of loaded dictionaries (shared across components) ──
const dictCache = new Map<string, Dictionary>([["en", enDict as unknown as Dictionary]])

// ── Context ──

type TranslationState = {
  t: (key: string, fallback?: string) => string
  dict: Dictionary | null
  locale: string
}

const TranslationContext = createContext<TranslationState>({
  t: (key, fallback) => fallback ?? key,
  dict: enDict as unknown as Dictionary,
  locale: "en",
})

// ── Public hook ──

/**
 * Client-side translation hook.
 *
 * Reads translations from the nearest `<LocaleProvider>`. Falls back to a
 * static English dictionary when used outside a provider (e.g. in isolated
 * tests or storybook).
 *
 * Usage (unchanged from before):
 *   const { t } = useTranslation()
 *   <span>{t("nav.home")}</span>
 */
export function useTranslation() {
  return useContext(TranslationContext)
}

// ── Provider ──

/**
 * Reads the `_medusa_locale` cookie value client-side.
 * Only used inside event handlers / effects, never during initial SSR render.
 */
function getLocaleFromCookie(): string {
  if (typeof document === "undefined") return "en"
  const match = document.cookie.match(/(?:^|;\s*)_medusa_locale=([^;]*)/)
  return match ? decodeURIComponent(match[1]) || "en" : "en"
}

/**
 * Seeds the translation context with a server-provided locale and dictionary
 * so the server-rendered HTML and the client's first render are identical
 * (no hydration mismatch).
 *
 * Wrap your root layout with this provider:
 *
 * ```tsx
 * // app/layout.tsx (Server Component)
 * import { cookies } from "next/headers"
 * import { getDictionary } from "@/lib/i18n/dictionaries"
 * import { LocaleProvider } from "@/lib/i18n"
 *
 * const cookieLocale = cookies().get("_medusa_locale")?.value ?? "en"
 * const dict = await getDictionary(cookieLocale)
 *
 * return <LocaleProvider initialLocale={cookieLocale} initialDict={dict}>
 *   {children}
 * </LocaleProvider>
 * ```
 */
export function LocaleProvider({
  initialLocale,
  initialDict,
  children,
}: {
  initialLocale: string
  initialDict: Dictionary
  children: React.ReactNode
}) {
  const [dict, setDict] = useState<Dictionary>(initialDict)
  const [locale, setLocale] = useState<string>(initialLocale)

  // ── Sync when server props change (e.g. after router.refresh()) ──
  useEffect(() => {
    setLocale(initialLocale)
    setDict(initialDict)
  }, [initialLocale, initialDict])

  // ── Load dictionary for a locale (cache-aware, async) ──
  const loadAndSetDict = useCallback((targetLocale: string) => {
    if (dictCache.has(targetLocale)) {
      setDict(dictCache.get(targetLocale)!)
      return
    }

    loadDict(targetLocale)
      .then((d) => {
        dictCache.set(targetLocale, d)
        setDict(d)
      })
      .catch(() => {
        // Ultimate fallback — return empty so t() returns the key
        setDict({})
      })
  }, [])

  // ── Listen for locale-change events (dispatched by language switchers) ──
  useEffect(() => {
    const handleLocaleChange = () => {
      const newLocale = getLocaleFromCookie()
      setLocale(newLocale)
      loadAndSetDict(newLocale)
    }

    document.addEventListener("localechange", handleLocaleChange)
    return () => document.removeEventListener("localechange", handleLocaleChange)
  }, [loadAndSetDict])

  // ── Translation function ──
  const t = useCallback(
    (key: string, fallback?: string): string => {
      if (!dict) return fallback ?? key
      return dict[key] ?? fallback ?? key
    },
    [dict]
  )

  const value = useMemo<TranslationState>(
    () => ({ t, dict, locale }),
    [t, dict, locale]
  )

  return (
    <TranslationContext value={value}>
      {children}
    </TranslationContext>
  )
}

// ── Helpers (unchanged from before) ──

/**
 * Dynamic import for a locale dictionary.
 * Tries exact locale first, then language-only, then English.
 */
async function loadDict(locale: string): Promise<Dictionary> {
  const candidates = [locale, locale.split("-")[0], "en"]

  for (const candidate of candidates) {
    try {
      const mod = await importDict(candidate)
      if (mod) return mod
    } catch {
      continue
    }
  }

  return {}
}

async function importDict(code: string): Promise<Dictionary | null> {
  switch (code) {
    case "en":
      return (await import("@/i18n/dictionaries/en.json")).default
    case "de":
    case "de-AT":
      return (await import("@/i18n/dictionaries/de-AT.json")).default
    case "de-DE":
      return (await import("@/i18n/dictionaries/de-DE.json")).default
    case "hu":
    case "hu-HU":
      return (await import("@/i18n/dictionaries/hu-HU.json")).default
    default:
      return null
  }
}
