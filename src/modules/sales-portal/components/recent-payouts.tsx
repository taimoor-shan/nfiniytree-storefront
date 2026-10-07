import { PortalPayout } from "@/types/sales-portal"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { formatDate, formatMoney } from "../lib/format"
import { PortalT } from "../lib/translator"
import { LineStatusPill } from "./status-badge"

/** The last few payouts, newest first, with a link to the whole history. */
const RecentPayouts = ({
  payouts,
  countryCode,
  locale,
  t,
}: {
  payouts: PortalPayout[]
  countryCode: string
  locale: string
  t: PortalT
}) => {
  if (!payouts.length) {
    return (
      <p className="text-base-regular text-muted" data-testid="portal-recent-payouts-empty">
        {t("salesPortal.payouts.empty")}
      </p>
    )
  }

  return (
    <div data-testid="portal-recent-payouts">
      <ul className="divide-y divide-hairline-soft">
        {payouts.slice(0, 5).map((payout, index) => (
          <li
            key={index}
            className="flex items-center justify-between gap-4 py-3"
            data-testid="portal-recent-payout"
          >
            <div className="flex flex-col">
              <span className="text-base-regular tabular-nums">
                {formatDate(payout.paid_at, locale)}
              </span>
              {payout.reference && (
                <span className="text-small-regular text-muted">
                  {t("salesPortal.col.reference")} {payout.reference}
                </span>
              )}
            </div>
            <div className="flex items-center gap-x-4">
              <span className="text-base-semi tabular-nums">
                {formatMoney(payout.amount, payout.currency_code, countryCode)}
              </span>
              <LineStatusPill status="paid" t={t} />
            </div>
          </li>
        ))}
      </ul>
      <LocalizedClientLink
        href="/sales-portal/payouts"
        className="mt-3 inline-block text-small-regular text-link hover:underline"
      >
        {t("salesPortal.payouts.viewAll")}
      </LocalizedClientLink>
    </div>
  )
}

export default RecentPayouts
