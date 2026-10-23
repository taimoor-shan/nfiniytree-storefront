import { clx } from "@medusajs/ui"

import { normalizeBodyHeadings } from "@lib/util/cms-html"

/**
 * A page's text from the rich-text editor. The layout owns the page's h1, so a
 * heading level 1 inside the text is dropped or demoted (see
 * `normalizeBodyHeadings`).
 */
export default function Prose({
  html,
  title,
  className,
}: {
  html?: string | null
  title: string
  className?: string
}) {
  if (!html) {
    return null
  }

  return (
    <div
      className={clx(
        "prose max-w-none text-body [&_a]:text-primary-text [&_h2]:font-display [&_h3]:font-display",
        className
      )}
      dangerouslySetInnerHTML={{ __html: normalizeBodyHeadings(html, title) }}
    />
  )
}
