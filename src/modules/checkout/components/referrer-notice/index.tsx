"use client"

import { getReferrerName } from "@lib/data/referral-actions"
import { useTranslation } from "@lib/i18n"
import { useEffect, useState } from "react"

/**
 * Says who invited the visitor, next to the place where they create an account:
 * creating it makes that sales rep their contact. Shows nothing for a visitor
 * who followed no client link. Asks the server, because the link is in an
 * httpOnly cookie this component cannot read.
 */
const ReferrerNotice = () => {
  const { t } = useTranslation()
  const [name, setName] = useState<string | null>(null)

  useEffect(() => {
    let current = true
    getReferrerName()
      .then((referrer) => current && setName(referrer))
      .catch(() => undefined)

    return () => {
      current = false
    }
  }, [])

  if (!name) {
    return null
  }

  return (
    <p
      role="status"
      className="rounded-md bg-surface-soft p-4 text-small-regular text-ink"
      data-testid="referrer-notice"
    >
      {t("account.referrerNotice").replaceAll("{name}", name)}
    </p>
  )
}

export default ReferrerNotice
