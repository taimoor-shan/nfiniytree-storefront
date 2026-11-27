/**
 * The order of the product gallery, and the picture it moves to when the
 * shopper chooses.
 *
 * In the admin a picture is tied to the variants it shows (Product → Media →
 * the picture → variants, or a variant's own images). A picture tied to none is
 * shared: it belongs to every variant. The store API hands the ties over as
 * `images[].variants` (`+images.variants.id` in `listProducts()`).
 *
 * The gallery always shows every picture of the product, so a visitor sees all
 * of them from the first visit:
 *   - first the pictures of each variant, the variants in the order of their
 *     options (the first value of the first option first, as the buy box lists
 *     them; `sortVariantsByOptions()`), each variant's pictures in the admin's
 *     order, a picture tied to several variants where its first variant is;
 *   - then the shared pictures, in the admin's order.
 * Choosing a variant (or just some of its options) moves the gallery to the
 * first picture of a variant that fits (`focusImageFor()`); nothing is hidden.
 *
 * Pure and framework-free, so the rules are tested on their own.
 * `npx tsx src/lib/util/variant-gallery.test.ts`
 */
import { sortProductOptions, sortVariantsByOptions } from "./option-order"
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

/** An option of the product (the pod, the plant) and the values it offers, in order. */
export type GalleryOption = { id: string; values: string[] }

/** The shopper's choice: option id → the value picked, none for an option not yet picked. */
export type OptionChoice = Record<string, string | undefined>

const isTied = (image: VariantTiedImage) => (image.variants?.length ?? 0) > 0

/**
 * Every picture of the product, in gallery order (see above). Hands back the
 * product's own picture objects, and the very same array when no picture is
 * tied to a variant (the admin's order is then the gallery's), so callers can
 * compare by identity.
 */
export function orderGalleryImages<T extends VariantTiedImage>(
  images: T[],
  variants: GalleryVariant[],
  options: GalleryOption[]
): T[] {
  if (!images.some(isTied)) return images

  const placed = new Set<string>()
  const ordered: T[] = []
  for (const variant of sortVariantsByOptions(variants, options)) {
    for (const image of images) {
      if (placed.has(image.id)) continue
      if (image.variants?.some((tie) => tie.id === variant.id)) {
        placed.add(image.id)
        ordered.push(image)
      }
    }
  }
  // Shared pictures, and any tied only to a variant the product no longer has.
  for (const image of images) {
    if (!placed.has(image.id)) ordered.push(image)
  }
  return ordered
}

/**
 * The picture the gallery moves to for `choice`: the first picture, in gallery
 * order (`ordered`, from `orderGalleryImages()`), of a variant that fits every
 * chosen option. None when nothing is chosen, no variant fits, or the fitting
 * variants have no picture of their own (the gallery then stays where it is).
 */
export function focusImageFor<T extends VariantTiedImage>(
  ordered: T[],
  variants: GalleryVariant[],
  choice: OptionChoice
): T | undefined {
  const chosen = Object.entries(choice).filter(([, value]) => !!value)
  if (chosen.length === 0) return undefined

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
  if (fitting.size === 0) return undefined

  return ordered.find(
    (image) => !!image.url && image.variants?.some((tie) => fitting.has(tie.id))
  )
}

/**
 * The picture each next click would move to, except the one on show for the
 * current choice and any listed twice: what the page fetches ahead (when the
 * browser is idle), so choosing feels instant. A click is one option changed to
 * one of its other values. Stops after `limit` pictures.
 */
export function nextGalleryHeads<T extends VariantTiedImage>(
  ordered: T[],
  variants: GalleryVariant[],
  options: GalleryOption[],
  choice: OptionChoice,
  limit = 8
): T[] {
  const onShow =
    focusImageFor(ordered, variants, choice) ??
    ordered.find((image) => !!image.url)
  const seen = new Set<string>(onShow ? [onShow.id] : [])
  const heads: T[] = []

  for (const option of options) {
    for (const value of option.values) {
      if (choice[option.id] === value) continue

      const next = focusImageFor(ordered, variants, {
        ...choice,
        [option.id]: value,
      })
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
  options?:
    | { id: string; values?: { value: string; rank?: number | null }[] | null }[]
    | null
  metadata?: Record<string, unknown> | null
}

/**
 * What the gallery takes of a store product: the pictures with the variants
 * they are tied to, each variant's option values and the options on offer, cut
 * down to those fields (no rank, metadata, prices...) and in one fixed shape,
 * so the rules above never meet a missing array. The gallery runs in the
 * browser on the very product object the buy box gets, which crosses to the
 * browser once; this is worked out there rather than on the server, where it
 * would be a second copy to send. The options come in the admin's order
 * (`sortProductOptions()`, already applied by `listProducts()`; done again here
 * so a product from anywhere else is ordered the same way).
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
    options: sortProductOptions(product.options ?? [], product.metadata).map(
      (option) => ({
        id: option.id,
        values: (option.values ?? []).map((value) => value.value),
      })
    ),
  }
}
