"use client"

import { clx } from "@medusajs/ui"
import { useTranslation } from "@lib/i18n/client"
import ErrorMessage from "@modules/checkout/components/error-message"
import { useEffect, useRef, useState } from "react"

const SCRIPT_URL =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"

type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string
  reset: (widgetId: string) => void
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

let scriptPromise: Promise<TurnstileApi> | null = null

/**
 * Loads Cloudflare's script once per page. A failed load clears the promise
 * so the next widget to mount can try again.
 */
function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) {
    return Promise.resolve(window.turnstile)
  }

  if (!scriptPromise) {
    scriptPromise = new Promise<TurnstileApi>((resolve, reject) => {
      const script = document.createElement("script")

      const fail = (message: string) => {
        scriptPromise = null
        script.remove()
        reject(new Error(message))
      }

      script.src = SCRIPT_URL
      script.async = true
      script.defer = true
      script.onload = () =>
        window.turnstile ? resolve(window.turnstile) : fail("Turnstile did not start")
      script.onerror = () => fail("Turnstile could not be loaded")
      document.head.appendChild(script)
    })
  }

  return scriptPromise
}

type Props = {
  className?: string
}

/**
 * Cloudflare Turnstile. Put it inside a <form>: the widget adds a hidden
 * `cf-turnstile-response` input to it, so the form's own submit carries the
 * token to the server. Renders nothing when no site key is configured.
 */
export default function TurnstileWidget({ className }: Props) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  const { t, locale } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)
  const [interactive, setInteractive] = useState(false)
  const language = locale.split("-")[0]

  useEffect(() => {
    const container = containerRef.current
    if (!siteKey || !container) {
      return
    }

    let cancelled = false
    let widgetId: string | undefined
    const form = container.closest("form")

    // Every submit spends the token, whatever the outcome, so ask for a fresh
    // one. The timeout lets the form read the current token first.
    const resetAfterSubmit = () => {
      setTimeout(() => {
        if (!cancelled && widgetId) {
          window.turnstile?.reset(widgetId)
        }
      }, 0)
    }

    loadTurnstile()
      .then((turnstile) => {
        if (cancelled) {
          return
        }

        widgetId = turnstile.render(container, {
          sitekey: siteKey,
          appearance: "interaction-only",
          size: "flexible",
          theme: "light",
          language,
          "refresh-expired": "auto",
          callback: () => setFailed(false),
          "error-callback": () => setFailed(true),
          "before-interactive-callback": () => setInteractive(true),
          "after-interactive-callback": () => setInteractive(false),
        })
        form?.addEventListener("submit", resetAfterSubmit)
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true)
        }
      })

    return () => {
      cancelled = true
      form?.removeEventListener("submit", resetAfterSubmit)
      if (widgetId) {
        window.turnstile?.remove(widgetId)
      }
    }
  }, [siteKey, language])

  if (!siteKey) {
    return null
  }

  return (
    <>
      {/* Out of the layout while Cloudflare solves the challenge silently, so
          it adds no gap to the form; in the flow when a click is needed. */}
      <div
        ref={containerRef}
        className={clx(interactive ? "mt-2" : "sr-only", className)}
        data-testid="turnstile-widget"
      />
      <ErrorMessage
        error={failed ? t("turnstile.unavailable") : null}
        data-testid="turnstile-error"
      />
    </>
  )
}
