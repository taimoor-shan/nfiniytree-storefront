"use server"

import {
  lookupReferrer,
  normalizeReferralCode,
  type ReferrerLookup,
} from "@lib/util/referral"
import { getReferrer } from "./referral"

/**
 * The name of the rep who invited the visitor, for a client component that
 * can't read the cookie itself (the checkout's account section).
 */
export async function getReferrerName(): Promise<string | null> {
  return (await getReferrer())?.name ?? null
}

/**
 * Whose code a visitor typed into the sign-up form, so a mistyped one is
 * caught as they leave the field, before a failed submit clears the form.
 */
export async function checkReferralCode(value: string): Promise<ReferrerLookup> {
  const code = normalizeReferralCode(value)

  return code ? lookupReferrer(code) : { status: "unknown" }
}
