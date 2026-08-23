"use client"

import { Button, clx } from "@medusajs/ui"
import { useState } from "react"
import { sdk } from "@lib/config"
import { useTranslation } from "@lib/i18n/client"

type NotifyMeFormProps = {
  productId: string
  productTitle: string
  variantId: string
  variantTitle?: string
  defaultEmail?: string
  disabled?: boolean
  className?: string
}

export default function NotifyMeForm({
  productId,
  productTitle,
  variantId,
  variantTitle,
  defaultEmail,
  disabled,
  className,
}: NotifyMeFormProps) {
  const { t } = useTranslation()
  const [email, setEmail] = useState(defaultEmail || "")
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus("loading")
    setErrorMessage("")
    try {
      await sdk.client.fetch("/store/notify-me", {
        method: "POST",
        body: {
          email,
          productId,
          productTitle,
          variantId,
          variantTitle,
          productUrl: window.location.href,
        },
      })
      setStatus("success")
    } catch (err: any) {
      if (err.status === 429) {
        setErrorMessage(
          err.message || t("product.notifyMe.rateLimited")
        )
      } else {
        const message = Array.isArray(err.message)
          ? err.message.map((m: any) => m.message || m).join(", ")
          : err.message
        setErrorMessage(message || t("product.notifyMe.error"))
      }
      setStatus("error")
    }
  }

  if (status === "success") {
    return (
      <p
        className="text-sm text-success"
        role="status"
        data-testid="notify-me-success"
      >
        {t("product.notifyMe.success")}
      </p>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={clx("flex flex-col gap-y-2 w-full", className)}
      data-testid="notify-me-form"
    >
      <div className="flex">
        <input
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("product.notifyMe.emailPlaceholder")}
          required
          aria-required="true"
          disabled={disabled || status === "loading"}
          aria-label={t("product.notifyMe.emailPlaceholder")}
          // A border-colour swap alone is too weak a focus indicator against a
          // hairline border; the ring keeps focus unambiguous without changing
          // the resting appearance.
          className="flex-grow min-w-0 border border-hairline px-4 rounded-l-sm bg-canvas text-base focus:outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary text-ink"
        />
        <Button
          type="submit"
          variant="primary"
          isLoading={status === "loading"}
          disabled={disabled}
          className="rounded-l-none h-10"
          data-testid="notify-me-submit"
        >
          {t("product.notifyMe.submit")}
        </Button>
      </div>
      {status === "error" && errorMessage && (
        <p className="text-xs text-error" role="alert">
          {errorMessage}
        </p>
      )}
    </form>
  )
}
