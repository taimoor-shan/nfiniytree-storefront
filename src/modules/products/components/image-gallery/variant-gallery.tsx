"use client"

import type { HttpTypes } from "@medusajs/types"
import { useMemo } from "react"

import { useProductSelection } from "@lib/context/product-selection-context"
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

  return (
    <ImageGallery
      images={shown}
      productTitle={productTitle}
      video={video}
      // A product with several pictures shows its thumbnails for most choices.
      // When a choice shows just one picture, their place stays free so the big
      // picture keeps its size instead of growing under the shopper.
      reserveThumbnails={images.length + (video ? 1 : 0) > 1}
    />
  )
}

export default VariantGallery
