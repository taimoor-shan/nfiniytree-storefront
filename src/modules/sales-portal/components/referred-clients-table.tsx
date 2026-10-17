import { PortalClientLink, PortalReferredStatus } from "@/types/sales-portal"
import { formatDay } from "../lib/format"
import { PortalT } from "../lib/translator"
import { DataTable, Td, Th } from "./data-table"

const PILL =
  "inline-block rounded-full px-3 py-1 text-small-regular text-ink whitespace-nowrap"

const STYLES: Record<PortalReferredStatus, string> = {
  registered: "border border-hairline-strong bg-canvas",
  ordered: "bg-accent-amber/25",
  paid: "bg-success/25",
}

/** How far a client who came through the link has got: registered, ordered, or paid. */
const ReferredStatusPill = ({
  status,
  t,
}: {
  status: PortalReferredStatus
  t: PortalT
}) => (
  <span
    className={`${PILL} ${STYLES[status]}`}
    data-testid={`portal-referred-status-${status}`}
  >
    {t(`salesPortal.clientLink.status.${status}`)}
  </span>
)

/** The clients who came through the rep's link: name, the day they joined, how far they have got. */
const ReferredClientsTable = ({
  referred,
  locale,
  t,
}: {
  referred: PortalClientLink["referred"]
  locale: string
  t: PortalT
}) => {
  if (!referred.length) {
    return (
      <p className="text-base-regular text-muted" data-testid="portal-referred-empty">
        {t("salesPortal.clientLink.empty")}
      </p>
    )
  }

  return (
    <DataTable data-testid="portal-referred">
      <thead>
        <tr>
          <Th>{t("salesPortal.clientLink.col.name")}</Th>
          <Th>{t("salesPortal.clientLink.col.joined")}</Th>
          <Th>{t("salesPortal.clientLink.col.status")}</Th>
        </tr>
      </thead>
      <tbody>
        {referred.map((client) => (
          <tr key={client.id} data-testid="portal-referred-client">
            <Td className="min-w-[10rem] whitespace-normal">{client.name}</Td>
            <Td>{formatDay(client.joined_at, locale)}</Td>
            <Td>
              <ReferredStatusPill status={client.status} t={t} />
            </Td>
          </tr>
        ))}
      </tbody>
    </DataTable>
  )
}

export default ReferredClientsTable
