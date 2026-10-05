import { PortalTotals } from "@/types/sales-portal"
import { formatMoney } from "../lib/format"
import { PortalT } from "../lib/translator"
import StatusBadge from "./status-badge"

/** The month's totals, one card per currency (never converted between them). */
const Totals = ({
  totals,
  countryCode,
  t,
}: {
  totals: PortalTotals[]
  countryCode: string
  t: PortalT
}) => (
  <div className="flex flex-col gap-y-4" data-testid="portal-totals">
    {totals.map((total) => {
      const money = (amount: number) =>
        formatMoney(amount, total.currency_code, countryCode)
      const cells: [string, string][] = [
        [t("salesPortal.totals.turnover"), money(total.turnover)],
        [t("salesPortal.totals.direct"), money(total.direct)],
      ]
      if (total.level2 !== 0 || total.level2_turnover !== 0) {
        cells.push(
          [t("salesPortal.totals.level2Turnover"), money(total.level2_turnover)],
          [t("salesPortal.totals.level2"), money(total.level2)]
        )
      }
      if (total.adjustments !== 0) {
        cells.push([t("salesPortal.totals.adjustments"), money(total.adjustments)])
      }
      cells.push(
        [t("salesPortal.totals.total"), money(total.total)],
        [t("salesPortal.totals.paid"), money(total.paid)]
      )

      return (
        <div
          key={total.currency_code}
          className="bg-surface-soft rounded-md p-6"
          data-testid={`portal-totals-${total.currency_code}`}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-base-semi uppercase">{total.currency_code}</span>
            <StatusBadge status={total.status} t={t} />
          </div>
          <dl className="grid grid-cols-2 small:grid-cols-3 gap-4">
            {cells.map(([label, value]) => (
              <div key={label}>
                <dt className="text-small-regular text-ink/70">{label}</dt>
                <dd className="text-base-semi">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )
    })}
  </div>
)

export default Totals
