"use client"

import { useTranslation } from "@/lib/i18n"
import { login } from "@lib/data/customer"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import { useActionState } from "react"
import { useParams, useSearchParams } from "next/navigation"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Login = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(login, null)
  const { t } = useTranslation()
  const params = useParams()
  const searchParams = useSearchParams()
  const countryCode = (params.countryCode as string) || "en"
  const returnUrl = searchParams.get("returnUrl") || ""

  return (
    <div
      className="max-w-sm w-full flex flex-col items-center"
      data-testid="login-page"
    >
      <h1 className="text-large-semi uppercase mb-6">{t("account.welcomeBack")}</h1>
      <p className="text-center text-base-regular text-ink mb-8">
        {t("account.signInPrompt")}
      </p>
      <form className="w-full" action={formAction}>
        {returnUrl && <input type="hidden" name="returnUrl" value={returnUrl} />}
        <div className="flex flex-col w-full gap-y-2">
          <Input
            label={t("account.email")}
            name="email"
            type="email"
            title={t("common.emailNotValid")}
            autoComplete="email"
            required
            data-testid="email-input"
          />
          <Input
            label={t("account.password")}
            name="password"
            type="password"
            autoComplete="current-password"
            required
            data-testid="password-input"
          />
        </div>
        <div className="flex justify-end mt-1">
          <a
            href={`/${countryCode}/account/forgot-password`}
            className="text-small-regular text-link hover:underline"
          >
            {t("account.forgotPassword") || "Forgot password?"}
          </a>
        </div>
        <ErrorMessage error={message} data-testid="login-error-message" />
        <SubmitButton data-testid="sign-in-button" className="w-full mt-6">
          {t("account.signIn")}
        </SubmitButton>
      </form>
      <span className="text-center text-ink text-small-regular mt-6">
        {t("account.notMember")}{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.REGISTER)}
          className="text-link"
          data-testid="register-button"
        >
          {t("account.joinUs")}
        </button>
        .
      </span>
    </div>
  )
}

export default Login
