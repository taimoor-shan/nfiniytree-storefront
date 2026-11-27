/**
 * The order of a product's options and of each option's values, as set in the
 * admin's "Option order" box (backend `src/admin/widgets/product-option-order-widget.tsx`).
 *
 *   - Options: Medusa keeps no order for a product's options, so the box saves
 *     the option ids in the product's metadata as `option_order` (an array).
 *     An option it does not list (added later) comes after the listed ones.
 *   - Values: Medusa's own `rank` on each option value (the box saves it).
 *     A value without a rank (added later) comes after the ranked ones.
 *   Both keep Medusa's order for whatever has no place, so a product nobody
 *   has sorted looks as it always did.
 *
 * `listProducts()` applies it to every product it returns, so the buy box, the
 * mobile bar, the default variant and the gallery all read the same order.
 * Keep in step with the backend's `src/admin/lib/option-order.ts`.
 * `npx tsx src/lib/util/option-order.test.ts`
 */

export const OPTION_ORDER_KEY = "option_order"

type RankedValue = { value: string; rank?: number | null }
type OrderableOption = { id: string; values?: RankedValue[] | null }
type OrderableProduct<O> = {
  metadata?: Record<string, unknown> | null
  options?: O[] | null
}

/** The option ids saved in the metadata, or none when the value is not a list of ids. */
export const readOptionOrder = (
  metadata?: Record<string, unknown> | null
): string[] => {
  let raw = metadata?.[OPTION_ORDER_KEY]
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw)
    } catch {
      return []
    }
  }
  return Array.isArray(raw)
    ? raw.filter((id): id is string => typeof id === "string")
    : []
}

/** A stable sort: equal keys keep the order they came in. */
const stableSortBy = <T>(items: T[], key: (item: T) => number): T[] =>
  items
    .map((item, index) => ({ item, index, key: key(item) }))
    .sort((a, b) => a.key - b.key || a.index - b.index)
    .map(({ item }) => item)

/** Values by their rank, those without one last, in Medusa's order. */
export const sortOptionValues = <V extends RankedValue>(values: V[]): V[] =>
  stableSortBy(values, (value) =>
    typeof value.rank === "number" ? value.rank : Number.POSITIVE_INFINITY
  )

/** Options in the saved order, each with its values sorted. */
export const sortProductOptions = <O extends OrderableOption>(
  options: O[],
  metadata?: Record<string, unknown> | null
): O[] => {
  const order = readOptionOrder(metadata)
  const place = (id: string) => {
    const index = order.indexOf(id)
    return index === -1 ? Number.POSITIVE_INFINITY : index
  }
  return stableSortBy(options, (option) => place(option.id)).map((option) =>
    option.values ? { ...option, values: sortOptionValues(option.values) } : option
  )
}

/** The product with its options and values in the admin's order. */
export const withOrderedOptions = <P extends OrderableProduct<any>>(
  product: P
): P =>
  product.options?.length
    ? { ...product, options: sortProductOptions(product.options, product.metadata) }
    : product

/**
 * Variants in the order of their options: by the first option's value, then
 * the second's, and so on, as a shopper reads the buy box. A variant with a
 * value the options do not list goes after the others, keeping Medusa's order.
 */
export const sortVariantsByOptions = <
  T extends { options?: { option_id?: string | null; value?: string | null }[] | null },
>(
  variants: T[],
  options: { id: string; values: string[] }[]
): T[] => {
  if (options.length === 0) return variants
  const indexed = variants.map((variant, index) => ({
    variant,
    index,
    key: options.map((option) => {
      const value = variant.options?.find(
        (choice) => choice.option_id === option.id
      )?.value
      const at = value == null ? -1 : option.values.indexOf(value)
      return at === -1 ? Number.POSITIVE_INFINITY : at
    }),
  }))
  indexed.sort((a, b) => {
    for (let i = 0; i < a.key.length; i++) {
      if (a.key[i] !== b.key[i]) return a.key[i] < b.key[i] ? -1 : 1
    }
    return a.index - b.index
  })
  return indexed.map(({ variant }) => variant)
}
