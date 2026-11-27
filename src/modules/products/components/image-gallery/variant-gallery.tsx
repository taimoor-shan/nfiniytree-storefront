"use client"

import type { HttpTypes } from "@medusajs/types"
import { useMemo } from "react"

import { useProductSelection } from "@lib/context/product-selection-context"
import { useTranslation } from "@lib/i18n/client"
import { getLocalizedMetadata } from "@lib/i18n/metadata"
import {
  localizeDecimals,
  parseApproxDimensions,
} from "@lib/util/approx-dimensions"
import type { ProductVideo } from "@lib/util/product-video"
import {
  focusImageFor,
  galleryDataOf,
  nextGalleryHeads,
  orderGalleryImages,
} from "@lib/util/variant-gallery"

import ImageGallery from "./index"
import { useFetchHeroesAhead } from "./hero-image"

type VariantGalleryProps = {
  /**
   * The product itself, the very object the buy box is given, so it crosses to
   * the browser once (a copy cut down on the server would be sent a second
   * time). The gallery takes what it needs of it, `galleryDataOf()`: the
   * pictures in the admin's order with the variants each is tied to, what the
   * variants are made of, and the options.
   */
  product: HttpTypes.StoreProduct
  productTitle?: string
  video?: ProductVideo
}

/**
 * The product gallery: every picture of the product from the first visit, the
 * variants' pictures in the order of their options, then the shared ones
 * (`orderGalleryImages()`). Choosing a variant moves the gallery to that
 * variant's first picture (`focusImageFor()`) and hides nothing. It all happens
 * here in the browser, from what the page already holds: choosing never goes
 * back to the server.
 */
const VariantGallery = ({
  product,
  productTitle,
  video,
}: VariantGalleryProps) => {
  const { options: choice } = useProductSelection()
  const { images, variants, options } = useMemo(
    () => galleryDataOf(product),
    [product]
  )

  const ordered = useMemo(
    () => orderGalleryImages(images, variants, options),
    [images, variants, options]
  )
  const focus = useMemo(
    () => focusImageFor(ordered, variants, choice),
    [ordered, variants, choice]
  )

  // The big picture each next click would show, fetched while the browser is
  // idle: choosing a plant then changes the picture at once, as it does in the
  // best online shops, instead of waiting for it to load.
  const ahead = useMemo(
    () =>
      nextGalleryHeads(ordered, variants, options, choice).flatMap((image) =>
        image.url ? [image.url] : []
      ),
    [ordered, variants, options, choice]
  )
  useFetchHeroesAhead(ahead)

  // What the alt text adds to the product's name: its height ("Red Maple,
  // 220 cm tall – image 1 of 6"). The gallery shows every variant's pictures,
  // so the chosen options would not describe most of them.
  const { t, locale } = useTranslation()
  const details = useMemo(() => {
    // Resolved the way the specifications read it, so JSON text is decoded.
    const approx = parseApproxDimensions(
      getLocalizedMetadata(product.metadata, locale || "en")?.approx_dimensions
    )
    const height = product.height
      ? `${product.height} cm`
      : approx?.height
        ? `${approx.height} ${approx.unit ?? "cm"}`
        : null
    const parts = [
      height &&
        t("a11y.productImageHeight").replace(
          "{height}",
          localizeDecimals(height, locale)
        ),
    ].filter((part): part is string => !!part && !!part.trim())
    return parts.length ? `, ${parts.join(", ")}` : ""
  }, [product, t, locale])

  return (
    <ImageGallery
      images={ordered}
      focusImageId={focus?.id}
      productTitle={productTitle}
      productDetails={details}
      video={video}
    />
  )
}

export default VariantGallery
