"use client"

import Lightbox from "yet-another-react-lightbox"
import Zoom from "yet-another-react-lightbox/plugins/zoom"
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails"
import "yet-another-react-lightbox/styles.css"
import "yet-another-react-lightbox/plugins/thumbnails.css"

/**
 * The lightbox, its two plugins and their stylesheets, isolated into their own
 * module so `next/dynamic` can split them out of the PDP bundle.
 *
 * These were imported at module scope in `image-gallery`, so every product page
 * downloaded, parsed and hydrated the whole lightbox even though it only ever
 * appears after a click. Keeping the imports here — rather than inside a
 * `dynamic(() => import("yet-another-react-lightbox"))` call in the gallery —
 * is what lets the plugins and the CSS travel in the same lazy chunk.
 *
 * Props mirror the original call site exactly; behaviour is unchanged.
 */
export type ProductLightboxProps = {
  open: boolean
  close: () => void
  index: number
  slides: { src: string }[]
  onView: (index: number) => void
}

const ProductLightbox = ({
  open,
  close,
  index,
  slides,
  onView,
}: ProductLightboxProps) => {
  return (
    <Lightbox
      open={open}
      close={close}
      index={index}
      slides={slides}
      plugins={[Zoom, Thumbnails]}
      carousel={{ imageFit: "contain" }}
      zoom={{ scrollToZoom: true }}
      thumbnails={{ position: "bottom", width: 80, height: 80, gap: 8 }}
      on={{ view: ({ index: i }) => onView(i) }}
    />
  )
}

export default ProductLightbox
