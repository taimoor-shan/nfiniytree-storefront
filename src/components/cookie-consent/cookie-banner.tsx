"use client"

import { clx } from "@medusajs/ui"
import { Cookie, Settings } from "lucide-react"
import { useCookieConsent } from "./cookie-provider"
import { CookieConsentCopy, defaultCookieConsentCopy } from "./copy"

export interface CookieBannerProps {
  className?: string
  /**
   * Localized strings. Defaults to English; pass the storefront's localized
   * copy via the boundary component.
   */
  copy?: CookieConsentCopy
}

/**
 * Cookie consent banner.
 *
 * Rendered once per device until a choice is made. Position comes from
 * `config.position` — the storefront uses "bottom-right", the floating dark
 * card specified as `cookie-consent-card` in DESIGN.md.
 *
 * Note: the upstream OpenConsent banner animates with framer-motion; this
 * version is intentionally dependency-free and uses the storefront's existing
 * Tailwind keyframes instead (ANIMATED on mount only).
 */
export function CookieBanner({
  className,
  copy = defaultCookieConsentCopy,
}: CookieBannerProps) {
  const { isBannerVisible, acceptAll, rejectAll, openSettings, config } =
    useCookieConsent()

  const positionClasses = {
    bottom: "inset-x-0 bottom-0",
    top: "inset-x-0 top-0",
    "bottom-left": "bottom-4 left-4 max-w-md",
    "bottom-right": "bottom-4 right-4 max-w-md",
  }

  const position = config.position ?? "bottom-right"

  if (!isBannerVisible) return null

  return (
    <div
      className={clx(
        "fixed z-50 p-4",
        position === "top" ? "animate-fade-in-top" : "animate-slide-up-in",
        positionClasses[position],
        className
      )}
      role="dialog"
      aria-label={copy.bannerTitle}
    >
      {/* `cookie-consent-card` (DESIGN.md): dark surface at small scale on
          cream pages, rounded-lg, 24px padding. */}
      <div
        className={clx(
          "rounded-lg bg-surface-dark p-6 text-on-dark shadow-2xl",
          position === "bottom" || position === "top" ? "mx-auto max-w-5xl" : ""
        )}
      >
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-dark-elevated">
            <Cookie className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1">
            <h2 className="font-display text-base text-on-dark">
              {copy.bannerTitle}
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-on-dark-soft">
              {copy.bannerDescription}{" "}
              {config.privacyPolicyUrl && (
                <a
                  href={config.privacyPolicyUrl}
                  className="text-primary underline underline-offset-4 transition-opacity hover:opacity-80"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {copy.learnMore}
                </a>
              )}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openSettings}
            className="flex items-center gap-2 text-sm text-on-dark-soft transition-colors hover:text-on-dark"
          >
            <Settings className="h-4 w-4" />
            {copy.customize}
          </button>
          <button
            type="button"
            onClick={rejectAll}
            className="rounded-md border border-on-dark-soft/40 px-4 py-2 text-sm text-on-dark-soft transition-colors hover:border-on-dark-soft hover:text-on-dark"
          >
            {copy.rejectAll}
          </button>
          {/* Coral stays scarce: only the primary CTA gets the brand colour. */}
          <button type="button" onClick={acceptAll} className="btn-primary">
            {copy.acceptAll}
          </button>
        </div>
      </div>
    </div>
  )
}
