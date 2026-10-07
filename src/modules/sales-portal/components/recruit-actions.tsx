"use client"

import { updateRecruitInvite } from "@lib/data/sales-portal-actions"
import { useTranslation } from "@lib/i18n"
import { useState, useTransition } from "react"

type Notice = { text: string; error: boolean }

const BUTTON =
  "text-small-regular text-link hover:underline disabled:text-muted disabled:no-underline"

/** What a rep can do with an invitation nobody has answered: send it again, or withdraw it. */
const RecruitActions = ({ id }: { id: string }) => {
  const { t } = useTranslation()
  const [pending, startTransition] = useTransition()
  const [notice, setNotice] = useState<Notice | null>(null)

  const run = (action: "resend" | "cancel") =>
    startTransition(async () => {
      const error = await updateRecruitInvite(id, action)
      setNotice(
        error
          ? { text: error, error: true }
          : action === "resend"
            ? { text: t("salesPortal.recruits.resent"), error: false }
            : null
      )
    })

  return (
    <div className="flex flex-col items-start gap-y-1" data-testid="recruit-actions">
      <div className="flex items-center gap-x-4">
        <button type="button" className={BUTTON} disabled={pending} onClick={() => run("resend")}>
          {t("salesPortal.recruits.resend")}
        </button>
        <button type="button" className={BUTTON} disabled={pending} onClick={() => run("cancel")}>
          {t("salesPortal.recruits.cancel")}
        </button>
      </div>
      {notice && (
        <span
          role={notice.error ? "alert" : "status"}
          className={`text-small-regular ${notice.error ? "text-error" : "text-muted"}`}
        >
          {notice.text}
        </span>
      )}
    </div>
  )
}

export default RecruitActions
