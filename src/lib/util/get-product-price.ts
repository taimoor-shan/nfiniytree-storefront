import { HttpTypes } from "@medusajs/types"
import { getPercentageDiff } from "./get-percentage-diff"
import { convertToLocale } from "./money"

export const getPricesForVariant = (variant: any) => {
  if (!variant?.calculated_price?.calculated_amount) {
    return null
  }

  const calculatedAmount = variant.calculated_price.calculated_amount
  const currencyCode = variant.calculated_price.currency_code
  let originalAmount = variant.calculated_price.original_amount

  // For override price lists, original_amount equals calculated_amount.
  // We need to find the base (non-price-list) price from the variant's prices array.
  const isOverride =
    variant.calculated_price.is_calculated_price_price_list &&
    originalAmount === calculatedAmount

  if (isOverride && variant.prices?.length) {
    const basePrice = variant.prices.find(
      (p: any) =>
        !p.price_list_id &&
        p.currency_code === currencyCode
    )
    if (basePrice) {
      originalAmount = basePrice.amount
    }
  }

  return {
    calculated_price_number: calculatedAmount,
    calculated_price: convertToLocale({
      amount: calculatedAmount,
      currency_code: currencyCode,
    }),
    original_price_number: originalAmount,
    original_price: convertToLocale({
      amount: originalAmount,
      currency_code: currencyCode,
    }),
    currency_code: currencyCode,
    price_type: variant.calculated_price.calculated_price.price_list_type,
    percentage_diff: getPercentageDiff(
      originalAmount,
      calculatedAmount
    ),
  }
}

export function getProductPrice({
  product,
  variantId,
}: {
  product: HttpTypes.StoreProduct
  variantId?: string
}) {
  if (!product || !product.id) {
    throw new Error("No product provided")
  }

  const cheapestPrice = () => {
    if (!product || !product.variants?.length) {
      return null
    }

    const cheapestVariant: any = product.variants
      .filter((v: any) => !!v.calculated_price)
      .sort((a: any, b: any) => {
        return (
          a.calculated_price.calculated_amount -
          b.calculated_price.calculated_amount
        )
      })[0]

    return getPricesForVariant(cheapestVariant)
  }

  const variantPrice = () => {
    if (!product || !variantId) {
      return null
    }

    const variant: any = product.variants?.find(
      (v) => v.id === variantId || v.sku === variantId
    )

    if (!variant) {
      return null
    }

    return getPricesForVariant(variant)
  }

  return {
    product,
    cheapestPrice: cheapestPrice(),
    variantPrice: variantPrice(),
  }
}
