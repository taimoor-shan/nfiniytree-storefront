import type { Dictionary } from "./types"

/**
 * Dictionary modules — statically imported so Next.js bundles them.
 * Each file is a flat Record<string, string>.
 */
const dictionaryModules: Record<string, () => Promise<{ default: Dictionary }>> = {
  en: () => import("@/i18n/dictionaries/en.json") as Promise<{ default: Dictionary }>,
  "de-AT": () => import("@/i18n/dictionaries/de-AT.json") as Promise<{ default: Dictionary }>,
  "de-DE": () => import("@/i18n/dictionaries/de-DE.json") as Promise<{ default: Dictionary }>,
  "hu-HU": () => import("@/i18n/dictionaries/hu-HU.json") as Promise<{ default: Dictionary }>,
}

/** In-memory cache to avoid re-loading the same dictionary */
const cache = new Map<string, Dictionary>()

/**
 * Resolve a locale string to the best available dictionary.
 *
 * Fallback order:
 *  1. Exact match:        "de-AT" → de-AT.json
 *  2. Language-only:      "de-AT" → de.json  (strip region suffix)
 *  3. Ultimate fallback:  en.json
 */
export async function getDictionary(locale: string | null): Promise<Dictionary> {
  const raw = locale || "en"

  // 1. Exact match
  if (dictionaryModules[raw]) {
    return loadAndCache(raw, dictionaryModules[raw])
  }

  // 2. Language-only fallback (e.g. "de-AT" → "de")
  const lang = raw.split("-")[0]
  if (dictionaryModules[lang]) {
    return loadAndCache(lang, dictionaryModules[lang])
  }

  // 3. Ultimate fallback
  return loadAndCache("en", dictionaryModules["en"])
}

async function loadAndCache(
  key: string,
  loader: () => Promise<{ default: Dictionary }>
): Promise<Dictionary> {
  if (cache.has(key)) return cache.get(key)!

  const mod = await loader()
  const dict = mod.default
  cache.set(key, dict)
  return dict
}

/**
 * Look up a single key from a locale dictionary with graceful fallback.
 * Useful for server components that only need one or two keys.
 */
export async function translate(
  key: string,
  locale: string | null,
  fallback?: string
): Promise<string> {
  const dict = await getDictionary(locale)
  return dict[key] ?? fallback ?? key
}
