"use client"

import { useTranslation } from "@/lib/i18n"
import React, { useEffect, useActionState } from "react"
import Input from "@modules/common/components/input"
import AccountInfo from "../account-info"
import { HttpTypes } from "@medusajs/types"
import { updateCustomerPassword } from "@lib/data/customer"

type MyInformationProps = {
  customer: HttpTypes.StoreCustomer
}

const ProfilePassword: React.FC<MyInformationProps> = ({ customer }) => {
  const { t } = useTranslation()
  const [successState, setSuccessState] = React.useState(false)

  const updatePassword = async (
    _currentState: Record<string, unknown>,
    formData: FormData
  ) => {
    const oldPassword = formData.get("old_password") as string
    const newPassword = formData.get("new_password") as string
    const confirmPassword = formData.get("confirm_password") as string

    if (!oldPassword || !newPassword || !confirmPassword) {
      return { success: false, error: "All fields are required" }
    }

    if (newPassword !== confirmPassword) {
      return { success: false, error: "Passwords do not match" }
    }

    if (newPassword.length < 8) {
      return { success: false, error: "Password must be at least 8 characters" }
    }

    try {
      const result = await updateCustomerPassword(customer.email, oldPassword, newPassword)
      if (result.success) {
        return { success: true, error: null }
      }
      return { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: error.toString() }
    }
  }

  const [state, formAction] = useActionState(updatePassword, {
    error: null,
    success: false,
  })

  const clearState = () => {
    setSuccessState(false)
  }

  useEffect(() => {
    setSuccessState(state.success)
  }, [state])

  return (
    <form
      action={formAction}
      onReset={() => clearState()}
      className="w-full"
    >
      <AccountInfo
        label={t("account.password")}
        currentInfo={
          <span>{t("account.passwordNotShown")}</span>
        }
        isSuccess={successState}
        isError={!!state.error}
        errorMessage={state.error || undefined}
        clearState={clearState}
        data-testid="account-password-editor"
      >
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t("account.oldPassword")}
            name="old_password"
            required
            type="password"
            data-testid="old-password-input"
          />
          <Input
            label={t("account.newPassword")}
            type="password"
            name="new_password"
            required
            data-testid="new-password-input"
          />
          <Input
            label={t("account.confirmPassword")}
            type="password"
            name="confirm_password"
            required
            data-testid="confirm-password-input"
          />
        </div>
      </AccountInfo>
    </form>
  )
}

export default ProfilePassword
