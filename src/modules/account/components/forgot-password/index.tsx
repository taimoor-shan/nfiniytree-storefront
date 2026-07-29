"use client"

import { useTranslation } from "@/lib/i18n"
import { requestPasswordReset } from "@lib/data/customer"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import { useActionState, useState } from "react"
import { useParams } from "next/navigation"

const ForgotPassword = () => {
  const { t } = useTranslation()
  const [message, formAction, isPending] = useActionState(requestPasswordReset, null)
  const [submitted, setSubmitted] = useState(false)
  const params = useParams()
  const countryCode = (params.countryCode as string) || "en"

  const handleFormAction = (formData: FormData) => {
    setSubmitted(true)
    formAction(formData)
  }

  if (submitted && !isPending && !message) {
    return (
      <div className="max-w-sm w-full flex flex-col items-center" data-testid="forgot-password-success">
        <h1 className="text-large-semi uppercase mb-6">{t("account.checkEmail")}</h1>
        <p className="text-center text-base-regular text-ink mb-8">
          {t("account.resetLinkSent")}
        </p>
        <a
          href={`/${countryCode}/account`}
          className="text-link text-small-regular hover:underline"
        >
          {t("account.backToLogin")}
        </a>
      </div>
    )
  }

  return (
    <div className="max-w-sm w-full flex flex-col items-center" data-testid="forgot-password-page">
      <h1 className="text-large-semi uppercase mb-6">{t("account.forgotPassword")}</h1>
      <p className="text-center text-base-regular text-ink mb-8">
        {t("account.forgotPasswordPrompt")}
      </p>
      <form className="w-full" action={handleFormAction}>
        <div className="flex flex-col w-full gap-y-2">
          <Input
            label={t("account.email")}
            name="email"
            type="email"
            title="Enter a valid email address."
            autoComplete="email"
            required
            data-testid="forgot-password-email-input"
          />
        </div>
        <ErrorMessage error={message} data-testid="forgot-password-error-message" />
        <SubmitButton data-testid="forgot-password-submit-button" className="w-full mt-6">
          {t("account.sendResetLink")}
        </SubmitButton>
      </form>
      <span className="text-center text-ink text-small-regular mt-6">
        <a
          href={`/${countryCode}/account`}
          className="text-link hover:underline"
        >
          {t("account.backToLogin")}
        </a>
      </span>
    </div>
  )
}

export default ForgotPassword
