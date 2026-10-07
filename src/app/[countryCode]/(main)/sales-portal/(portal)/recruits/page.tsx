import { getPortalRecruits } from "@lib/data/sales-portal"
import { getLocale } from "@lib/data/locale-actions"
import { translate } from "@lib/i18n"
import RecruitInviteForm from "@modules/sales-portal/components/recruit-invite-form"
import RecruitsTable from "@modules/sales-portal/components/recruits-table"
import SessionMessage from "@modules/sales-portal/components/session-message"
import { getPortalTranslator } from "@modules/sales-portal/lib/translator"
import { Metadata } from "next"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  return {
    title: await translate("salesPortal.recruits.title", locale),
    description: await translate("metadata.salesPortalDescription", locale),
  }
}

export default async function SalesPortalRecruitsPage({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params
  const { t, locale } = await getPortalTranslator()

  const recruits = await getPortalRecruits()

  // Each page checks the session itself: a layout isn't re-run on client-side navigation
  if (!recruits.ok) {
    return <SessionMessage reason={recruits.reason} countryCode={countryCode} t={t} />
  }
  const { limits } = recruits.data

  return (
    <div className="flex flex-col gap-y-12">
      <section>
        <h2 className="text-xl-semi mb-2">{t("salesPortal.recruits.title")}</h2>
        <p className="max-w-2xl text-base-regular text-muted">
          {t("salesPortal.recruits.intro")}
        </p>
      </section>

      <section className="rounded-md bg-surface-soft p-6">
        <h3 className="text-large-semi mb-4">{t("salesPortal.recruits.inviteTitle")}</h3>
        <RecruitInviteForm />
        <p className="mt-4 text-small-regular text-muted" data-testid="recruit-limit">
          {t("salesPortal.recruits.limit", {
            used: limits.open_invites,
            max: limits.max_open_invites,
          })}
        </p>
      </section>

      <section>
        <RecruitsTable
          recruits={recruits.data.recruits}
          countryCode={countryCode}
          locale={locale}
          t={t}
        />
        <p className="mt-4 max-w-2xl text-small-regular text-muted">
          {t("salesPortal.recruits.privacy")}
        </p>
      </section>
    </div>
  )
}
