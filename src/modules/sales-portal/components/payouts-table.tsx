import { PortalPayout } from "@/types/sales-portal"
import { formatDate, formatMoney, formatMonth } from "../lib/format"
import { PortalT } from "../lib/translator"
import { DataTable, Td, Th } from "./data-table"

const PayoutsTable = ({
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
      <p className="text-base-regular text-muted" data-testid="portal-payouts-empty">
        {t("salesPortal.payouts.empty")}
      </p>
    )
  }

  return (
    <DataTable data-testid="portal-payouts">
      <thead>
        <tr>
          <Th>{t("salesPortal.col.paidOn")}</Th>
          <Th>{t("salesPortal.col.month")}</Th>
          <Th right>{t("salesPortal.col.amount")}</Th>
          <Th>{t("salesPortal.col.reference")}</Th>
        </tr>
      </thead>
      <tbody>
        {payouts.map((payout, index) => (
          <tr key={index} data-testid="portal-payout">
            <Td>{formatDate(payout.paid_at, locale)}</Td>
            <Td>{formatMonth(payout.period, locale)}</Td>
            <Td right className="font-semibold">
              {formatMoney(payout.amount, payout.currency_code, countryCode)}
            </Td>
            <Td className="min-w-[8rem] whitespace-normal">
              {payout.reference ?? "–"}
            </Td>
          </tr>
        ))}
      </tbody>
    </DataTable>
  )
}

export default PayoutsTable
