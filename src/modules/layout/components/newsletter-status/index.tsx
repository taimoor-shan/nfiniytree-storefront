"use client"

import { useState } from "react"
import { sdk } from "@lib/config"
import { useTranslation } from "@lib/i18n/client"

/**
 * The page behind the links in the newsletter emails. The visitor presses the
 * button, so a mail scanner that opens every link confirms or unsubscribes
 * nobody.
 */
export default function NewsletterStatus({
  action,
  token,
}: {
  action: "confirm" | "unsubscribe"
  token: string
}) {
  const { t } = useTranslation()
  const [state, setState] = useState<"idle" | "loading" | "done" | "invalid">(
    token ? "idle" : "invalid"
  )

  const submit = async () => {
    setState("loading")
    try {
      const { found } = await sdk.client.fetch<{ found: boolean }>(
        "/store/newsletter/status",
        { method: "POST", body: { action, token } }
      )
      setState(found ? "done" : "invalid")
    } catch {
      setState("invalid")
    }
  }

  if (state === "done") {
    return (
      <p role="status" className="text-success">
        {t(action === "confirm" ? "newsletter.confirmed" : "newsletter.unsubscribed")}
      </p>
    )
  }
  if (state === "invalid") {
    return <p role="alert" className="text-body">{t("newsletter.linkInvalid")}</p>
  }
  return (
    <button type="button" className="btn-primary" onClick={submit} disabled={state === "loading"}>
      {state === "loading"
        ? "…"
        : t(action === "confirm" ? "newsletter.confirmButton" : "newsletter.unsubscribeButton")}
    </button>
  )
}
