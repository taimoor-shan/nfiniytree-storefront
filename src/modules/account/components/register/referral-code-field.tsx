"use client"

import { checkReferralCode } from "@lib/data/referral-actions"
import { useTranslation } from "@lib/i18n"
import Input from "@modules/common/components/input"
import { useRef, useState } from "react"

type Check = { status: "idle" } | { status: "found"; name: string } | { status: "unknown" }

/**
 * The code a client was given in person. Checked as they leave the field, so
 * they see whose it is, or that it is wrong, before they submit: a refused
 * submit clears the form. The server checks it again.
 */
const ReferralCodeField = () => {
  const { t } = useTranslation()
  const input = useRef<HTMLInputElement>(null)
  const [check, setCheck] = useState<Check>({ status: "idle" })

  // A wrong code blocks the submit with the same sentence, as the browser's own validation
  const show = (next: Check) => {
    setCheck(next)
    input.current?.setCustomValidity(
      next.status === "unknown" ? t("account.referralCodeUnknown") : ""
    )
  }

  const verify = async (value: string) => {
    if (!value.trim()) {
      return show({ status: "idle" })
    }
    const answer = await checkReferralCode(value)
    // An answer that could not be had is not a reason to refuse: the server decides on submit
    show(
      answer.status === "found"
        ? { status: "found", name: answer.name }
        : answer.status === "unknown"
          ? { status: "unknown" }
          : { status: "idle" }
    )
  }

  return (
    <Input
      ref={input}
      label={t("account.referralCode")}
      name="referral_code"
      autoComplete="off"
      maxLength={24}
      onChange={() => show({ status: "idle" })}
      onBlur={(event) => verify(event.target.value)}
      error={check.status === "unknown" ? t("account.referralCodeUnknown") : null}
      helperText={
        check.status === "found"
          ? t("account.referralCodeFound").replaceAll("{name}", check.name)
          : t("account.referralCodeHint")
      }
      data-testid="referral-code-input"
    />
  )
}

export default ReferralCodeField
