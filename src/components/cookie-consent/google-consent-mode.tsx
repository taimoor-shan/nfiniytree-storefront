"use client"

import * as React from "react"
import { useCookieConsent } from "./cookie-provider"
import type { ConsentCategories, GoogleConsentModeConfig } from "./types"

export type GoogleConsentKey =
  | "analytics_storage"
  | "ad_storage"
  | "ad_user_data"
  | "ad_personalization"
  | "functionality_storage"
  | "personalization_storage"
  | "security_storage"

export type ConsentStatus = "granted" | "denied"

export type GoogleConsentState = Partial<
  Record<GoogleConsentKey, ConsentStatus>
>

/**
 * Default category → Google consent-type mapping. `security_storage` is bound
 * to the "necessary" bucket (always granted); everything else maps to the
 * three non-essential categories.
 */
export const defaultGoogleConsentMapping: NonNullable<
  GoogleConsentModeConfig["mapping"]
> = {
  analytics_storage: "analytics",
  ad_storage: "marketing",
  ad_user_data: "marketing",
  ad_personalization: "marketing",
  functionality_storage: "preferences",
  personalization_storage: "preferences",
  security_storage: "necessary",
}

/**
 * Initial consent state pushed with `consent default` before any Google tag
 * fires. Everything denied except security_storage, matching Google's EU/EEA/UK
 * Consent Mode v2 requirements.
 */
export const defaultGoogleConsentDefaults: Record<
  GoogleConsentKey,
  ConsentStatus
> = {
  analytics_storage: "denied",
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  functionality_storage: "denied",
  personalization_storage: "denied",
  security_storage: "granted",
}

interface GoogleConsentModeProps {
  /** Initial "denied" defaults to push with `consent default`. */
  defaults?: Partial<Record<GoogleConsentKey, ConsentStatus>>
  /** Regions the default consent applies to (empty = all regions). */
  regions?: string[]
  /** Category → Google consent-type mapping used to derive updates. */
  mapping?: GoogleConsentModeConfig["mapping"]
}

declare global {
  // TS has no DOM typings for the gtag/dataLayer globals GTM introduces.
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

/**
 * Build a `consent update` payload from the current consent categories using
 * the (defaulted) mapping.
 */
function buildConsentUpdate(
  categories: ConsentCategories,
  mapping?: GoogleConsentModeConfig["mapping"]
): GoogleConsentState {
  const map =
    mapping && Object.keys(mapping).length > 0
      ? mapping
      : defaultGoogleConsentMapping
  const update: GoogleConsentState = {}

  ;(Object.keys(defaultGoogleConsentMapping) as GoogleConsentKey[]).forEach(
    (key) => {
      const category = map[key] ?? defaultGoogleConsentMapping[key]!
      update[key] = categories[category] ?? false ? "granted" : "denied"
    }
  )

  return update
}

/**
 * Google Consent Mode v2.
 *
 * Sets up the `dataLayer` + `gtag` stub, pushes `consent default` (all denied
 * by default) so every Google tag is privacy-safe from the first byte, then
 * pushes `consent update` whenever the user's consent categories change.
 *
 * The `CookieConsentProvider` only mounts this component when Google scripts
 * are detected (`hasGoogleScripts`), so it never initializes on sites without
 * Google services.
 */
export function GoogleConsentMode({
  defaults = {},
  regions,
  mapping,
}: GoogleConsentModeProps) {
  const { state } = useCookieConsent()

  // Initial "consent default" — must be pushed before any Google tag reads it.
  React.useEffect(() => {
    if (typeof window === "undefined") return

    window.dataLayer = window.dataLayer || []
    window.gtag =
      window.gtag ||
      function (...args: unknown[]): void {
        ;(window.dataLayer as unknown[]).push(args)
      }

    window.gtag("consent", "default", {
      ...defaultGoogleConsentDefaults,
      ...defaults,
      ...(regions && regions.length > 0 ? { region: regions } : {}),
    })
  }, [defaults, regions])

  const update = React.useMemo(
    () => buildConsentUpdate(state.categories, mapping),
    [state.categories, mapping]
  )

  // Keep Google consent in sync with the stored consent categories — covers
  // both live changes and restore-after-reload.
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.gtag) return
    window.gtag("consent", "update", update)
  }, [update])

  return null
}

GoogleConsentMode.displayName = "GoogleConsentMode"
