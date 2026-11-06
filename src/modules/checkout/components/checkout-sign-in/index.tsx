"use client"

import { useTranslation } from "@/lib/i18n"
import { useMarketPrefix } from "@lib/context/market-context"
import { login } from "@lib/data/customer"
import { stripMarketPrefix } from "@lib/i18n/market"
import { Button } from "@medusajs/ui"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import TurnstileWidget from "@modules/common/components/turnstile-widget"
import { usePathname, useSearchParams } from "next/navigation"
import { useActionState } from "react"

/**
 * "Already have an account? Sign in", standing on its own above the address
 * form. The client found the sign-in after the address confusing: a returning
 * customer filled in everything, was told at the end to sign in, went to the
 * top, signed in and came back. Here they sign in first, in place, and the
 * step reopens with their saved addresses. It is the account page's sign-in
 * (`login`): Turnstile, the guest cart moved to the account, then back to this
 * very step. Signing in stays optional: a recognised email needs no password.
 */
const CheckoutSignIn = ({
  open,
  onOpenChange,
  email,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The email already typed in the address form, to start with */
  email?: string
}) => {
  const { t } = useTranslation()
  const prefix = useMarketPrefix()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [message, formAction] = useActionState(login, null)

  // Back to this step in the same language (`/en-hu/checkout?step=address`)
  const query = searchParams.toString()
  const returnUrl = `/${prefix}${stripMarketPrefix(pathname)}${query ? `?${query}` : ""}`

  return (
    <section
      className="mb-8 rounded-lg border border-hairline bg-surface-card p-5"
      aria-labelledby="checkout-sign-in-title"
      data-testid="checkout-sign-in"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-y-1">
          <p id="checkout-sign-in-title" className="txt-medium-plus text-ink">
            {t("cart.alreadyHaveAccount")}
          </p>
          <p className="txt-medium text-body">{t("checkout.signIn.intro")}</p>
        </div>
        {open ? null : (
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(true)}
            aria-expanded={false}
            aria-controls="checkout-sign-in-form"
            data-testid="checkout-sign-in-open"
          >
            {t("account.signIn")}
          </Button>
        )}
      </div>

      {open ? (
        <form
          id="checkout-sign-in-form"
          action={formAction}
          className="mt-4 flex flex-col gap-y-3"
        >
          <input type="hidden" name="returnUrl" value={returnUrl} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t("account.email")}
              name="email"
              type="email"
              title={t("common.emailNotValid")}
              autoComplete="email"
              defaultValue={email}
              required
              data-testid="checkout-sign-in-email"
            />
            <Input
              label={t("account.password")}
              name="password"
              type="password"
              autoComplete="current-password"
              required
              data-testid="checkout-sign-in-password"
            />
          </div>
          <a
            href={`/${prefix}/account/forgot-password`}
            className="self-start text-small-regular text-link hover:underline"
          >
            {t("account.forgotPassword")}
          </a>
          <TurnstileWidget />
          <ErrorMessage error={message} data-testid="checkout-sign-in-error" />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <SubmitButton data-testid="checkout-sign-in-button">
              {t("account.signIn")}
            </SubmitButton>
            <button
              type="button"
              className="text-link"
              onClick={() => onOpenChange(false)}
              data-testid="checkout-sign-in-close"
            >
              {t("checkout.signIn.close")}
            </button>
          </div>
        </form>
      ) : null}
    </section>
  )
}

export default CheckoutSignIn
