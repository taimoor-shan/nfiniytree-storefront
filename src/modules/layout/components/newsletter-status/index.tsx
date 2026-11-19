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
  const [state, setState] = useState<"idle" | "loading" | "done" | "invalid" | "error">(
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
    } catch (e) {
      // The backend refusing the token (4xx) means a bad link; a network or
      // server failure does not, so the visitor can try again.
      const status = (e as { status?: number })?.status
      setState(status && status < 500 ? "invalid" : "error")
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
    return (
      <p role="alert" className="text-body">
        {t(action === "confirm" ? "newsletter.linkInvalid" : "newsletter.unsubscribeLinkInvalid")}
      </p>
    )
  }
  return (
    <div className="flex flex-col items-start gap-3">
      {state === "error" && (
        <p role="alert" className="text-body">{t("newsletter.statusError")}</p>
      )}
    <button type="button" className="btn-primary" onClick={submit} disabled={state === "loading"}>
      {state === "loading"
        ? "…"
        : t(action === "confirm" ? "newsletter.confirmButton" : "newsletter.unsubscribeButton")}
    </button>
    </div>
  )
}
