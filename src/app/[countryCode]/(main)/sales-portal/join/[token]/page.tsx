import { getInvite } from "@lib/data/sales-portal"
import JoinForm, { JoinLabels } from "@modules/sales-portal/components/join-form"
import JoinSteps from "@modules/sales-portal/components/join-steps"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getPortalTranslator } from "@modules/sales-portal/lib/translator"
import { Metadata } from "next"

// The languages the shop is written in. A link names one so the page opens in
// the language of the email the candidate got, whatever their browser is set to.
const LANGUAGES = ["en", "de-AT", "de-DE", "hu-HU"]

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string | string[] }>
}): Promise<Metadata> {
  const { lang } = await searchParams
  const { t } = await getPortalTranslator(
    typeof lang === "string" && LANGUAGES.includes(lang) ? lang : null
  )

  return { title: t("salesPortal.join.metaTitle") }
}

const Notice = ({
  title,
  text,
  children,
}: {
  title: string
  text: string
  children?: React.ReactNode
}) => (
  <div className="flex flex-col gap-y-3" data-testid="join-notice">
    <h1 className="text-large-semi">{title}</h1>
    <p className="text-base-regular text-muted">{text}</p>
    {children}
  </div>
)

/**
 * A candidate's personal invitation page. Public: the link is the credential,
 * so there is no sign-in, and a link nobody issued shows the same page as one
 * that was withdrawn.
 */
export default async function SalesPortalJoinPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ lang?: string | string[] }>
}) {
  const { token } = await params
  const { lang } = await searchParams
  const language = typeof lang === "string" && LANGUAGES.includes(lang) ? lang : null
  const { t, locale } = await getPortalTranslator(language)

  const invite = await getInvite(token)

  const steps = [
    t("salesPortal.join.steps.applied"),
    t("salesPortal.join.steps.review"),
    t("salesPortal.join.steps.contract"),
    t("salesPortal.join.steps.access"),
  ]
  const labels: JoinLabels = {
    title: invite.ok
      ? t("salesPortal.join.title", { recruiter: invite.data.recruiter_name })
      : "",
    intro: t("salesPortal.join.intro"),
    name: t("salesPortal.join.name"),
    email: t("salesPortal.join.email"),
    emailLocked: t("salesPortal.join.emailLocked"),
    phone: t("salesPortal.join.phone"),
    company: t("salesPortal.join.company"),
    currency: t("salesPortal.join.currency"),
    currencyHelp: t("salesPortal.join.currencyHelp"),
    currencyNone: t("salesPortal.join.currencyNone"),
    terms: t("salesPortal.join.terms"),
    termsHelp: t("salesPortal.join.termsHelp"),
    apply: t("salesPortal.join.apply"),
    sentTitle: t("salesPortal.join.sentTitle"),
    sentText: t("salesPortal.join.sentText"),
    steps,
    emailNotValid: t("common.emailNotValid"),
  }

  let body: React.ReactNode

  if (!invite.ok) {
    body =
      invite.reason === "error" ? (
        <Notice title={t("salesPortal.join.errorTitle")} text={t("salesPortal.loadError")} />
      ) : (
        <Notice
          title={t("salesPortal.join.invalidTitle")}
          text={t("salesPortal.join.invalidText")}
        />
      )
  } else {
    const { data } = invite

    switch (data.state) {
      case "invited":
        body = (
          <JoinForm
            token={token}
            language={locale}
            name={data.name}
            email={data.email}
            labels={labels}
          />
        )
        break
      case "expired":
        body = (
          <Notice
            title={t("salesPortal.join.expiredTitle")}
            text={t("salesPortal.join.expiredText", { recruiter: data.recruiter_name })}
          />
        )
        break
      case "applied":
        body = (
          <div className="flex flex-col gap-y-6" data-testid="join-already-applied">
            <Notice
              title={t("salesPortal.join.alreadyTitle")}
              text={t("salesPortal.join.alreadyText")}
            />
            <JoinSteps labels={steps} current={1} />
          </div>
        )
        break
      case "approved":
        body = (
          <Notice
            title={t("salesPortal.join.approvedTitle")}
            text={t("salesPortal.join.approvedText")}
          >
            <LocalizedClientLink
              href="/sales-portal"
              className="text-base-regular text-link hover:underline"
            >
              {t("salesPortal.join.signIn")}
            </LocalizedClientLink>
          </Notice>
        )
        break
      default:
        body = (
          <Notice
            title={t("salesPortal.join.closedTitle")}
            text={t("salesPortal.join.closedText")}
          />
        )
    }
  }

  return (
    <div className="content-container mx-auto max-w-xl py-16" data-testid="sales-portal-join">
      <p className="mb-2 text-small-regular uppercase tracking-wide text-muted">Infinytree</p>
      {body}
    </div>
  )
}
