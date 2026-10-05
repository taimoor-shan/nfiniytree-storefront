import { PortalLine } from "@/types/sales-portal"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { formatDate, formatMoney, formatRate } from "../lib/format"
import { PortalT } from "../lib/translator"
import { DataTable, Td, Th } from "./data-table"

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
    return "–"
  }
  const key = line.kind === "reversal" ? REVERSAL_KEYS[line.note] : undefined

  return key ? t(key) : line.note
}

const StatementTable = ({
  lines,
  countryCode,
  locale,
  t,
}: {
  lines: PortalLine[]
  countryCode: string
  locale: string
  t: PortalT
}) => {
  if (!lines.length) {
    return (
      <p className="text-base-regular text-muted" data-testid="portal-statement-empty">
        {t("salesPortal.statement.empty")}
      </p>
    )
  }

  const money = (amount: number, currencyCode: string) =>
    formatMoney(amount, currencyCode, countryCode)

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
          <Th>{t("salesPortal.col.note")}</Th>
        </tr>
      </thead>
      <tbody>
        {lines.map((line, index) => (
          <tr key={index} data-testid={`portal-line-${line.kind}`}>
            <Td>{formatDate(line.date, locale)}</Td>
            <Td>{t(`salesPortal.line.${line.kind}`)}</Td>
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
              {line.net_value === null
                ? "–"
                : money(line.net_value, line.currency_code)}
            </Td>
            <Td right>{formatRate(line.rate)}</Td>
            <Td right className="font-semibold">
              {money(line.amount, line.currency_code)}
            </Td>
            <Td className="min-w-[10rem] whitespace-normal">
              {lineNote(line, t)}
            </Td>
          </tr>
        ))}
      </tbody>
    </DataTable>
  )
}

export default StatementTable
