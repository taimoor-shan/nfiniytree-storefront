import "server-only"
import { translate } from "@lib/i18n/dictionaries"
import { verifyTurnstile } from "@lib/util/turnstile"
import { headers } from "next/headers"
import { getLocale } from "./locale-actions"

/**
 * Checks the Turnstile token a protected form submitted.
 *
 * Returns null when the submission may go ahead, otherwise the translated
 * message to show. Off when the site key is missing: without it the widget is
 * not on the page, so no visitor could ever send a token, and a secret alone
 * must not lock everyone out.
 */
export async function turnstileError(
  formData: FormData
): Promise<string | null> {
  if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
    return null
  }

  const token = formData.get("cf-turnstile-response")
  const outcome = await verifyTurnstile(token, {
    secret: process.env.TURNSTILE_SECRET_KEY,
    ip: (await headers()).get("cf-connecting-ip"),
  })

  if (outcome.status === "rejected") {
    // Bots land here all day, but so does every real visitor when the widget or
    // the keys are misconfigured, so say why. Never the token itself.
    console.info(
      `[turnstile] rejected (${token ? "token sent" : "no token"}): ${outcome.codes.join(", ") || "no error code"}`
    )
    return translate("turnstile.failed", await getLocale())
  }

  if (outcome.status === "unavailable") {
    console.warn(`[turnstile] verification unavailable: ${outcome.reason}`)
  }

  return null
}
