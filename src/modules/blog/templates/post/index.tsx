import type { ComponentType } from "react"

import StandardPost from "./standard"
import type { PostTemplateProps } from "./types"
import WidePost from "./wide"

/**
 * The layouts a blog post can use, by the key the editor picks in the admin
 * ("Template" in the post editor).
 *
 * To add one: build the component beside these, register it here, and list its
 * key and label in the backend admin (`src/admin/lib/options.ts`). A post
 * whose key is not registered renders with the standard layout, so the admin
 * and the storefront can be deployed in either order.
 */
const POST_TEMPLATES: Record<string, ComponentType<PostTemplateProps>> = {
  standard: StandardPost,
  wide: WidePost,
}

export const DEFAULT_POST_TEMPLATE = "standard"

/** Renders `post` with the layout named by `template`. */
export default function PostTemplate({
  template,
  ...props
}: PostTemplateProps & { template?: string | null }) {
  const Layout =
    (template && POST_TEMPLATES[template]) ||
    POST_TEMPLATES[DEFAULT_POST_TEMPLATE]

  return <Layout {...props} />
}
