import { notFound, permanentRedirect } from "next/navigation"

import { getMarketPrefix } from "@lib/data/market"
import { cmsSlugFromSegments } from "@lib/util/cms-path"

type PageProps = {
  params: Promise<{ countryCode: string; slug: string }>
}

/**
 * CMS pages used to be served here, at `/pages/<slug>`. They now live at
 * `/<slug>` (see `[...slug]/page.tsx`), where the page picks its own layout, so
 * this address redirects there permanently and old links keep working.
 */
export default async function LegacyPage(props: PageProps) {
  const { countryCode, slug: segment } = await props.params
  const slug = cmsSlugFromSegments([segment])

  if (!slug) {
    notFound()
  }

  permanentRedirect(`/${await getMarketPrefix(countryCode)}/${slug}`)
}
