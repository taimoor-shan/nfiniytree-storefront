import {
  getPortalBalances,
  getPortalClients,
  getPortalMonths,
  getPortalPayouts,
  getPortalStatement,
} from "@lib/data/sales-portal"
import { getLocale } from "@lib/data/locale-actions"
import { translate } from "@lib/i18n"
import BalanceCards from "@modules/sales-portal/components/balance-cards"
import ClientsTable from "@modules/sales-portal/components/clients-table"
import MonthPicker from "@modules/sales-portal/components/month-picker"
import RecentPayouts from "@modules/sales-portal/components/recent-payouts"
import SessionMessage from "@modules/sales-portal/components/session-message"
import StatementTable from "@modules/sales-portal/components/statement-table"
import Totals from "@modules/sales-portal/components/totals"
import { currentPeriod, payoutsInYear } from "@modules/sales-portal/lib/format"
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

  const [statement, clients, months, balances, payouts] = await Promise.all([
    getPortalStatement(requested),
    getPortalClients(requested),
    getPortalMonths(),
    getPortalBalances(),
    getPortalPayouts(),
  ])

  // Each page checks the session itself: a layout isn't re-run when the rep
  // navigates between pages, so it can't be the only gate.
  for (const result of [statement, clients, months, balances, payouts]) {
    if (!result.ok) {
      return <SessionMessage reason={result.reason} countryCode={countryCode} t={t} />
    }
  }
  if (!statement.ok || !clients.ok || !months.ok || !balances.ok || !payouts.ok) {
    return null
  }

  const selected = statement.data.period
  const now = currentPeriod()
  const isCurrentMonth = selected === now
  const periods = Array.from(
    new Set([selected, ...months.data.statements.map((m) => m.period)])
  )
    .sort()
    .reverse()

  return (
    <div className="flex flex-col gap-y-12">
      <MonthPicker periods={periods} selected={selected} locale={locale} t={t} />

      <BalanceCards
        balances={balances.data}
        totals={statement.data.totals}
        period={selected}
        isCurrentMonth={isCurrentMonth}
        payoutsThisYear={payoutsInYear(payouts.data.payouts, now.slice(0, 4))}
        countryCode={countryCode}
        locale={locale}
        t={t}
      />

      <section>
        <div className="mb-4 flex items-center gap-x-3">
          <h2 className="text-xl-semi">{t("salesPortal.statement.title")}</h2>
          <span
            className="rounded-full border border-hairline-strong px-3 py-1 text-small-regular text-muted"
            data-testid={`portal-month-${statement.data.approved ? "approved" : "open"}`}
          >
            {statement.data.approved
              ? t("salesPortal.statement.approved")
              : t("salesPortal.statement.open")}
          </span>
        </div>
        <StatementTable
          lines={statement.data.lines}
          // Unpaid orders aren't part of any month: show them with the current one
          pending={isCurrentMonth ? statement.data.pending : []}
          totals={statement.data.totals}
          countryCode={countryCode}
          locale={locale}
          t={t}
        />
      </section>

      {statement.data.totals.length > 0 && (
        <section>
          <h2 className="text-xl-semi mb-4">{t("salesPortal.totals.title")}</h2>
          <Totals totals={statement.data.totals} countryCode={countryCode} t={t} />
        </section>
      )}

      <section>
        <h2 className="text-xl-semi mb-4">{t("salesPortal.payouts.recent")}</h2>
        <RecentPayouts
          payouts={payouts.data.payouts}
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
