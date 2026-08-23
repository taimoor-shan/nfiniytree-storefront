"use client"

import { HttpTypes } from "@medusajs/types"
import { Container } from "@medusajs/ui"
import Image from "next/image"
import dynamic from "next/dynamic"
import { useState, useEffect, useCallback, useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { normalizeImageUrl } from "@lib/util/image-url"

/**
 * The lightbox is ~180kb of JS + CSS that only matters after a click, so it is
 * split out of the PDP bundle. It is mounted on first pointer intent (see
 * `lightboxMounted`) rather than on click, so the chunk is normally already
 * fetched by the time the click lands.
 */
const ProductLightbox = dynamic(() => import("./product-lightbox"), {
  ssr: false,
})

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
  /**
   * Product name, used to build meaningful alt text and the accessible name of
   * the zoom control. Without it the gallery can only say "product image".
   */
  productTitle?: string
}

const ImageGallery = ({ images, productTitle }: ImageGalleryProps) => {
  const { t } = useTranslation()
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  // Once true, stays true — so the close animation plays out and re-opening is
  // instant instead of re-triggering a chunk load.
  const [lightboxMounted, setLightboxMounted] = useState(false)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  useEffect(() => {
    setActiveIndex(0)
  }, [images])

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex(Math.max(0, Math.min(index, images.length - 1)))
    },
    [images.length]
  )

  const goNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % images.length)
  }, [images.length])

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length)
  }, [images.length])

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
  }

  const onTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext()
      else goPrev()
    }
  }

  if (!images || images.length === 0) {
    return null
  }

  const activeImage = images[activeIndex]
  const slides = images.map((img) => ({ src: normalizeImageUrl(img.url) }))
  const name = productTitle?.trim() || t("product.productImage")

  // "Sunset Olive Tree — image 2 of 5" instead of a bare "Product image":
  // says which product and where in the set the shopper is.
  const describeImage = (index: number) =>
    t("a11y.productImageOf")
      .replace("{product}", name)
      .replace("{index}", String(index + 1))
      .replace("{total}", String(images.length))

  return (
    <>
    <div className="flex gap-x-4 relative w-full justify-end">
      {/* Thumbnails — desktop only, scrollable if more than 6 */}
      {images.length > 1 && (
        <div className="hidden lg:flex flex-col gap-y-4 overflow-y-auto max-h-[680px] pr-1">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              className={`w-[100px] h-[100px] shrink-0 relative aspect-square overflow-hidden rounded-md border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas ${
                index === activeIndex
                  ? "border-primary"
                  : "border-transparent hover:border-hairline-strong"
              }`}
              onClick={() => goTo(index)}
              // The button carries the name; the image inside it is decorative,
              // so an alt would just repeat it.
              aria-label={t("a11y.viewImage")
                .replace("{index}", String(index + 1))
                .replace("{total}", String(images.length))}
              aria-current={index === activeIndex ? "true" : undefined}
            >
              {!!image.url && (
                <Image
                  src={normalizeImageUrl(image.url)}
                  alt=""
                  fill
                  sizes="100px"
                  style={{ objectFit: "cover" }}
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Main Image. The Container used to be the click target itself — a
          clickable <div> with no accessible name, no keyboard path, and the
          mobile arrows nested inside it. It is now a plain positioning wrapper;
          the zoom control is a real <button> that sits below the z-10 carousel
          controls so nothing is nested. */}
      <Container
        className="relative aspect-[4/5] w-full max-w-[600px] overflow-hidden bg-surface-card p-0"
        id={activeImage.id}
        // Warm the lazy lightbox chunk before the click actually happens.
        onPointerEnter={() => setLightboxMounted(true)}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <button
          type="button"
          className="absolute inset-0 w-full h-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset rounded-md"
          onClick={() => {
            setLightboxMounted(true)
            setLightboxIndex(activeIndex)
            setLightboxOpen(true)
          }}
          onFocus={() => setLightboxMounted(true)}
          aria-label={t("a11y.enlargeImage").replace("{product}", name)}
          data-testid="product-image-zoom"
        >
          {!!activeImage.url && (
            <Image
              src={normalizeImageUrl(activeImage.url)}
              // The PDP hero image and the page's LCP element. `priority` is
              // deprecated in Next 16; `preload` is its explicit replacement and
              // is appropriate here because there is exactly one candidate.
              preload
              // Higher than the 75 used for grid thumbnails — this is the image
              // shoppers zoom into. Both values are declared in
              // next.config.js `images.qualities`.
              quality={85}
              className="absolute inset-0 rounded-md"
              alt={describeImage(activeIndex)}
              fill
              // Container is `w-full max-w-[600px]`, and the left column only
              // becomes a 55% flex child at the `small` (1024px) breakpoint.
              sizes="(max-width: 1023px) 100vw, 600px"
              style={{ objectFit: "cover" }}
            />
          )}
        </button>

        {/* Mobile carousel: arrows + dot indicators */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              className="lg:hidden absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 flex items-center justify-center shadow-md z-10"
              onClick={goPrev}
              aria-label={t("product.previousImage")}
            >
              <ChevronLeft aria-hidden="true" className="w-5 h-5" />
            </button>
            <button
              type="button"
              className="lg:hidden absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 flex items-center justify-center shadow-md z-10"
              onClick={goNext}
              aria-label={t("product.nextImage")}
            >
              <ChevronRight aria-hidden="true" className="w-5 h-5" />
            </button>

            {/*
              `gap-2` was removed rather than kept alongside the padded hit
              areas. Each button below is a full 24x24 target with the dot
              centred inside it, so the dots already sit 16px apart visually —
              adding the old 8px gap on top only pushed them further apart.

              The previous attempt used `w-6 h-6 -m-2`, which cancelled the
              padding it had just added: -8px margins against an 8px gap made
              neighbouring 24x24 targets overlap by 8px, so a tap near a dot's
              edge activated the dot beside it and WCAG 2.5.8 still failed.
            */}
            <div className="lg:hidden absolute bottom-3 left-1/2 -translate-x-1/2 flex z-10">
              {images.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  // The visible dot stays 2px tall; the hit area is padded out
                  // to the 24x24 minimum required by WCAG 2.2 target size
                  // (2.5.8), with no negative margin so targets never overlap.
                  className="relative flex items-center justify-center w-6 h-6 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  onClick={() => goTo(index)}
                  aria-label={t("product.goToImage").replace("{index}", String(index + 1))}
                  aria-current={index === activeIndex ? "true" : undefined}
                >
                  <span
                    aria-hidden="true"
                    className={`rounded-full transition-all ${
                      index === activeIndex
                        ? "bg-primary w-4 h-2"
                        : "bg-white/70 w-2 h-2"
                    }`}
                  />
                </button>
              ))}
            </div>
          </>
        )}
      </Container>
    </div>
    {lightboxMounted && (
      <ProductLightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={slides}
        onView={setLightboxIndex}
      />
    )}
  </>
  )
}

export default ImageGallery
