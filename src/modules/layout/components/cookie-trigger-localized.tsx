"use client"

import { useTranslation } from "@lib/i18n/client"
import {
  CookieTrigger,
  defaultCookieConsentCopy,
} from "@/components/cookie-consent"

/**
 * Localized footer trigger that reopens the cookie settings dialog.
 *
 * Renders nothing until the visitor has answered the banner (the upstream
 * OpenConsent behaviour for `CookieTrigger`).
 */
export function CookieTriggerLocalized() {
  const { t } = useTranslation()

  return (
    <CookieTrigger
      copy={{
        ...defaultCookieConsentCopy,
        trigger: t("cookie.trigger", defaultCookieConsentCopy.trigger),
        triggerLabel: t(
          "cookie.triggerLabel",
          defaultCookieConsentCopy.triggerLabel
        ),
      }}
    />
  )
}
