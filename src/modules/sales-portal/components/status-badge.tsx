import { PortalPaymentStatus } from "@/types/sales-portal"
import { PortalT } from "../lib/translator"

const STYLES: Record<PortalPaymentStatus, string> = {
  paid: "bg-success/20",
  partial: "bg-accent-amber/25",
  unpaid: "border border-hairline-strong bg-canvas",
  none: "border border-hairline bg-canvas text-muted",
}

const StatusBadge = ({
  status,
  t,
}: {
  status: PortalPaymentStatus
  t: PortalT
}) => (
  <span
    className={`inline-block rounded-full px-3 py-1 text-small-regular text-ink ${STYLES[status]}`}
    data-testid={`portal-status-${status}`}
  >
    {t(`salesPortal.status.${status}`)}
  </span>
)

export default StatusBadge
