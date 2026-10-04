import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { PortalT } from "../lib/translator"

/** Previous / next links over an offset-paged list. */
const Pager = ({
  href,
  offset,
  limit,
  count,
  t,
}: {
  /** The page's path, e.g. "/sales-portal/clients/cus_1" */
  href: string
  offset: number
  limit: number
  count: number
  t: PortalT
}) => {
  const previous = offset > 0 ? Math.max(0, offset - limit) : null
  const next = offset + limit < count ? offset + limit : null

  if (previous === null && next === null) {
    return null
  }

  const to = (target: number) => (target ? `${href}?offset=${target}` : href)

  return (
    <nav className="mt-6 flex justify-between text-small-regular" data-testid="portal-pager">
      {previous !== null ? (
        <LocalizedClientLink href={to(previous)} className="text-link hover:underline">
          {t("common.previous")}
        </LocalizedClientLink>
      ) : (
        <span />
      )}
      {next !== null && (
        <LocalizedClientLink href={to(next)} className="text-link hover:underline">
          {t("common.next")}
        </LocalizedClientLink>
      )}
    </nav>
  )
}

export default Pager
