import { clx } from "@medusajs/ui"
import Image from "next/image"

import { normalizeImageUrl } from "@lib/util/image-url"

type FillImageProps = {
  src?: string | null
  /** What the picture shows: the editor's description, else the page title. */
  alt: string
  sizes: string
  /** Above the fold: load at once instead of lazily. */
  eager?: boolean
  className?: string
}

/**
 * An editor-supplied image (blog and CMS pages) that fills its parent, which
 * must be `relative` and have a size (for example an aspect ratio).
 *
 * Media on the backend or the storefront's own origin go through `next/image`
 * like product media do. An absolute URL on another host is shown as it is: the
 * optimizer only fetches hosts listed in `next.config.js`, and one stray image
 * from an unlisted host would otherwise fail the whole page.
 */
export default function FillImage({
  src,
  alt,
  sizes,
  eager,
  className,
}: FillImageProps) {
  const url = normalizeImageUrl(src)

  if (!url) {
    return null
  }

  if (url.startsWith("/")) {
    return (
      <Image
        src={url}
        alt={alt}
        fill
        sizes={sizes}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : undefined}
        className={clx("object-cover", className)}
      />
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : undefined}
      className={clx("absolute inset-0 h-full w-full object-cover", className)}
    />
  )
}
