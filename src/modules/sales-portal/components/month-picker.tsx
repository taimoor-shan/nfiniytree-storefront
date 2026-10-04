import { clx } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { formatMonth } from "../lib/format"
import { PortalT } from "../lib/translator"

const MonthPicker = ({
  periods,
  selected,
  locale,
  t,
}: {
  periods: string[]
  selected: string
  locale: string
  t: PortalT
}) => (
  <nav
    aria-label={t("salesPortal.month")}
    className="flex gap-2 overflow-x-auto pb-1"
    data-testid="portal-month-picker"
  >
    {periods.map((period) => (
      <LocalizedClientLink
        key={period}
        href={`/sales-portal?period=${period}`}
        aria-current={period === selected ? "page" : undefined}
        className={clx(
          "whitespace-nowrap rounded-full border px-4 py-1 text-small-regular",
          period === selected
            ? "border-ink bg-ink text-on-dark"
            : "border-hairline-strong text-body hover:bg-surface-soft"
        )}
      >
        {formatMonth(period, locale)}
      </LocalizedClientLink>
    ))}
  </nav>
)

export default MonthPicker
