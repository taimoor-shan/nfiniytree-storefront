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
  galleryDataOf,
  nextGalleryHeads,
  selectGalleryImages,
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
 * The product gallery, following the shopper's choice of options: the pictures
 * of the variant they picked first, then the shared ones (see
 * `selectGalleryImages()`). It all happens here in the browser, from what the
 * page already holds: choosing never goes back to the server.
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

  const shown = useMemo(
    () => selectGalleryImages(images, variants, choice),
    [images, variants, choice]
  )

  // The big picture each next click would show, fetched while the browser is
  // idle: choosing a plant then changes the picture at once, as it does in the
  // best online shops, instead of waiting for it to load.
  const ahead = useMemo(
    () =>
      nextGalleryHeads(images, variants, options, choice).flatMap((image) =>
        image.url ? [image.url] : []
      ),
    [images, variants, options, choice]
  )
  useFetchHeroesAhead(ahead)

  // What the alt text adds to the product's name: its height and the chosen
  // options ("Red Maple, 220 cm tall, Gold – image 1 of 6"), so each picture
  // is described rather than only numbered.
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
      // Only name the chosen options when the pictures are the chosen
      // plant's: a gallery that fell back to the whole product shows others.
      ...(shown !== images ? Object.values(choice ?? {}) : []),
    ].filter((part): part is string => !!part && !!part.trim())
    return parts.length ? `, ${parts.join(", ")}` : ""
  }, [product, choice, shown, images, t, locale])

  return (
    <ImageGallery
      images={shown}
      productTitle={productTitle}
      productDetails={details}
      video={video}
      // A product with several pictures shows its thumbnails for most choices.
      // When a choice shows just one picture, their place stays free so the big
      // picture keeps its size instead of growing under the shopper.
      reserveThumbnails={images.length + (video ? 1 : 0) > 1}
    />
  )
}

export default VariantGallery
