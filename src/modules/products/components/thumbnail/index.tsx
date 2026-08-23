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
  eager?: boolean
  sizes?: string
  "data-testid"?: string
}

const DEFAULT_SIZES: Record<ThumbnailSize, string> = {
  small: "180px",
  medium: "290px",
  large: "440px",
  square: "96px",
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
  "data-testid": dataTestid,
}) => {
  const initialImage = thumbnail || images?.[0]?.url

  return (
    <Container
      className={clx(
        // NOTE: no width utility here anymore — width now comes from exactly
        // ONE place: either the size-specific default below, or `className`
        // when the caller passes one. Previously "w-full" lived here
        // unconditionally AND competed with per-size overrides below, which
        // is undefined behaviour once nested inside a CSS Grid `auto` track.
        "relative overflow-hidden p-4 bg-surface-card shadow-elevation-card-rest rounded-lg group-hover:shadow-elevation-card-hover transition-shadow ease-in-out duration-150",
        {
          "aspect-[11/14]": isFeatured,
          "aspect-[9/12]": !isFeatured && size !== "square",
          "aspect-[1/1]": size === "square",
          "w-[180px]": size === "small",
          "w-[290px]": size === "medium",
          "w-[440px]": size === "large",
          "w-full": size === "full",
          // Only apply a default square size when the caller hasn't supplied
          // its own — so there is never a second competing width utility.
          "w-16 h-16": size === "square" && !className,
        },
        className
      )}
      data-testid={dataTestid}
    >
      <ImageOrPlaceholder
        image={initialImage}
        size={size}
        eager={eager}
        sizes={sizes}
      />
    </Container>
  )
}

const ImageOrPlaceholder = ({
  image,
  size = "small",
  eager,
  sizes,
}: Pick<ThumbnailProps, "size" | "eager" | "sizes"> & { image?: string }) => {
  const { t } = useTranslation()

  return image ? (
    <Image
      src={normalizeImageUrl(image)}
      alt={t("product.productImage")}
      className="absolute inset-0 object-cover object-center"
      draggable={false}
      sizes={sizes ?? DEFAULT_SIZES[size]}
      loading={eager ? "eager" : undefined}
      fetchPriority={eager ? "high" : undefined}
      fill
    />
  ) : (
    <div className="w-full h-full absolute inset-0 flex items-center justify-center">
      <PlaceholderImage size={size === "small" ? 16 : 24} />
    </div>
  )
}

export default Thumbnail