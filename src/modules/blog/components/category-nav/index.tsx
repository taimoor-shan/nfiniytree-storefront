import { clx } from "@medusajs/ui"

import type { BlogCategory } from "@/types/blog"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type CategoryNavProps = {
  categories: BlogCategory[]
  /** Handle of the category being viewed; none on the main blog page. */
  activeHandle?: string
  allLabel: string
  ariaLabel: string
}

const BASE =
  "inline-flex items-center rounded-full border px-4 py-1.5 text-sm transition-colors"
const ACTIVE = "border-ink bg-ink text-on-dark"
const IDLE = "border-hairline text-body hover:border-ink hover:text-ink"

/** The blog's category filter: "All posts" and one pill per category. */
export default function CategoryNav({
  categories,
  activeHandle,
  allLabel,
  ariaLabel,
}: CategoryNavProps) {
  if (!categories.length) {
    return null
  }

  return (
    <nav
      aria-label={ariaLabel}
      className="mb-10 flex flex-wrap gap-2"
      data-testid="blog-category-nav"
    >
      <LocalizedClientLink
        href="/blog"
        aria-current={activeHandle ? undefined : "page"}
        className={clx(BASE, activeHandle ? IDLE : ACTIVE)}
      >
        {allLabel}
      </LocalizedClientLink>
      {categories.map((category) => (
        <LocalizedClientLink
          key={category.id}
          href={`/blog/category/${category.handle}`}
          aria-current={category.handle === activeHandle ? "page" : undefined}
          className={clx(
            BASE,
            category.handle === activeHandle ? ACTIVE : IDLE
          )}
        >
          {category.name}
        </LocalizedClientLink>
      ))}
    </nav>
  )
}
