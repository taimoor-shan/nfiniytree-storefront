"use client"

import { HttpTypes } from "@medusajs/types"
import { Container } from "@medusajs/ui"
import Image from "next/image"
import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { ChevronLeft, ChevronRight, Play } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { normalizeImageUrl } from "@lib/util/image-url"
import { buildGallerySlides, type ProductVideo } from "@lib/util/product-video"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
  /**
   * Product name, used to build meaningful alt text. Without it the gallery can
   * only say "product image".
   */
  productTitle?: string
  /**
   * The product's video. It is one more item of the gallery, after the second
   * image: a still image with a play button until it is played, then the video
   * itself in place of the big image.
   */
  video?: ProductVideo
}

const ImageGallery = ({ images, productTitle, video }: ImageGalleryProps) => {
  const { t } = useTranslation()
  const [activeIndex, setActiveIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [videoFailed, setVideoFailed] = useState(false)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  const slides = useMemo(
    () => buildGallerySlides(images ?? [], video),
    [images, video]
  )
  // What the gallery holds. A refresh of the page hands over the same images as
  // a new array; going by what is in it keeps the shopper on the image (or the
  // video) they were looking at.
  const contents = slides.map((slide) => slide.id).join("|")

  useEffect(() => {
    setActiveIndex(0)
  }, [contents])

  // The player only exists while the video plays, so moving to another item
  // stops it, and coming back shows the still image and the play button again.
  useEffect(() => {
    setPlaying(false)
    setVideoFailed(false)
  }, [activeIndex, contents])

  // Starts the video as soon as its player exists, inside the shopper's press
  // of the play button (a phone may refuse to start a video with sound
  // otherwise), and gives the player the keyboard focus the play button had
  // before it went away.
  const startPlayer = useCallback((player: HTMLVideoElement | null) => {
    if (!player) return
    player.focus({ preventScroll: true })
    player.play().catch(() => {
      // Refused: the controls are showing and the shopper can press play there.
    })
  }, [])

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex(Math.max(0, Math.min(index, slides.length - 1)))
    },
    [slides.length]
  )

  const goNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % slides.length)
  }, [slides.length])

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length)
  }, [slides.length])

  if (slides.length === 0) {
    return null
  }

  const activeSlide = slides[activeIndex] ?? slides[0]
  const videoPlaying = activeSlide.kind === "video" && playing
  const stageUrl =
    activeSlide.kind === "image" ? activeSlide.url : activeSlide.poster
  const name = productTitle?.trim() || t("product.productImage")

  // A swipe along the video's own controls (scrubbing, volume) is not a swipe
  // of the gallery.
  const onTouchStart = (e: React.TouchEvent) => {
    if (videoPlaying) return
    touchStartX.current = e.touches[0].clientX
    // A tap sends no move event; without this it would be measured against the
    // end of the last swipe, and tapping the play button would turn the page.
    touchEndX.current = touchStartX.current
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (videoPlaying) return
    touchEndX.current = e.touches[0].clientX
  }

  const onTouchEnd = () => {
    if (videoPlaying) return
    const diff = touchStartX.current - touchEndX.current
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext()
      else goPrev()
    }
  }

  // "Sunset Olive Tree — image 2 of 5" instead of a bare "Product image":
  // says which product and where in the set the shopper is. Shared by the hero
  // and every thumbnail, so no image in the gallery is left unnamed. The video
  // counts as one of the items and has its own wording.
  const describeSlide = (index: number) =>
    t(
      slides[index].kind === "video"
        ? "a11y.productVideoOf"
        : "a11y.productImageOf"
    )
      .replace("{product}", name)
      .replace("{index}", String(index + 1))
      .replace("{total}", String(slides.length))

  return (
    <div className="flex gap-x-4 relative w-full justify-end">
      {/* Thumbnails — desktop only, scrollable if more than 6 */}
      {slides.length > 1 && (
        <div className="hidden lg:flex flex-col gap-y-4 overflow-y-auto max-h-[680px] pr-1">
          {slides.map((slide, index) => {
            const thumbnailUrl = slide.kind === "image" ? slide.url : slide.poster

            return (
              <button
                key={slide.id}
                type="button"
                className={`w-[100px] h-[100px] shrink-0 relative aspect-square overflow-hidden rounded-md border-2 bg-surface-card transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas ${
                  index === activeIndex
                    ? "border-primary"
                    : "border-transparent hover:border-hairline-strong"
                }`}
                onClick={() => goTo(index)}
                // The button's accessible name is this aria-label, which wins over
                // its content, so the image's alt is not announced a second time.
                // The alt is for crawlers, image search and SEO audits, which read
                // every <img> — thumbnails included, not just the hero.
                aria-label={t(
                  slide.kind === "video" ? "a11y.viewVideo" : "a11y.viewImage"
                )
                  .replace("{index}", String(index + 1))
                  .replace("{total}", String(slides.length))}
                aria-current={index === activeIndex ? "true" : undefined}
              >
                {!!thumbnailUrl && (
                  <Image
                    src={normalizeImageUrl(thumbnailUrl)}
                    alt={describeSlide(index)}
                    fill
                    sizes="100px"
                    style={{ objectFit: "cover" }}
                  />
                )}
                {slide.kind === "video" && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 flex items-center justify-center bg-black/20"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink shadow-md">
                      <Play className="ml-0.5 h-4 w-4 fill-current" />
                    </span>
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Main Image. A plain positioning wrapper for the hero image; the touch
          handlers drive the mobile swipe carousel. */}
      <Container
        className="relative aspect-[4/5] w-full max-w-[560px] overflow-hidden bg-surface-card p-0"
        id={activeSlide.id}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {!!stageUrl && (
          <Image
            src={normalizeImageUrl(stageUrl)}
            // The PDP hero image and the page's LCP element. `priority` is
            // deprecated in Next 16; `preload` is its explicit replacement and
            // is appropriate here because there is exactly one candidate.
            preload
            // Higher than the 75 used for grid thumbnails — this is the PDP hero
            // image shoppers look at most closely. Both values are declared in
            // next.config.js `images.qualities`.
            quality={85}
            className="absolute inset-0 rounded-md"
            alt={describeSlide(activeIndex)}
            fill
            // Container is `w-full max-w-[600px]`, and the left column only
            // becomes a 55% flex child at the `small` (1024px) breakpoint.
            sizes="(max-width: 1023px) 100vw, 600px"
            style={{ objectFit: "cover" }}
          />
        )}

        {/* The video. Its still image (above) is all that loads until the
            shopper presses play, so the page does not pay for a file most
            visitors never watch. The click is also what lets it start with
            sound. */}
        {activeSlide.kind === "video" &&
          (videoPlaying ? (
            <video
              key={activeSlide.url}
              ref={startPlayer}
              src={normalizeImageUrl(activeSlide.url)}
              poster={
                activeSlide.poster
                  ? normalizeImageUrl(activeSlide.poster)
                  : undefined
              }
              controls
              autoPlay
              playsInline
              aria-label={describeSlide(activeIndex)}
              className="absolute inset-0 z-[5] h-full w-full rounded-md bg-black object-contain"
              onError={() => {
                setPlaying(false)
                setVideoFailed(true)
              }}
            />
          ) : (
            <button
              type="button"
              className="absolute inset-0 z-[5] flex items-center justify-center bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
              onClick={() => {
                setVideoFailed(false)
                setPlaying(true)
              }}
              aria-label={t("product.playVideo")}
            >
              <span
                aria-hidden="true"
                className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-ink shadow-md transition-transform hover:scale-105"
              >
                <Play className="ml-1 h-7 w-7 fill-current" />
              </span>
            </button>
          ))}

        {videoFailed && (
          <p
            role="alert"
            className="absolute inset-x-4 bottom-4 z-[6] rounded-md bg-white/90 px-3 py-2 text-center text-sm text-ink"
          >
            {t("product.videoUnavailable")}
          </p>
        )}

        {/* Mobile carousel: arrows + dot indicators */}
        {slides.length > 1 && (
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

              The dots sit where the player's own controls are, so they give
              way while the video plays (the arrows stay).
            */}
            {!videoPlaying && (
              <div className="lg:hidden absolute bottom-3 left-1/2 -translate-x-1/2 flex z-10">
                {slides.map((slide, index) => (
                  <button
                    key={slide.id}
                    type="button"
                    // The visible dot stays 2px tall; the hit area is padded out
                    // to the 24x24 minimum required by WCAG 2.2 target size
                    // (2.5.8), with no negative margin so targets never overlap.
                    className="relative flex items-center justify-center w-6 h-6 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    onClick={() => goTo(index)}
                    aria-label={t(
                      slide.kind === "video"
                        ? "product.goToVideo"
                        : "product.goToImage"
                    ).replace("{index}", String(index + 1))}
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
            )}
          </>
        )}
      </Container>
    </div>
  )
}

export default ImageGallery
