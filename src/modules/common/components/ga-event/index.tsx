"use client"

import { useEffect } from "react"
import { trackEvent, type Once } from "@lib/analytics/ga4"

type GaEventProps = {
  name: string
  params: Record<string, unknown>
  /** Sends the event once per key, so reloading the page does not count it again. */
  once?: Once
}

/**
 * Sends one GA4 event when a server-rendered page appears, for pages whose
 * data only the server has (the checkout, the order confirmation). Renders
 * nothing; the event waits for consent like any other (`trackEvent`).
 */
export default function GaEvent({ name, params, once }: GaEventProps) {
  useEffect(() => {
    trackEvent(name, params, once)
    // Once per page: a server refresh hands in a new `params` object with the
    // same content, which must not send the event again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, once?.key])

  return null
}
