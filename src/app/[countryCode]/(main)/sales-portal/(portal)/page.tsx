import {
  getPortalClients,
  getPortalMonths,
  getPortalStatement,
} from "@lib/data/sales-portal"
import { getLocale } from "@lib/data/locale-actions"
import { translate } from "@lib/i18n"
import ClientsTable from "@modules/sales-portal/components/clients-table"
import MonthPicker from "@modules/sales-portal/components/month-picker"
import SessionMessage from "@modules/sales-portal/components/session-message"
import StatementTable from "@modules/sales-portal/components/statement-table"
import Totals from "@modules/sales-portal/components/totals"
import { getPortalTranslator } from "@modules/sales-portal/lib/translator"
import { Metadata } from "next"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  return {
    title: await translate("metadata.salesPortalTitle", locale),
    description: await translate("metadata.salesPortalDescription", locale),
  }
}

export default async function SalesPortalOverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ period?: string | string[] }>
}) {
  const { countryCode } = await params
  const { period } = await searchParams
  const { t, locale } = await getPortalTranslator()
  const requested = typeof period === "string" ? period : undefined

  const [statement, clients, months] = await Promise.all([
    getPortalStatement(requested),
    getPortalClients(requested),
    getPortalMonths(),
  ])

  // Each page checks the session itself: a layout isn't re-run when the rep
  // navigates between pages, so it can't be the only gate.
  if (!statement.ok) {
    return <SessionMessage reason={statement.reason} countryCode={countryCode} t={t} />
  }
  if (!clients.ok) {
    return <SessionMessage reason={clients.reason} countryCode={countryCode} t={t} />
  }
  if (!months.ok) {
    return <SessionMessage reason={months.reason} countryCode={countryCode} t={t} />
  }

  const selected = statement.data.period
  const periods = Array.from(
    new Set([selected, ...months.data.statements.map((m) => m.period)])
  )
    .sort()
    .reverse()

  return (
    <div className="flex flex-col gap-y-12">
      <MonthPicker periods={periods} selected={selected} locale={locale} t={t} />

      {statement.data.totals.length > 0 && (
        <Totals totals={statement.data.totals} countryCode={countryCode} t={t} />
      )}

      <section>
        <h2 className="text-xl-semi mb-4">{t("salesPortal.statement.title")}</h2>
        <StatementTable
          lines={statement.data.lines}
          countryCode={countryCode}
          locale={locale}
          t={t}
        />
      </section>

      <section>
        <h2 className="text-xl-semi mb-4">{t("salesPortal.clients.title")}</h2>
        <ClientsTable
          clients={clients.data.clients}
          countryCode={countryCode}
          locale={locale}
          t={t}
        />
      </section>
    </div>
  )
}
