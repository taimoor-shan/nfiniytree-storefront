"use client"

import { HttpTypes } from "@medusajs/types"
import { Container } from "@medusajs/ui"
import Image from "next/image"
import { useState, useEffect, useCallback, useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Lightbox from "yet-another-react-lightbox"
import Zoom from "yet-another-react-lightbox/plugins/zoom"
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails"
import "yet-another-react-lightbox/styles.css"
import "yet-another-react-lightbox/plugins/thumbnails.css"
import { useTranslation } from "@/lib/i18n"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

const ImageGallery = ({ images }: ImageGalleryProps) => {
  const { t } = useTranslation()
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
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
  const slides = images.map((img) => ({ src: img.url }))

  return (
    <>
    <div className="flex gap-x-4 relative w-full justify-end">
      {/* Thumbnails — desktop only, scrollable if more than 6 */}
      {images.length > 1 && (
        <div className="hidden lg:flex flex-col gap-y-4 overflow-y-auto max-h-[680px] pr-1">
          {images.map((image, index) => (
            <button
              key={image.id}
              className={`w-[100px] h-[100px] shrink-0 relative aspect-square overflow-hidden rounded-md border-2 transition-all ${
                index === activeIndex
                  ? "border-primary"
                  : "border-transparent hover:border-hairline-strong"
              }`}
              onClick={() => goTo(index)}
            >
              {!!image.url && (
                <Image
                  src={image.url}
                  alt={t("product.thumbnail").replace("{index}", String(index + 1))}
                  fill
                  sizes="100px"
                  style={{ objectFit: "cover" }}
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Main Image */}
      <Container
        className="relative aspect-[4/5] w-full max-w-[600px] overflow-hidden bg-surface-card cursor-pointer"
        id={activeImage.id}
        onClick={() => {
          setLightboxIndex(activeIndex)
          setLightboxOpen(true)
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {!!activeImage.url && (
          <Image
            src={activeImage.url}
            priority={true}
            className="absolute inset-0 rounded-md"
            alt={t("product.productImage")}
            fill
            sizes="(max-width: 576px) 100vw, (max-width: 992px) 50vw, 800px"
            style={{ objectFit: "cover" }}
          />
        )}

        {/* Mobile carousel: arrows + dot indicators */}
        {images.length > 1 && (
          <>
            <button
              className="lg:hidden absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 flex items-center justify-center shadow-md z-10"
              onClick={goPrev}
              aria-label={t("product.previousImage")}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              className="lg:hidden absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 flex items-center justify-center shadow-md z-10"
              onClick={goNext}
              aria-label={t("product.nextImage")}
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="lg:hidden absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {images.map((_, index) => (
                <button
                  key={index}
                  className={`rounded-full transition-all ${
                    index === activeIndex
                      ? "bg-primary w-4 h-2"
                      : "bg-white/70 w-2 h-2"
                  }`}
                  onClick={() => goTo(index)}
                  aria-label={t("product.goToImage").replace("{index}", String(index + 1))}
                />
              ))}
            </div>
          </>
        )}
      </Container>
    </div>
    <Lightbox
      open={lightboxOpen}
      close={() => setLightboxOpen(false)}
      index={lightboxIndex}
      slides={slides}
      plugins={[Zoom, Thumbnails]}
      carousel={{ imageFit: "contain" }}
      zoom={{ scrollToZoom: true }}
      thumbnails={{ position: "bottom", width: 80, height: 80, gap: 8 }}
      on={{ view: ({ index: i }) => setLightboxIndex(i) }}
    />
  </>
  )
}

export default ImageGallery
