"use client"

import { Container, clx } from "@medusajs/ui"
import Image from "next/image"
import React from "react"

import PlaceholderImage from "@modules/common/icons/placeholder-image"
import { normalizeImageUrl } from "@lib/util/image-url"
import { useTranslation } from "@lib/i18n/client"

type ThumbnailSize = "small" | "medium" | "large" | "full" | "square"

type ThumbnailProps = {
  thumbnail?: string | null
  // TODO: Fix image typings
  images?: any[] | null
  size?: ThumbnailSize
  isFeatured?: boolean
  className?: string
  /**
   * Load immediately instead of lazily. Set this on above-the-fold cards (the
   * first grid row) so the LCP candidate is not deferred. Next 16 deprecated
   * `priority` in favour of `preload`, but `preload` is explicitly not for
   * cases with several possible LCP elements depending on viewport — which is
   * exactly a responsive product grid — so this uses eager + high fetch
   * priority instead.
   */
  eager?: boolean
  /** Override the default `sizes` for an unusual layout. */
  sizes?: string
  /**
   * What the image shows. Pass the product (and, where relevant, variant) name —
   * `alt="Olive Tree 120cm"` tells a screen-reader user and an image crawler
   * which product this card is for, where the previous hardcoded "Product image"
   * told neither. Omitted only when the same information is already adjacent in
   * text and the image is therefore decorative, in which case pass `alt=""`.
   */
  alt?: string
  "data-testid"?: string
}

/**
 * What the image actually occupies on screen, per `size` variant. These must
 * track the container widths below (and, for `full`, the product grid's
 * columns) or the browser picks a candidate that is too large — which is what
 * the previous hardcoded `800px` did on a ~448px card.
 */
const DEFAULT_SIZES: Record<ThumbnailSize, string> = {
  // Fixed-width variants: the container class pins the width.
  small: "180px",
  medium: "290px",
  large: "440px",
  // Cart line items and order rows: w-12 / w-16 / w-24.
  square: "96px",
  // Product grid: 1 col below 1024px, 3 cols above, inside a 1440px
  // max-width container with 24px page padding and 24px gutters — so a card
  // tops out at (1392 - 48) / 3 = 448px however wide the viewport gets.
  full: "(max-width: 1023px) 100vw, (max-width: 1440px) 31vw, 448px",
}

const Thumbnail: React.FC<ThumbnailProps> = ({
  thumbnail,
  images,
  size = "small",
  isFeatured,
  className,
  eager,
  sizes,
  alt,
  "data-testid": dataTestid,
}) => {
  const initialImage = thumbnail || images?.[0]?.url

  return (
    <Container
      className={clx(
        "relative w-full overflow-hidden p-4 bg-surface-card shadow-elevation-card-rest rounded-lg group-hover:shadow-elevation-card-hover transition-shadow ease-in-out duration-150",
        className,
        {
          "aspect-[11/14]": isFeatured,
          "aspect-[9/12]": !isFeatured && size !== "square",
          "aspect-[1/1]": size === "square",
          "w-[180px]": size === "small",
          "w-[290px]": size === "medium",
          "w-[440px]": size === "large",
          "w-full": size === "full",
        }
      )}
      data-testid={dataTestid}
    >
      <ImageOrPlaceholder
        image={initialImage}
        size={size}
        eager={eager}
        sizes={sizes}
        alt={alt}
      />
    </Container>
  )
}

const ImageOrPlaceholder = ({
  image,
  size = "small",
  eager,
  sizes,
  alt,
}: Pick<ThumbnailProps, "size" | "eager" | "sizes" | "alt"> & {
  image?: string
}) => {
  const { t } = useTranslation()

  return image ? (
    <Image
      src={normalizeImageUrl(image)}
      // `alt` may legitimately be "" (decorative — the product name sits next to
      // the image in text), so only fall back when it was not passed at all.
      alt={alt ?? t("product.productImage")}
      className="absolute inset-0 object-cover object-center"
      draggable={false}
      sizes={sizes ?? DEFAULT_SIZES[size]}
      loading={eager ? "eager" : undefined}
      fetchPriority={eager ? "high" : undefined}
      fill
    />
  ) : (
    <div className="w-full h-full absolute inset-0 flex items-center justify-center">
      {/* Decorative — it stands in for a missing image and conveys nothing, so
          it is hidden from assistive technology rather than announced. */}
      <div aria-hidden="true">
        <PlaceholderImage size={size === "small" ? 16 : 24} />
      </div>
    </div>
  )
}

export default Thumbnail
