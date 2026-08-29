"use client"

import { useMemo } from "react"
import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import { useTranslation } from "@lib/i18n/client"
import { CookieConsentProvider } from "./cookie-provider"
import { defaultCookieConsentCopy, type CookieConsentCopy } from "./copy"
import type { CategoryConfig, CookieConsentConfig } from "./types"

// Banner and settings render nothing until the provider emits their
// visibility state, so they are safe to load after hydration — this keeps
// the whole consent UI (and its Radix primitives) out of the initial chunk
// of every page.
const CookieBanner = dynamic(
  () => import("./cookie-banner").then((m) => m.CookieBanner),
  { ssr: false }
)
const CookieSettings = dynamic(
  () => import("./cookie-settings").then((m) => m.CookieSettings),
  { ssr: false }
)

/**
 * Client boundary that bridges the storefront's i18n layer to the
 * OpenConsent UI.
 *
 * Reads the active locale dictionary (en / de-AT / de-DE / hu-HU) through
 * `useTranslation` and builds:
 *  - the consent copy passed to the banner + settings dialog,
 *  - the localized cookie category labels,
 *  - the locale-aware privacy-policy URL (`/{countryCode}/policies/privacy`).
 */
export function CookieConsentBoundary({
  children,
}: {
  children: React.ReactNode
}) {
  const { t } = useTranslation()
  const pathname = usePathname()

  const countryCode = useMemo(() => {
    if (typeof pathname !== "string") return undefined
    const [, first] = pathname.split("/")
    return first && /^[a-z]{2}(-[A-Z]{2})?$/.test(first) ? first : undefined
  }, [pathname])

  const copy = useMemo<CookieConsentCopy>(
    () => ({
      bannerTitle: t(
        "cookie.bannerTitle",
        defaultCookieConsentCopy.bannerTitle
      ),
      bannerDescription: t(
        "cookie.bannerDescription",
        defaultCookieConsentCopy.bannerDescription
      ),
      learnMore: t("cookie.learnMore", defaultCookieConsentCopy.learnMore),
      customize: t("cookie.customize", defaultCookieConsentCopy.customize),
      rejectAll: t("cookie.rejectAll", defaultCookieConsentCopy.rejectAll),
      acceptAll: t("cookie.acceptAll", defaultCookieConsentCopy.acceptAll),
      settingsTitle: t(
        "cookie.settingsTitle",
        defaultCookieConsentCopy.settingsTitle
      ),
      settingsDescription: t(
        "cookie.settingsDescription",
        defaultCookieConsentCopy.settingsDescription
      ),
      required: t("cookie.required", defaultCookieConsentCopy.required),
      savePreferences: t(
        "cookie.savePreferences",
        defaultCookieConsentCopy.savePreferences
      ),
      privacyNote: t(
        "cookie.privacyNote",
        defaultCookieConsentCopy.privacyNote
      ),
      privacyPolicy: t(
        "cookie.privacyPolicy",
        defaultCookieConsentCopy.privacyPolicy
      ),
      // Trigger copy is only rendered by CookieTriggerLocalized, which reads
      // the dictionary itself — kept here so the copy object stays complete.
      trigger: t("cookie.trigger", defaultCookieConsentCopy.trigger),
      triggerLabel: t(
        "cookie.triggerLabel",
        defaultCookieConsentCopy.triggerLabel
      ),
    }),
    [t]
  )

  const categories = useMemo<CategoryConfig[]>(
    () => [
      {
        key: "necessary",
        title: t("cookie.category.necessary.title", "Necessary"),
        description: t(
          "cookie.category.necessary.description",
          "Essential cookies required for the website to function properly. These cannot be disabled."
        ),
        required: true,
      },
      {
        key: "analytics",
        title: t("cookie.category.analytics.title", "Analytics"),
        description: t(
          "cookie.category.analytics.description",
          "Cookies that help us understand how visitors interact with our website."
        ),
      },
      {
        key: "marketing",
        title: t("cookie.category.marketing.title", "Marketing"),
        description: t(
          "cookie.category.marketing.description",
          "Cookies used for advertising and tracking across websites."
        ),
      },
      {
        key: "preferences",
        title: t("cookie.category.preferences.title", "Preferences"),
        description: t(
          "cookie.category.preferences.description",
          "Cookies that remember your settings and preferences."
        ),
      },
    ],
    [t]
  )

  const config = useMemo<CookieConsentConfig>(
    () => ({
      consentVersion: "1.0.0",
      expirationDays: 365,
      // Bottom-right floating dark card — `cookie-consent-card` in DESIGN.md.
      position: "bottom-right",
      privacyPolicyUrl: countryCode
        ? `/${countryCode}/policies/privacy`
        : "/policies/privacy",
      categories,
      // Consent audit trail — see src/app/api/consent/route.ts. Records are
      // only attempted after the visitor answers the banner (never while a
      // script is merely present).
      traceability: {
        enabled: true,
        endpoint: "/api/consent",
        method: "POST",
        retryOnFailure: true,
        maxRetries: 3,
        includeUserAgent: false,
        includeUrl: true,
      },
      // Google Consent Mode v2 stays OFF unless a Google script is actually
      // registered through <ConsentScript> — the provider auto-enables it with
      // the default ad_storage/analytics_storage mapping in that case.
    }),
    [countryCode, categories]
  )

  return (
    <CookieConsentProvider config={config}>
      {/* Children render inside the provider so any component in the tree
          (e.g. the footer's CookieTrigger) can read the consent context. The
          wrapper div preserves the original root-layout structure. */}
      <div className="relative">{children}</div>
      <CookieBanner copy={copy} />
      <CookieSettings copy={copy} />
    </CookieConsentProvider>
  )
}
