import "server-only"
import { cookies as nextCookies } from "next/headers"
import {
  REFERRAL_COOKIE,
  lookupReferrer,
  normalizeReferralCode,
} from "@lib/util/referral"

/**
 * The sales rep's client link the visitor followed. The proxy puts the code in
 * a cookie when a page is opened with `?ref=CODE`; creating an account hands
 * it to the sales commission plugin (see `createCustomerAccount`).
 */

/** The code the visitor followed, or null. */
export const getReferralCode = async (): Promise<string | null> => {
  try {
    const cookies = await nextCookies()
    return normalizeReferralCode(cookies.get(REFERRAL_COOKIE)?.value)
  } catch {
    return null
  }
}

/** Forgets the link once it has been used for an account. */
export const clearReferralCode = async () => {
  const cookies = await nextCookies()
  cookies.set(REFERRAL_COOKIE, "", { maxAge: -1, path: "/" })
}

/**
 * Who invited the visitor, to say so next to a sign-up form. Null when there is
 * no link, or it no longer leads to a rep.
 */
export const getReferrer = async (): Promise<{
  code: string
  name: string
} | null> => {
  const code = await getReferralCode()
  if (!code) {
    return null
  }
  const answer = await lookupReferrer(code)

  return answer.status === "found" ? { code, name: answer.name } : null
}
