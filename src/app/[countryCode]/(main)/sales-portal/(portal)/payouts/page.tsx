import { getPortalPayouts } from "@lib/data/sales-portal"
import { getLocale } from "@lib/data/locale-actions"
import { translate } from "@lib/i18n"
import PayoutsTable from "@modules/sales-portal/components/payouts-table"
import SessionMessage from "@modules/sales-portal/components/session-message"
import { getPortalTranslator } from "@modules/sales-portal/lib/translator"
import { Metadata } from "next"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  return {
    title: await translate("salesPortal.payouts.title", locale),
    description: await translate("metadata.salesPortalDescription", locale),
  }
}

export default async function SalesPortalPayoutsPage({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params
  const { t, locale } = await getPortalTranslator()

  const payouts = await getPortalPayouts()

  if (!payouts.ok) {
    return <SessionMessage reason={payouts.reason} countryCode={countryCode} t={t} />
  }

  return (
    <section>
      <h2 className="text-xl-semi mb-4">{t("salesPortal.payouts.title")}</h2>
      <PayoutsTable
        payouts={payouts.data.payouts}
        countryCode={countryCode}
        locale={locale}
        t={t}
      />
    </section>
  )
}
