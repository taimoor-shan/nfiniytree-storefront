"use client"

import { useState } from "react"
import { clx } from "@medusajs/ui"
import { sdk } from "@lib/config"
import { useTranslation } from "@lib/i18n/client"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import TurnstileWidget from "@modules/common/components/turnstile-widget"

/**
 * Newsletter sign-up with double opt-in. The backend saves the address as
 * pending and emails a confirmation link; nothing is sent until the visitor
 * confirms (`/newsletter/confirm`). The consent sentence under the field is
 * the one the backend stores with the sign-up.
 *
 * It used to pretend: a timer showed "Thank you for subscribing!" and the
 * address went nowhere.
 */
export default function NewsletterForm() {
  const { t, locale } = useTranslation()
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Read the form before the first await: the event is gone after it.
    const turnstileToken = new FormData(e.currentTarget).get("cf-turnstile-response")
    setStatus("loading")
    setErrorMessage("")
    try {
      await sdk.client.fetch("/store/newsletter", {
        method: "POST",
        body: { email, locale },
        headers: turnstileToken
          ? { "x-turnstile-token": String(turnstileToken) }
          : undefined,
      })
      setStatus("success")
      setEmail("")
    } catch (err: any) {
      setErrorMessage(err?.status === 403 ? t("turnstile.failed") : t("newsletter.error"))
      setStatus("error")
    }
  }

  const [consentBefore, consentAfter] = t("newsletter.consent").split("{privacy}")

  if (status === "success") {
    return (
      <p role="status" className="text-sm text-success mt-4 max-w-[360px]">
        {t("newsletter.success")}
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col w-full mt-4 gap-2">
      <div className="flex max-w-[360px]">
        <input
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("newsletter.placeholder")}
          aria-label={t("account.email")}
          aria-describedby="newsletter-consent"
          className="flex-grow min-w-0 border border-primary px-4 rounded-l-sm bg-canvas text-base focus:outline-none focus:border-primary focus-visible:ring-1 focus-visible:ring-primary text-ink"
          required
          aria-required="true"
          disabled={status === "loading"}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className={clx(
            "btn-primary rounded-l-none",
            status === "loading" && "opacity-75 cursor-not-allowed"
          )}
        >
          {status === "loading" ? "…" : t("newsletter.submit")}
        </button>
      </div>
      <p id="newsletter-consent" className="text-xs text-muted max-w-[360px]">
        {consentBefore}
        <LocalizedClientLink href="/policies/privacy" className="underline underline-offset-2">
          {t("newsletter.privacyLink")}
        </LocalizedClientLink>
        {consentAfter}
      </p>
      <TurnstileWidget />
      {status === "error" && errorMessage && (
        <p className="text-xs text-error" role="alert">
          {errorMessage}
        </p>
      )}
    </form>
  )
}
