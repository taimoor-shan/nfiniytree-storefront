import { PortalBalances, PortalTotals } from "@/types/sales-portal"
import { formatDay, formatMonth, formatMoney } from "../lib/format"
import { PortalT } from "../lib/translator"
import MetricCard from "./metric-card"

/**
 * The four numbers a rep looks for, per currency (never converted between
 * them): what unpaid orders would earn, what the month earned, what can be
 * paid now, and what was paid this year.
 */
const BalanceCards = ({
  balances,
  totals,
  period,
  isCurrentMonth,
  payoutsThisYear,
  countryCode,
  locale,
  t,
}: {
  balances: PortalBalances
  /** The selected month's totals */
  totals: PortalTotals[]
  period: string
  isCurrentMonth: boolean
  /** How many payouts were made this year, per currency */
  payoutsThisYear: Record<string, number>
  countryCode: string
  locale: string
  t: PortalT
}) => {
  const currencies = Array.from(
    new Set([
      ...balances.balances.map((b) => b.currency_code),
      ...balances.pending.map((p) => p.currency_code),
      ...totals.map((total) => total.currency_code),
      ...Object.keys(balances.paid_this_year),
    ])
  ).sort()

  if (!currencies.length) {
    return (
      <p className="text-base-regular text-muted" data-testid="portal-cards-empty">
        {t("salesPortal.cards.empty")}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-y-5" data-testid="portal-balance-cards">
      {currencies.map((currency) => {
        const money = (amount: number) => formatMoney(amount, currency, countryCode)
        const balance = balances.balances.find((b) => b.currency_code === currency)
        const pending = balances.pending.find((p) => p.currency_code === currency)
        const month = totals.find((total) => total.currency_code === currency)
        const orders = pending?.orders ?? 0
        const payouts = payoutsThisYear[currency] ?? 0

        const payableHints: string[] = []
        if (balances.next_run) {
          payableHints.push(
            t("salesPortal.cards.nextRun", { date: formatDay(`${balances.next_run}T12:00:00Z`, locale) })
          )
        } else if ((balance?.payable ?? 0) === 0) {
          payableHints.push(t("salesPortal.cards.payableNone"))
        }
        if (balance && balance.open_earned !== 0) {
          payableHints.push(
            t("salesPortal.cards.waitingApproval", { amount: money(balance.open_earned) })
          )
        }
        if (balance && balance.to_recover > 0) {
          payableHints.push(
            t("salesPortal.cards.paidAhead", { amount: money(balance.to_recover) })
          )
        }

        return (
          <div key={currency} data-testid={`portal-cards-${currency}`}>
            {currencies.length > 1 && (
              <span className="mb-2 block text-base-semi uppercase">{currency}</span>
            )}
            <div className="grid grid-cols-1 xsmall:grid-cols-2 small:grid-cols-4 gap-4">
              <MetricCard
                testId="portal-card-pending"
                label={t("salesPortal.cards.pending")}
                value={money(pending?.amount ?? 0)}
                hint={
                  orders === 0
                    ? t("salesPortal.cards.pendingNone")
                    : orders === 1
                      ? t("salesPortal.cards.pendingOne")
                      : t("salesPortal.cards.pendingMany", { count: orders })
                }
              />
              <MetricCard
                testId="portal-card-earned"
                label={
                  isCurrentMonth
                    ? t("salesPortal.cards.earned")
                    : t("salesPortal.cards.earnedIn", { month: formatMonth(period, locale) })
                }
                value={money(month?.total ?? 0)}
                hint={t("salesPortal.cards.earnedHint")}
              />
              <MetricCard
                testId="portal-card-payable"
                label={t("salesPortal.cards.payable")}
                value={money(balance?.payable ?? 0)}
                hint={
                  <>
                    {payableHints.map((hint) => (
                      <span key={hint} className="block">
                        {hint}
                      </span>
                    ))}
                  </>
                }
              />
              <MetricCard
                testId="portal-card-paid"
                label={t("salesPortal.cards.paidThisYear")}
                value={money(balances.paid_this_year[currency] ?? 0)}
                hint={
                  payouts === 0
                    ? t("salesPortal.cards.payoutsNone")
                    : payouts === 1
                      ? t("salesPortal.cards.payoutsOne")
                      : t("salesPortal.cards.payoutsMany", { count: payouts })
                }
              />
            </div>
          </div>
        )
      })}
      <p className="text-small-regular text-muted">{t("salesPortal.cards.pendingExplain")}</p>
    </div>
  )
}

export default BalanceCards
