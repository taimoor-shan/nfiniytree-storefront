import "server-only"
import { headers as nextHeaders } from "next/headers"
import { portalSdk, sdk } from "@lib/config"
import { getAuthHeaders } from "./cookies"

/**
 * A returning customer at checkout, recognised by email instead of being made
 * to sign in.
 *
 * The address step asks a signed-out visitor for a password so a business
 * customer gets an account. A visitor whose email already has one used to be
 * asked too, and refused at the very end of the form ("you already have an
 * account, please log in"). Now the form asks whether the email has an
 * account as soon as it is typed (`checkEmailHasAccount`), leaves out the
 * password fields when it has, and `setAddresses` checks again on the server
 * and puts the cart on that account. Nobody is signed in by this: the visitor
 * proved nothing, so they see nothing of the account (Medusa's cart and order
 * routes say only the customer's id and email, see the backend's
 * `withoutCustomerDetails`); their order simply lands in it, and their sales
 * rep is credited.
 */

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** The visitor's address: Cloudflare's header first, which a visitor can't set */
const visitorAddress = async (): Promise<string | null> => {
  const headers = await nextHeaders()
  return (
    headers.get("cf-connecting-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    null
  )
}

/**
 * Whether the email belongs to an account: true, false, or null when it
 * could not be checked (not an email, the visitor asked too often, Medusa
 * unreachable). Callers treat null as "unknown" and keep the password fields.
 *
 * Medusa is asked at its direct address (`portalSdk`, `MEDUSA_BACKEND_URL`):
 * through the public domain Cloudflare would stamp every check with this
 * server's own address, and the backend's limit of 20 checks per visitor in
 * ten minutes would be shared by everyone. The visitor's address goes along
 * as `X-Forwarded-For`.
 */
export const emailHasAccount = async (email: string): Promise<boolean | null> => {
  const value = String(email ?? "").trim()
  if (!EMAIL_SHAPE.test(value)) {
    return null
  }

  try {
    const address = await visitorAddress()
    const { has_account } = await portalSdk.client.fetch<{ has_account: boolean }>(
      "/store/checkout/account-status",
      {
        method: "POST",
        body: { email: value },
        headers: address ? { "x-forwarded-for": address } : {},
        cache: "no-store",
      }
    )
    return has_account === true
  } catch {
    return null
  }
}

/**
 * Puts a signed-out visitor's cart on the account its email belongs to (the
 * backend's `attach-cart-to-account` workflow). Called once the cart carries
 * the email. A failure is logged and never stops the checkout: the order is
 * then placed on a guest record, as before this existed.
 */
export const attachCartToAccount = async (cartId: string): Promise<void> => {
  try {
    await sdk.client.fetch(`/store/carts/${cartId}/attach-account`, {
      method: "POST",
      headers: { ...(await getAuthHeaders()) },
    })
  } catch (error) {
    console.warn(
      `[checkout] could not put cart ${cartId} on its email's account: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  }
}
