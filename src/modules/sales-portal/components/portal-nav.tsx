"use client"

import { clx } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useParams, usePathname } from "next/navigation"

type Item = { href: string; label: string }

const PortalNav = ({ items }: { items: Item[] }) => {
  const pathname = usePathname()
  const { countryCode } = useParams() as { countryCode: string }
  const root = `/${countryCode}/sales-portal`

  // A client's orders belong to the overview.
  const isActive = (href: string) =>
    href === "/sales-portal"
      ? pathname === root || pathname.startsWith(`${root}/clients/`)
      : pathname === `/${countryCode}${href}`

  return (
    <nav
      className="flex flex-wrap items-center gap-x-6 gap-y-1"
      data-testid="sales-portal-nav"
    >
      {items.map((item) => (
        <LocalizedClientLink
          key={item.href}
          href={item.href}
          aria-current={isActive(item.href) ? "page" : undefined}
          className={clx(
            "text-small-regular hover:underline",
            isActive(item.href) ? "text-ink font-semibold" : "text-muted"
          )}
        >
          {item.label}
        </LocalizedClientLink>
      ))}
    </nav>
  )
}

export default PortalNav
