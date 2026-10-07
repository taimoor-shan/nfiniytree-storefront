"use server"

import { sdk } from "@lib/config"
import { translate } from "@lib/i18n/dictionaries"
import { serverBackendUrl } from "@lib/util/backend-url"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import {
  getSalesRepAuthHeaders,
  removeSalesRepAuthToken,
  setSalesRepAuthToken,
} from "./cookies"
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

// The recruiting calls read the error's `code` from the response body, which
// the SDK's fetch drops, so they use plain fetch. They go to the address this
// server reaches Medusa at, because the public one doesn't route the plugin's
// /sales-portal and /sales-invites paths to it.

const BACKEND_URL = serverBackendUrl()

type BackendResult =
  | { ok: true; data: any }
  | { ok: false; status: number; code: string | null }

async function backendRequest(
  path: string,
  init: { method: string; body?: unknown; token?: string }
): Promise<BackendResult> {
  try {
    const response = await fetch(`${BACKEND_URL}${path}`, {
      method: init.method,
      headers: {
        "content-type": "application/json",
        ...(init.token ? { authorization: `Bearer ${init.token}` } : {}),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
    })
    const json = await response.json().catch(() => ({}))

    return response.ok
      ? { ok: true, data: json }
      : { ok: false, status: response.status, code: json?.code ?? null }
  } catch {
    return { ok: false, status: 0, code: null }
  }
}

/** A failed call as a sentence in the visitor's language. */
async function failureText(
  result: Extract<BackendResult, { ok: false }>,
  locale: string | null
): Promise<string> {
  const key = result.code
    ? `salesPortal.error.${result.code}`
    : result.status === 401
      ? "salesPortal.sessionExpired"
      : result.status === 403
        ? "salesPortal.noAccess.text"
        : result.status === 400
          ? "salesPortal.error.invalid"
          : "salesPortal.loadError"
  const text = await translate(key, locale)

  // An unknown code has no sentence of its own
  return text === key ? await translate("salesPortal.loadError", locale) : text
}

export type RecruitFormState = {
  /** Set when the invitation was sent: the email it went to */
  sent: string | null
  error: string | null
  /** What was typed, given back after an error so the form can keep it */
  values?: { name: string; email: string; note: string }
}

export async function inviteRecruit(
  _state: RecruitFormState,
  formData: FormData
): Promise<RecruitFormState> {
  const locale = await getLocale()
  const token = (await getSalesRepAuthHeaders()).authorization?.replace("Bearer ", "")
  if (!token) {
    return { sent: null, error: await translate("salesPortal.sessionExpired", locale) }
  }

  const values = {
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    note: String(formData.get("note") ?? "").trim(),
  }
  const result = await backendRequest("/sales-portal/recruits", {
    method: "POST",
    token,
    body: {
      ...values,
      note: values.note || null,
      // The invitation is emailed in the language the rep is using
      locale,
    },
  })
  if (!result.ok) {
    return { sent: null, error: await failureText(result, locale), values }
  }

  revalidatePath("/[countryCode]/sales-portal/recruits", "page")
  return { sent: values.email, error: null }
}

/** Sends an invitation again with a new link, or withdraws it. Returns an error text, or null. */
export async function updateRecruitInvite(
  id: string,
  action: "resend" | "cancel"
): Promise<string | null> {
  const locale = await getLocale()
  const token = (await getSalesRepAuthHeaders()).authorization?.replace("Bearer ", "")
  if (!token) {
    return await translate("salesPortal.sessionExpired", locale)
  }

  const path = `/sales-portal/recruits/${encodeURIComponent(id)}`
  const result =
    action === "resend"
      ? await backendRequest(`${path}/resend`, { method: "POST", token, body: { locale } })
      : await backendRequest(path, { method: "DELETE", token })
  if (!result.ok) {
    return await failureText(result, locale)
  }

  revalidatePath("/[countryCode]/sales-portal/recruits", "page")
  return null
}

export type ApplyFormState = {
  applied: boolean
  error: string | null
  /** What was entered, given back after an error so the form can keep it */
  values?: {
    name: string
    phone: string
    company: string
    currency: string
    accept_terms: boolean
  }
}

/** A candidate applies through their personal link. No sign-in: the link is the credential. */
export async function applyToInvite(
  token: string,
  language: string,
  _state: ApplyFormState,
  formData: FormData
): Promise<ApplyFormState> {
  // The page is shown in the language of the email, which the form carries along
  const locale = /^[a-z]{2}(-[A-Z]{2})?$/.test(language) ? language : await getLocale()

  const values = {
    name: String(formData.get("name") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    company: String(formData.get("company") ?? "").trim(),
    currency: String(formData.get("currency") ?? ""),
    accept_terms: formData.get("accept_terms") === "on",
  }
  const result = await backendRequest(`/sales-invites/${encodeURIComponent(token)}/apply`, {
    method: "POST",
    body: {
      name: values.name,
      phone: values.phone || null,
      company: values.company || null,
      requested_currency_code: values.currency || null,
      accept_terms: values.accept_terms,
    },
  })
  if (!result.ok) {
    return { applied: false, error: await failureText(result, locale), values }
  }

  return { applied: true, error: null }
}
