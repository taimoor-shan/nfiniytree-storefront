"use client"

import { RecruitFormState, inviteRecruit } from "@lib/data/sales-portal-actions"
import { useTranslation } from "@lib/i18n"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import Textarea from "@modules/common/components/textarea"
import { useActionState } from "react"

const INITIAL: RecruitFormState = { sent: null, error: null }

/** Invites someone by email. They get a personal link; the owner approves them before anything starts. */
const RecruitInviteForm = () => {
  const [state, formAction] = useActionState(inviteRecruit, INITIAL)
  const { t } = useTranslation()

  return (
    <form action={formAction} className="flex flex-col gap-y-3 max-w-xl" data-testid="recruit-invite-form">
      <Input
        label={t("salesPortal.recruits.name")}
        name="name"
        defaultValue={state.values?.name}
        autoComplete="off"
        maxLength={120}
        required
        data-testid="recruit-name-input"
      />
      <Input
        label={t("salesPortal.recruits.email")}
        name="email"
        type="email"
        defaultValue={state.values?.email}
        title={t("common.emailNotValid")}
        autoComplete="off"
        required
        data-testid="recruit-email-input"
      />
      <Textarea
        label={t("salesPortal.recruits.note")}
        name="note"
        defaultValue={state.values?.note}
        rows={3}
        maxLength={500}
        data-testid="recruit-note-input"
      />
      <p className="text-small-regular text-muted">{t("salesPortal.recruits.hint")}</p>
      <ErrorMessage error={state.error} data-testid="recruit-invite-error" />
      {state.sent && (
        <p role="status" className="text-small-regular text-ink" data-testid="recruit-invite-sent">
          {t("salesPortal.recruits.sent").replace("{email}", state.sent)}
        </p>
      )}
      <SubmitButton className="self-start" data-testid="recruit-invite-submit">
        {t("salesPortal.recruits.send")}
      </SubmitButton>
    </form>
  )
}

export default RecruitInviteForm
