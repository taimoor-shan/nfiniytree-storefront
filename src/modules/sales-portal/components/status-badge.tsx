import {
  PortalLineStatus,
  PortalPaymentStatus,
  PortalRecruitStatus,
} from "@/types/sales-portal"
import { PortalT } from "../lib/translator"

const PILL = "inline-block rounded-full px-3 py-1 text-small-regular text-ink whitespace-nowrap"

const PAYMENT_STYLES: Record<PortalPaymentStatus, string> = {
  paid: "bg-success/20",
  partial: "bg-accent-amber/25",
  unpaid: "border border-hairline-strong bg-canvas",
  overpaid: "bg-accent-amber/25",
  none: "border border-hairline bg-canvas text-muted",
}

/** What a month leaves owing: settled, partly paid, still owed, paid ahead. */
const StatusBadge = ({
  status,
  t,
}: {
  status: PortalPaymentStatus
  t: PortalT
}) => (
  <span
    className={`${PILL} ${PAYMENT_STYLES[status]}`}
    data-testid={`portal-status-${status}`}
  >
    {t(`salesPortal.status.${status}`)}
  </span>
)

export default StatusBadge

const LINE_STYLES: Record<PortalLineStatus, string> = {
  pending: "border border-dashed border-hairline-strong bg-canvas text-muted",
  earned: "bg-accent-teal/20",
  payable: "bg-success/25",
  reversed: "bg-accent-amber/30",
  adjustment: "bg-surface-card",
  paid: "bg-success/25",
}

/** Where one line stands: pending, earned, payable, reversed, adjustment or paid. */
export const LineStatusPill = ({
  status,
  t,
}: {
  status: PortalLineStatus
  t: PortalT
}) => (
  <span
    className={`${PILL} ${LINE_STYLES[status]}`}
    data-testid={`portal-line-status-${status}`}
  >
    {t(`salesPortal.lineStatus.${status}`)}
  </span>
)

const RECRUIT_STYLES: Record<PortalRecruitStatus, string> = {
  active: "bg-success/25",
  pending_approval: "bg-accent-amber/30",
  invited: "bg-accent-teal/20",
  expired: "border border-hairline bg-canvas text-muted",
  inactive: "border border-hairline bg-canvas text-muted",
  declined: "bg-error/15",
}

/** How far a recruit has come: invited, applied, active... */
export const RecruitStatusPill = ({
  status,
  t,
}: {
  status: PortalRecruitStatus
  t: PortalT
}) => (
  <span
    className={`${PILL} ${RECRUIT_STYLES[status]}`}
    data-testid={`portal-recruit-status-${status}`}
  >
    {t(`salesPortal.recruits.status.${status}`)}
  </span>
)
