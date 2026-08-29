// Main exports for cookie consent components
export { ConsentScript } from "./consent-script"
export { CookieBanner } from "./cookie-banner"
export {
  CookieConsentProvider,
  defaultCategories,
  useConsentGate,
  useConsentValue,
  useCookieConsent,
} from "./cookie-provider"
export { CookieSettings } from "./cookie-settings"
export { CookieTrigger } from "./cookie-trigger"
export {
  GoogleConsentMode,
  defaultGoogleConsentMapping,
} from "./google-consent-mode"
export { useConsentScript } from "./use-consent-script"
export { defaultCookieConsentCopy } from "./copy"
export type { CookieConsentCopy } from "./copy"

// Types
export type {
  BannerPosition,
  CategoryConfig,
  ConsentAction,
  ConsentCategories,
  ConsentCategory,
  ConsentChangeEvent,
  ConsentRecord,
  ConsentScope,
  ConsentScopeConfig,
  ConsentState,
  CookieConsentConfig,
  CookieConsentContextValue,
  GoogleConsentModeConfig,
  ScriptConfig,
  TraceabilityConfig,
} from "./types"

// Utilities
export {
  getLoadedScripts,
  hasGoogleScripts,
  loadScript,
  registerCleanup,
  registerScript,
  scriptCleanupHelpers,
  unloadScript,
  unregisterScript,
} from "./script-manager"
export { retryFailedRecords, trackConsent } from "./tracker"
export { generateUUID, getVisitorId, isGoogleScript } from "./utils"

// Note: Test utilities are not exported from the main index to avoid
// bundling test dependencies in production builds.
// (The upstream registry exports CookieBannerBackdrop here; that module is not
// part of the published registry block, so the export is intentionally
// dropped — the banner itself is self-contained.)
