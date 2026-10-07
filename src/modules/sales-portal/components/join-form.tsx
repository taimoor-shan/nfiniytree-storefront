"use client"

import { ApplyFormState, applyToInvite } from "@lib/data/sales-portal-actions"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import NativeSelect from "@modules/common/components/native-select"
import { useActionState } from "react"
import JoinSteps from "./join-steps"

/** Every sentence the form shows, translated on the server in the language of the invitation. */
export type JoinLabels = {
  title: string
  intro: string
  name: string
  email: string
  emailLocked: string
  phone: string
  company: string
  currency: string
  currencyHelp: string
  currencyNone: string
  terms: string
  termsHelp: string
  apply: string
  sentTitle: string
  sentText: string
  steps: string[]
  emailNotValid: string
}

const INITIAL: ApplyFormState = { applied: false, error: null }

/**
 * The candidate's application. The email is the invitation's and can't be
 * changed, so the link can't be used for another address. Applying is only a
 * request: nothing starts until the owner approves.
 */
const JoinForm = ({
  token,
  language,
  name,
  email,
  labels,
}: {
  token: string
  language: string
  name: string
  email: string
  labels: JoinLabels
}) => {
  const [state, formAction] = useActionState(
    applyToInvite.bind(null, token, language),
    INITIAL
  )

  if (state.applied) {
    return (
      <div
        className="flex flex-col gap-y-6"
        data-testid="join-sent"
        role="status"
      >
        <div>
          <h1 className="text-large-semi mb-2">{labels.sentTitle}</h1>
          <p className="text-base-regular text-muted">{labels.sentText}</p>
        </div>
        <JoinSteps labels={labels.steps} current={1} />
      </div>
    )
  }

  return (
    <>
      <h1 className="mb-2 text-large-semi">{labels.title}</h1>
      <p className="mb-8 text-base-regular text-muted">{labels.intro}</p>
      <form
        action={formAction}
        className="flex flex-col gap-y-3"
        data-testid="join-form"
      >
        <Input
          label={labels.name}
          name="name"
          defaultValue={state.values?.name ?? name}
          autoComplete="name"
          minLength={2}
          maxLength={120}
          required
          data-testid="join-name-input"
        />
        <Input
          label={labels.email}
          name="email_locked"
          type="email"
          value={email}
          readOnly
          aria-readonly="true"
          helperText={labels.emailLocked}
          data-testid="join-email-input"
        />
        <Input
          label={labels.phone}
          name="phone"
          type="tel"
          defaultValue={state.values?.phone}
          autoComplete="tel"
          maxLength={40}
          data-testid="join-phone-input"
        />
        <Input
          label={labels.company}
          name="company"
          defaultValue={state.values?.company}
          autoComplete="organization"
          maxLength={160}
          data-testid="join-company-input"
        />
        <div>
          <NativeSelect
            name="currency"
            label={labels.currency}
            placeholder={labels.currencyNone}
            defaultValue={state.values?.currency ?? ""}
            data-testid="join-currency-select"
          >
            <option value="eur">EUR</option>
            <option value="huf">HUF</option>
          </NativeSelect>
          <span className="mt-1 block text-xs text-muted">
            {labels.currencyHelp}
          </span>
        </div>
        <label className="mt-2 flex items-start gap-x-3 text-base-regular">
          <input
            type="checkbox"
            name="accept_terms"
            defaultChecked={state.values?.accept_terms}
            required
            className="mt-1 h-4 w-4 accent-primary-strong"
            data-testid="join-terms-checkbox"
          />
          <span>
            {labels.terms}
            <span className="block text-small-regular text-muted">
              {labels.termsHelp}
            </span>
          </span>
        </label>
        <ErrorMessage error={state.error} data-testid="join-error" />
        <SubmitButton className="w-full mt-4" data-testid="join-submit">
          {labels.apply}
        </SubmitButton>
      </form>
    </>
  )
}

export default JoinForm
