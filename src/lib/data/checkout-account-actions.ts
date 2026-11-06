"use server"

import { emailHasAccount } from "./checkout-account"

/**
 * The address step asks this when the email field is left, so a returning
 * customer is greeted and asked for no password (see `./checkout-account`).
 * Public like every server action: it answers only yes, no or "don't know",
 * and the backend limits how often one visitor may ask.
 */
export async function checkEmailHasAccount(email: string): Promise<boolean | null> {
  return emailHasAccount(email)
}
