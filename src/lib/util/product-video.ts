/**
 * The product video in the gallery.
 *
 * A product keeps it in its metadata (product → "Product video" in the admin):
 *   video_url     the video file, MP4 or WebM
 *   video_poster  the still image that stands for the video, with a play button
 *                 on it, in the thumbnails and in the gallery before it plays.
 *                 Optional: without one the product's first image is used
 *
 * The gallery shows the video after the product's second image (after the last
 * one when there are fewer) and plays it in place. Only the file is supported,
 * not a YouTube or Vimeo page: those need an embed, which would load a third
 * party's scripts and cookies before the visitor has said yes.
 */

export type ProductVideo = {
  url: string
  poster?: string
}

export type GalleryImage = {
  id: string
  url?: string | null
}

export type GallerySlide =
  | { kind: "image"; id: string; url: string | null }
  | { kind: "video"; id: string; url: string; poster: string | null }

type ProductLike = {
  metadata?: Record<string, unknown> | null
}

/** How many images come before the video. */
export const VIDEO_AFTER_IMAGES = 2

export const VIDEO_SLIDE_ID = "product-video"

/**
 * An address the browser can load: one on the web, or a path on the shop's own
 * origin (`/static/…`, where uploads are served). Anything else (`javascript:`,
 * `data:`, a protocol-relative `//host`) is dropped rather than put in a page.
 */
const asMediaUrl = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined
  const url = value.trim()
  return /^(https?:\/\/\S|\/(?!\/)\S)/i.test(url) ? url : undefined
}

export function getProductVideo(product: ProductLike): ProductVideo | undefined {
  const url = asMediaUrl(product.metadata?.video_url)
  if (!url) return undefined

  const poster = asMediaUrl(product.metadata?.video_poster)
  return poster ? { url, poster } : { url }
}

/** The images in order, with the video placed among them. */
export function buildGallerySlides(
  images: GalleryImage[],
  video?: ProductVideo
): GallerySlide[] {
  const slides: GallerySlide[] = images.map((image) => ({
    kind: "image",
    id: image.id,
    url: image.url || null,
  }))

  if (!video) return slides

  const firstImage = images.find((image) => image.url)?.url ?? null

  slides.splice(Math.min(VIDEO_AFTER_IMAGES, slides.length), 0, {
    kind: "video",
    id: VIDEO_SLIDE_ID,
    url: video.url,
    poster: video.poster ?? firstImage,
  })

  return slides
}
