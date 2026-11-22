"use client"

import { useState } from "react"
import { sdk } from "@lib/config"
import { useTranslation } from "@lib/i18n/client"
import TurnstileWidget from "@modules/common/components/turnstile-widget"

export const SHOP_EMAIL = "info@infinytree.com"

type Received = { received_at: string; order_number: string; email: string }

const inputClass =
  "w-full border border-hairline rounded-sm px-4 py-2.5 bg-canvas text-base text-ink focus:outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary"

/**
 * The online withdrawal function (EU Directive 2023/2673): the consumer names
 * themselves and the contract, and "Confirm withdrawal" sends the declaration.
 * The backend saves it and emails a confirmation of receipt; this form shows
 * the same confirmation on screen, with the time of receipt.
 */
export default function WithdrawalForm({ orderNumber }: { orderNumber?: string }) {
  const { t, locale } = useTranslation()
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")
  const [error, setError] = useState("")
  const [received, setReceived] = useState<Received | null>(null)

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const turnstileToken = form.get("cf-turnstile-response")
    const value = (key: string) => String(form.get(key) ?? "").trim()
    setStatus("loading")
    setError("")
    try {
      const { withdrawal } = await sdk.client.fetch<{
        withdrawal: { received_at: string; order_number: string }
      }>("/store/withdrawals", {
        method: "POST",
        body: {
          name: value("name"),
          email: value("email"),
          order_number: value("order_number"),
          items: value("items") || undefined,
          message: value("message") || undefined,
          locale,
        },
        headers: turnstileToken
          ? { "x-turnstile-token": String(turnstileToken) }
          : undefined,
      })
      setReceived({ ...withdrawal, email: value("email") })
    } catch (err: any) {
      setError(
        (err?.status === 429
          ? t("withdrawal.rateLimited")
          : err?.status === 403
            ? t("turnstile.failed")
            : t("withdrawal.error")
        ).replace("{email}", SHOP_EMAIL)
      )
      setStatus("error")
    }
  }

  if (received) {
    const date = new Intl.DateTimeFormat(locale || "en", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date(received.received_at))
    return (
      <div role="status" className="rounded-lg border border-hairline bg-surface-card p-6" data-testid="withdrawal-received">
        <h2 className="text-xl font-display text-ink mb-2">{t("withdrawal.successTitle")}</h2>
        <p className="text-body">
          {t("withdrawal.successBody")
            .replace("{date}", date)
            .replace("{order}", received.order_number)
            .replace("{email}", received.email)}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" data-testid="withdrawal-form">
      <label className="flex flex-col gap-1 text-sm text-ink">
        {t("withdrawal.name")}
        <input name="name" required autoComplete="name" maxLength={200} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm text-ink">
        {t("withdrawal.email")}
        <input name="email" type="email" required autoComplete="email" className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm text-ink">
        {t("withdrawal.orderNumber")}
        <input name="order_number" required defaultValue={orderNumber} maxLength={40} inputMode="numeric" className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm text-ink">
        {t("withdrawal.items")}
        <textarea name="items" rows={2} maxLength={2000} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm text-ink">
        {t("withdrawal.message")}
        <textarea name="message" rows={3} maxLength={2000} className={inputClass} />
      </label>
      <p className="text-body text-sm border-l-2 border-primary pl-3">{t("withdrawal.declaration")}</p>
      <TurnstileWidget />
      {status === "error" && error && (
        <p role="alert" className="text-sm text-error">{error}</p>
      )}
      <button type="submit" className="btn-primary self-start" disabled={status === "loading"}>
        {status === "loading" ? "…" : t("withdrawal.submit")}
      </button>
    </form>
  )
}
