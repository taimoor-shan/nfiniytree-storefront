import type { ComponentType } from "react"

import ContactPage from "./contact"
import DefaultPage from "./default"
import HeroPage from "./hero"
import NarrowPage from "./narrow"
import type { PageTemplateProps } from "./types"

/**
 * The layouts a CMS page can use, by the key the editor picks in the admin
 * ("Template" in the page editor). This is the storefront's equivalent of
 * WordPress page templates: a page chooses one, so a new page needs no route
 * file, no hardcoded address and no sitemap entry.
 *
 * To add one: build the component beside these, register it here, and list its
 * key and label in the backend admin (`src/admin/lib/options.ts`). A page whose
 * key is not registered renders with the default layout, so the admin and the
 * storefront can be deployed in either order.
 */
const PAGE_TEMPLATES: Record<string, ComponentType<PageTemplateProps>> = {
  default: DefaultPage,
  hero: HeroPage,
  narrow: NarrowPage,
  contact: ContactPage,
}

export const DEFAULT_PAGE_TEMPLATE = "default"

/** Renders `page` with the layout named by `template`. */
export default function PageTemplate({
  template,
  ...props
}: PageTemplateProps & { template?: string | null }) {
  const Layout =
    (template && PAGE_TEMPLATES[template]) ||
    PAGE_TEMPLATES[DEFAULT_PAGE_TEMPLATE]

  return <Layout {...props} />
}
