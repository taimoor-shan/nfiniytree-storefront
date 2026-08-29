"use client"
import { clx } from "@medusajs/ui"
import { Cookie } from "lucide-react"
import { useCookieConsent } from "./cookie-provider"
import { CookieConsentCopy, defaultCookieConsentCopy } from "./copy"

export interface CookieTriggerProps {
  className?: string
  variant?: "icon" | "text" | "full"
  /** Localized strings (defaults to English). */
  copy?: CookieConsentCopy
}

/**
 * A trigger button to reopen cookie settings after initial consent
 */
export function CookieTrigger({
  className,
  variant = "text",
  copy = defaultCookieConsentCopy,
}: CookieTriggerProps) {
  const { openSettings, state } = useCookieConsent()

  if (!state.hasConsented) {
    return null
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={openSettings}
        className={clx(
          "inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:text-ink",
          className
        )}
        aria-label={copy.triggerLabel}
      >
        <Cookie className="h-4 w-4" />
      </button>
    )
  }

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={openSettings}
        className={clx("btn-primary-outlined gap-2", className)}
      >
        <Cookie className="h-4 w-4" />
        {copy.trigger}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={openSettings}
      className={clx(
        "text-sm text-muted underline underline-offset-4 transition-colors hover:text-ink",
        className
      )}
    >
      {copy.trigger}
    </button>
  )
}
