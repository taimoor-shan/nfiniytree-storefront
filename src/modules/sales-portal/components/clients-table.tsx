import { PortalClient } from "@/types/sales-portal"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { formatDate, formatMoney, formatRate } from "../lib/format"
import { PortalT } from "../lib/translator"
import { DataTable, Td, Th } from "./data-table"

const ClientsTable = ({
  clients,
  countryCode,
  locale,
  t,
}: {
  clients: PortalClient[]
  countryCode: string
  locale: string
  t: PortalT
}) => {
  if (!clients.length) {
    return (
      <p className="text-base-regular text-muted" data-testid="portal-clients-empty">
        {t("salesPortal.clients.empty")}
      </p>
    )
  }

  // A client who ordered in two currencies has one line per currency.
  const perCurrency = (
    client: PortalClient,
    pick: (total: PortalClient["totals"][number]) => number
  ) =>
    client.totals.length
      ? client.totals.map((total) => (
          <div key={total.currency_code}>
            {formatMoney(pick(total), total.currency_code, countryCode)}
          </div>
        ))
      : "–"

  return (
    <DataTable data-testid="portal-clients">
      <thead>
        <tr>
          <Th>{t("salesPortal.col.client")}</Th>
          <Th right>{t("salesPortal.col.rate")}</Th>
          <Th>{t("salesPortal.col.since")}</Th>
          <Th right>{t("salesPortal.col.turnover")}</Th>
          <Th right>{t("salesPortal.col.commission")}</Th>
        </tr>
      </thead>
      <tbody>
        {clients.map((client) => (
          <tr key={client.customer_id} data-testid="portal-client">
            <Td className="min-w-[10rem] whitespace-normal">
              <LocalizedClientLink
                href={`/sales-portal/clients/${client.customer_id}`}
                className="text-link hover:underline"
              >
                {client.client_name}
              </LocalizedClientLink>
              {!client.current && (
                <span className="ml-2 text-muted">
                  ({t("salesPortal.clients.former")})
                </span>
              )}
            </Td>
            <Td right>{formatRate(client.commission_rate)}</Td>
            <Td>{client.since ? formatDate(client.since, locale) : "–"}</Td>
            <Td right>{perCurrency(client, (total) => total.turnover)}</Td>
            <Td right className="font-semibold">
              {perCurrency(client, (total) => total.commission)}
            </Td>
          </tr>
        ))}
      </tbody>
    </DataTable>
  )
}

export default ClientsTable
