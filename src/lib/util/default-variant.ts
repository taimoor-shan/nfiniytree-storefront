/**
 * The variant a product page opens on.
 *
 * This is the rule the buy box has always used to preselect a variant
 * (`product-actions`), moved here so that the server can apply it too: the
 * gallery is part of the server-rendered page, and for it to open on the same
 * plant the buy box preselects, with no swap after the page loads, both must
 * come from one definition. `npx tsx src/lib/util/default-variant.test.ts`
 */
import type { HttpTypes } from "@medusajs/types"
import { hasPriceRange, isPriceOnRequest } from "./get-product-price"
import type { OptionChoice } from "./variant-gallery"

/** A variant's options as option id → the value it has. */
export const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt: any) => {
    acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

/** Whether a variant can be bought: stock not tracked, a backorder, or a unit left. */
export const isVariantAvailable = (variant: HttpTypes.StoreProductVariant) => {
  if (!variant.manage_inventory) return true
  if (variant.allow_backorder) return true
  if ((variant.inventory_quantity || 0) > 0) return true
  return false
}

/**
 * The options the page opens with: the first variant that can be bought (the
 * first variant when none can). Nothing is preselected when
 *   - no variant has a price and nothing is in stock: the sign-up is for the
 *     product as a whole, and a preselected option would show a greyed-out one
 *     as chosen;
 *   - the variants are priced differently: the visitor picks the one that sets
 *     the price, and preselecting would settle it before they have chosen.
 */
export function getDefaultChoice(product: HttpTypes.StoreProduct): OptionChoice {
  const variants = product.variants ?? []
  if (variants.length === 0) return {}

  if (isPriceOnRequest(product) && !variants.some(isVariantAvailable)) return {}
  if (hasPriceRange(product)) return {}

  const first = variants.find(isVariantAvailable) || variants[0]
  return optionsAsKeymap(first.options) ?? {}
}
