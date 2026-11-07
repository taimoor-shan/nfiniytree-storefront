/**
 * Which pictures the product gallery shows for what the shopper has chosen.
 *
 * In the admin a picture is tied to the variants it shows (Product → Media →
 * the picture → variants, or a variant's own images). A picture tied to none is
 * shared: it belongs to every variant. The store API hands the ties over as
 * `images[].variants` (`+images.variants.id` in `listProducts()`).
 *
 * The gallery follows the shopper's choice:
 *   - nothing chosen yet: the whole product, in the order the admin ranks it
 *     (as the gallery always was);
 *   - a variant, or just some of its options, chosen: the pictures of the
 *     variants that still fit, then the shared ones. The first picture is the
 *     plant the shopper picked, and the rest of the gallery follows it.
 *
 * Medusa's own `variant.images` puts the shared pictures first, which would
 * show the picked plant last, so the order is worked out here instead.
 *
 * Pure and framework-free, so the rules are tested on their own.
 * `npx tsx src/lib/util/variant-gallery.test.ts`
 */
import type { GalleryImage } from "./product-video"

/** A picture of the product and the variants it is tied to in the admin. */
export type VariantTiedImage = GalleryImage & {
  variants?: { id: string }[] | null
}

/** What the gallery needs of a variant: which value it has of each option. */
export type GalleryVariant = {
  id: string
  options?: { option_id?: string | null; value?: string | null }[] | null
}

/** An option of the product (the pod, the plant) and the values it offers. */
export type GalleryOption = { id: string; values: string[] }

/** The shopper's choice: option id → the value picked, none for an option not yet picked. */
export type OptionChoice = Record<string, string | undefined>

const isTied = (image: VariantTiedImage) => (image.variants?.length ?? 0) > 0

/**
 * The pictures to show for `choice`, in the order to show them.
 *
 * Always hands back the product's own picture objects, and the very same array
 * whenever the choice changes nothing (no ties, nothing chosen, no variant fits,
 * or nothing would be left), so callers can compare by identity.
 */
export function selectGalleryImages<T extends VariantTiedImage>(
  images: T[],
  variants: GalleryVariant[],
  choice: OptionChoice
): T[] {
  // A product that ties no picture to a variant has nothing to sort out.
  if (!images.some(isTied)) return images

  const chosen = Object.entries(choice).filter(([, value]) => !!value)
  if (chosen.length === 0) return images

  const fitting = new Set(
    variants
      .filter((variant) =>
        chosen.every(([optionId, value]) =>
          variant.options?.some(
            (option) => option.option_id === optionId && option.value === value
          )
        )
      )
      .map((variant) => variant.id)
  )
  // A combination the product does not have (an "unavailable" pick).
  if (fitting.size === 0) return images

  const own = images.filter((image) =>
    image.variants?.some((tie) => fitting.has(tie.id))
  )
  const shared = images.filter((image) => !isTied(image))
  const shown = [...own, ...shared]

  // Every picture belongs to some other variant: show the product rather than
  // an empty gallery.
  return shown.length > 0 ? shown : images
}

/**
 * The first picture each next click would put on show, except the one on show
 * now and any listed twice: what the page fetches ahead (when the browser is
 * idle), so choosing feels instant. A click is one option changed to one of its
 * other values. Stops after `limit` pictures.
 */
export function nextGalleryHeads<T extends VariantTiedImage>(
  images: T[],
  variants: GalleryVariant[],
  options: GalleryOption[],
  choice: OptionChoice,
  limit = 8
): T[] {
  // A picture with no address cannot be fetched, nor put on show.
  const head = (shown: T[]) => shown.find((image) => !!image.url)

  const onShow = head(selectGalleryImages(images, variants, choice))
  const seen = new Set<string>(onShow ? [onShow.id] : [])
  const heads: T[] = []

  for (const option of options) {
    for (const value of option.values) {
      if (choice[option.id] === value) continue

      const next = head(
        selectGalleryImages(images, variants, { ...choice, [option.id]: value })
      )
      if (!next || seen.has(next.id)) continue

      seen.add(next.id)
      heads.push(next)
      if (heads.length >= limit) return heads
    }
  }

  return heads
}

/** The parts of a store product the gallery reads. */
type GalleryProduct = {
  images?: VariantTiedImage[] | null
  variants?: GalleryVariant[] | null
  options?: { id: string; values?: { value: string }[] | null }[] | null
}

/**
 * What the gallery takes of a store product: the pictures with the variants
 * they are tied to, each variant's option values and the options on offer, cut
 * down to those fields (no rank, metadata, prices...) and in one fixed shape,
 * so the rules above never meet a missing array. The gallery runs in the
 * browser on the very product object the buy box gets, which crosses to the
 * browser once; this is worked out there rather than on the server, where it
 * would be a second copy to send.
 */
export function galleryDataOf(product: GalleryProduct): {
  images: VariantTiedImage[]
  variants: GalleryVariant[]
  options: GalleryOption[]
} {
  return {
    images: (product.images ?? []).map((image) => ({
      id: image.id,
      url: image.url ?? null,
      variants: (image.variants ?? []).map((tied) => ({ id: tied.id })),
    })),
    variants: (product.variants ?? []).map((variant) => ({
      id: variant.id,
      options: (variant.options ?? []).map((option) => ({
        option_id: option.option_id,
        value: option.value,
      })),
    })),
    options: (product.options ?? []).map((option) => ({
      id: option.id,
      values: (option.values ?? []).map((value) => value.value),
    })),
  }
}
