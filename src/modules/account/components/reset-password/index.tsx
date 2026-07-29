"use client"

import { useTranslation } from "@/lib/i18n"
import { resetPassword } from "@lib/data/customer"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import { useActionState } from "react"
import { useRouter, useSearchParams, useParams } from "next/navigation"

const ResetPassword = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useParams()
  const countryCode = (params.countryCode as string) || "en"
  const token = searchParams.get("token") || ""
  const email = searchParams.get("email") || ""

  const handleResetPassword = async (
    _currentState: any,
    formData: FormData
  ) => {
    const password = formData.get("new_password") as string
    const confirmPassword = formData.get("confirm_password") as string

    if (!password || password.length < 8) {
      return "Password must be at least 8 characters"
    }

    if (password !== confirmPassword) {
      return "Passwords do not match"
    }

    if (!token) {
      return "Invalid or missing reset token. Please request a new password reset link."
    }

    try {
      const result = await resetPassword(email, token, password)
      if (result.success) {
        router.push(`/${countryCode}/account`)
        return null
      }
      return result.error || "Failed to reset password"
    } catch (error: any) {
      return error.toString()
    }
  }

  const [message, formAction] = useActionState(handleResetPassword, null)

  if (!token) {
    return (
      <div className="max-w-sm w-full flex flex-col items-center" data-testid="reset-password-error">
        <h1 className="text-large-semi uppercase mb-6">{t("account.invalidLink") || "Invalid Link"}</h1>
        <p className="text-center text-base-regular text-ink mb-8">
          {t("account.invalidLinkPrompt") || "This password reset link is invalid or has expired. Please request a new one."}
        </p>
        <a href={`/${countryCode}/account/forgot-password`} className="text-link text-small-regular hover:underline">
          {t("account.requestNewLink") || "Request a new reset link"}
        </a>
      </div>
    )
  }

  return (
    <div className="max-w-sm w-full flex flex-col items-center" data-testid="reset-password-page">
      <h1 className="text-large-semi uppercase mb-6">{t("account.resetPassword") || "Reset Your Password"}</h1>
      <p className="text-center text-base-regular text-ink mb-8">
        {t("account.resetPasswordPrompt") || "Enter your new password below."}
      </p>
      <form className="w-full" action={formAction}>
        <div className="flex flex-col w-full gap-y-4">
          <Input
            label={t("account.newPassword")}
            name="new_password"
            type="password"
            required
            data-testid="new-password-input"
          />
          <Input
            label={t("account.confirmPassword")}
            name="confirm_password"
            type="password"
            required
            data-testid="confirm-password-input"
          />
        </div>
        <ErrorMessage error={message} data-testid="reset-password-error-message" />
        <SubmitButton data-testid="reset-password-submit-button" className="w-full mt-6">
          {t("account.updatePassword") || "Update Password"}
        </SubmitButton>
      </form>
    </div>
  )
}

export default ResetPassword
