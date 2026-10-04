"use server"

import { sdk } from "@lib/config"
import { translate } from "@lib/i18n/dictionaries"
import { redirect } from "next/navigation"
import { removeSalesRepAuthToken, setSalesRepAuthToken } from "./cookies"
import { getLocale } from "./locale-actions"
import { localizeError } from "./localize-error"

// Sales reps sign in, reset passwords and register through Medusa's own auth
// routes (/auth/sales_rep/emailpass), the same way customers do with the
// "customer" actor. Access is given by an admin, so there is no sign-up here.

export async function salesRepLogin(
  _currentState: unknown,
  formData: FormData
) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  try {
    const token = await sdk.auth.login("sales_rep", "emailpass", {
      email,
      password,
    })
    await setSalesRepAuthToken(token as string)
  } catch (error: any) {
    return await localizeError(error)
  }

  // No redirect: setting the cookie re-renders the page, which then shows
  // the portal instead of the sign-in form.
  return null
}

export async function salesRepSignout(countryCode: string) {
  await removeSalesRepAuthToken()

  // The argument comes from the browser: only ever redirect to a path on this
  // site (the proxy adds the country when there is none).
  redirect(
    /^[a-z]{2}$/i.test(countryCode)
      ? `/${countryCode}/sales-portal`
      : "/sales-portal"
  )
}

export async function requestSalesRepPasswordReset(
  _currentState: unknown,
  formData: FormData
) {
  const email = formData.get("email") as string

  if (!email) {
    return await translate("account.emailRequired", await getLocale())
  }

  try {
    await sdk.auth.resetPassword("sales_rep", "emailpass", {
      identifier: email,
    })
    return null
  } catch (error: any) {
    return await localizeError(error)
  }
}

export async function resetSalesRepPassword(
  _email: string,
  token: string,
  password: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    await sdk.auth.updateProvider("sales_rep", "emailpass", { password }, token)
    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: await localizeError(error) }
  }
}
