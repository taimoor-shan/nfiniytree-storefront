import { PortalLine, PortalTotals } from "@/types/sales-portal"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { formatDate, formatMoney, formatRate } from "../lib/format"
import { PortalT } from "../lib/translator"
import { DataTable, Td, Th } from "./data-table"
import { LineStatusPill } from "./status-badge"

// The plugin words a reversal's reason in English; show it in the visitor's
// language when it is one of the known reasons.
const REVERSAL_KEYS: Record<string, string> = {
  "Order canceled": "salesPortal.reversal.canceled",
  "Order refunded": "salesPortal.reversal.refunded",
  "Orders canceled or refunded": "salesPortal.reversal.mixed",
  "Order reversed": "salesPortal.reversal.other",
}

const lineNote = (line: PortalLine, t: PortalT) => {
  if (!line.note) {
    return null
  }
  const key = line.kind === "reversal" ? REVERSAL_KEYS[line.note] : undefined

  return key ? t(key) : line.note
}

const StatementTable = ({
  lines,
  pending,
  totals,
  countryCode,
  locale,
  t,
}: {
  lines: PortalLine[]
  /** Unpaid orders, shown first: they earn nothing until paid */
  pending: PortalLine[]
  /** For what was still owed when the month began, per currency */
  totals: PortalTotals[]
  countryCode: string
  locale: string
  t: PortalT
}) => {
  const broughtForward = totals.filter((total) => total.opening !== 0)

  if (!lines.length && !pending.length && !broughtForward.length) {
    return (
      <p className="text-base-regular text-muted" data-testid="portal-statement-empty">
        {t("salesPortal.statement.empty")}
      </p>
    )
  }

  const money = (amount: number, currencyCode: string) =>
    formatMoney(amount, currencyCode, countryCode)

  const row = (line: PortalLine, key: string) => (
    <tr key={key} data-testid={`portal-line-${line.kind}`}>
      <Td>{formatDate(line.date, locale)}</Td>
      <Td className="min-w-[8rem] whitespace-normal">
        {t(`salesPortal.line.${line.kind}`)}
        {lineNote(line, t) && (
          <span className="block text-muted">{lineNote(line, t)}</span>
        )}
      </Td>
      <Td>{line.order_number === null ? "–" : `#${line.order_number}`}</Td>
      <Td className="min-w-[10rem] whitespace-normal">
        {line.referred_rep_name ? (
          `${t("salesPortal.line.level2From")} ${line.referred_rep_name}`
        ) : line.customer_id && line.client_name ? (
          <LocalizedClientLink
            href={`/sales-portal/clients/${line.customer_id}`}
            className="text-link hover:underline"
          >
            {line.client_name}
          </LocalizedClientLink>
        ) : (
          line.client_name ?? "–"
        )}
      </Td>
      <Td right>
        {line.net_value === null ? "–" : money(line.net_value, line.currency_code)}
      </Td>
      <Td right>{formatRate(line.rate)}</Td>
      <Td right className="font-semibold">
        {money(line.amount, line.currency_code)}
        {line.fx_rate && line.order_amount !== null && line.order_currency_code && (
          <span className="block text-small-regular font-normal text-muted">
            {t("salesPortal.line.converted", {
              amount: money(line.order_amount, line.order_currency_code),
              rate: line.fx_rate,
            })}
          </span>
        )}
      </Td>
      <Td right>{line.balance === null ? "–" : money(line.balance, line.currency_code)}</Td>
      <Td>
        <LineStatusPill status={line.status} t={t} />
      </Td>
    </tr>
  )

  return (
    <DataTable data-testid="portal-statement">
      <thead>
        <tr>
          <Th>{t("salesPortal.col.date")}</Th>
          <Th>{t("salesPortal.col.type")}</Th>
          <Th>{t("salesPortal.col.order")}</Th>
          <Th>{t("salesPortal.col.client")}</Th>
          <Th right>{t("salesPortal.col.netValue")}</Th>
          <Th right>{t("salesPortal.col.rate")}</Th>
          <Th right>{t("salesPortal.col.amount")}</Th>
          <Th right>{t("salesPortal.col.balance")}</Th>
          <Th>{t("salesPortal.col.status")}</Th>
        </tr>
      </thead>
      <tbody>
        {pending.map((line, index) => row(line, `pending-${index}`))}
        {broughtForward.map((total) => (
          <tr key={`bf-${total.currency_code}`} data-testid="portal-brought-forward">
            <Td />
            <Td className="min-w-[8rem] whitespace-normal">
              {t("salesPortal.statement.broughtForward")}
              <span className="block text-muted">
                {t("salesPortal.statement.broughtForwardNote")}
              </span>
            </Td>
            <Td />
            <Td />
            <Td />
            <Td />
            <Td />
            <Td right className="font-semibold">
              {money(total.opening, total.currency_code)}
            </Td>
            <Td />
          </tr>
        ))}
        {lines.map((line, index) => row(line, `line-${index}`))}
      </tbody>
    </DataTable>
  )
}

export default StatementTable
