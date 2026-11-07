import { getImageProps } from "next/image"
import { useEffect } from "react"

import { normalizeImageUrl } from "@lib/util/image-url"

/**
 * How the gallery's big picture is asked for. The picture on show and the ones
 * fetched ahead must ask the same way, or the browser would fetch a different
 * file for each and the pictures fetched ahead would be wasted. Both
 * values are declared in next.config.js `images` (`qualities` is an allowlist).
 */
export const HERO_IMAGE_SIZES = "(max-width: 1023px) 100vw, 600px"
export const HERO_IMAGE_QUALITY = 85

const requested = new Set<string>()
// Kept until they finish: a picture nothing refers to could be dropped before
// it has loaded.
const loading = new Set<HTMLImageElement>()

/**
 * Asks for the big picture ahead of time, so that when the shopper picks the
 * variant it belongs to, it is already in the browser's cache. Goes through
 * `getImageProps()`, the same call `<Image>` makes, so the address (size and
 * quality included) is the one the gallery will ask for.
 */
export function fetchHeroAhead(url: string) {
  if (requested.has(url)) return
  requested.add(url)

  try {
    const { props } = getImageProps({
      src: normalizeImageUrl(url),
      alt: "",
      fill: true,
      sizes: HERO_IMAGE_SIZES,
      quality: HERO_IMAGE_QUALITY,
    })

    const image = new window.Image()
    const done = () => loading.delete(image)
    image.onload = done
    image.onerror = done
    // Whatever the page is doing comes first.
    image.fetchPriority = "low"
    image.decoding = "async"
    image.sizes = props.sizes ?? ""
    image.srcset = props.srcSet ?? ""
    image.src = props.src
    loading.add(image)
  } catch {
    // Only a head start: a picture that cannot be fetched ahead is loaded when
    // it is chosen, exactly as without this.
  }
}

/** A shopper who asked to save data, or is on a very slow line, is left alone. */
const sparesData = () => {
  const connection = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string }
    }
  ).connection

  return (
    !!connection &&
    (!!connection.saveData || /(^|-)2g$/.test(connection.effectiveType ?? ""))
  )
}

/** Runs `task` when the browser has nothing better to do. */
const whenIdle = (task: () => void) => {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(task, { timeout: 4000 })
    return () => window.cancelIdleCallback(id)
  }

  const id = window.setTimeout(task, 1500)
  return () => window.clearTimeout(id)
}

/** Fetches these big pictures ahead, once the page is idle. */
export function useFetchHeroesAhead(urls: string[]) {
  useEffect(() => {
    if (urls.length === 0 || sparesData()) return

    return whenIdle(() => urls.forEach(fetchHeroAhead))
  }, [urls])
}
