import { HttpTypes } from "@medusajs/types"

import { normalizeImageUrl } from "@lib/util/image-url"
import { getSiteUrl, SITE_NAME } from "@lib/util/seo"

type ProductJsonLdProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
}

/**
 * Absolute, publicly-fetchable URL for a media asset.
 *
 * `normalizeImageUrl` deliberately returns a same-origin `/static/...` path so
 * the browser never talks to the Medusa host directly. Structured data has the
 * opposite requirement — Google fetches these URLs out-of-band and cannot
 * resolve a relative path — so the site origin is prepended here.
 */
const toAbsoluteUrl = (url: string | null | undefined): string | null => {
  if (!url) return null
  const normalized = normalizeImageUrl(url)
  if (!normalized) return null
  if (/^https?:\/\//i.test(normalized)) return normalized
  return `${getSiteUrl()}${normalized.startsWith("/") ? "" : "/"}${normalized}`
}

/** Medusa descriptions may contain markup; schema.org `description` is text. */
const toPlainText = (value: string | null | undefined): string | undefined => {
  if (!value) return undefined
  const text = value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
  return text || undefined
}

/**
 * A variant is purchasable when inventory is untracked, backorderable, or in
 * stock. Mirrors `isVariantAvailable` in `product-actions` — availability shown
 * to a shopper and availability reported to Google must not disagree.
 */
const isVariantAvailable = (variant: HttpTypes.StoreProductVariant): boolean => {
  if (!variant.manage_inventory) return true
  if (variant.allow_backorder) return true
  return (variant.inventory_quantity || 0) > 0
}

/**
 * Product structured data (JSON-LD) for the PDP.
 *
 * Only facts that exist in the Medusa record are emitted. There is deliberately
 * no `aggregateRating`, `review`, `priceValidUntil`, `shippingDetails` or
 * `hasMerchantReturnPolicy`: the store has no review data, and inventing values
 * for the rest to win a richer SERP treatment is exactly the kind of markup that
 * earns a manual action.
 *
 * `itemCondition` is `NewCondition` — accurate for a first-party shop selling
 * newly made pieces.
 */
export default function ProductJsonLd({
  product,
  countryCode,
}: ProductJsonLdProps) {
  const productUrl = `${getSiteUrl()}/${countryCode.toLowerCase()}/products/${
    product.handle
  }`

  const images = [
    ...(product.thumbnail ? [product.thumbnail] : []),
    ...(product.images?.map((image) => image.url) ?? []),
  ]
    .map(toAbsoluteUrl)
    .filter((url, index, all): url is string => !!url && all.indexOf(url) === index)

  // A variant carries a price only when the region resolved one, so variants
  // without `calculated_price` are dropped rather than published at price 0.
  const offers = (product.variants ?? [])
    .map((variant) => {
      const calculated = (variant as any).calculated_price
      const amount = calculated?.calculated_amount
      const currency = calculated?.currency_code

      if (typeof amount !== "number" || !currency) {
        return null
      }

      const gtin = variant.ean || variant.upc || variant.barcode || null

      return {
        "@type": "Offer",
        url: productUrl,
        price: amount,
        priceCurrency: currency.toUpperCase(),
        availability: isVariantAvailable(variant)
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
        seller: { "@type": "Organization", name: SITE_NAME },
        ...(variant.sku ? { sku: variant.sku } : {}),
        ...(gtin ? { gtin } : {}),
        ...(variant.title ? { name: `${product.title} — ${variant.title}` } : {}),
      }
    })
    .filter(Boolean) as Record<string, unknown>[]

  // A single-variant product gets a plain `Offer`; a multi-variant product gets
  // an `AggregateOffer` wrapping the individual offers, which is how Google
  // expects a price range to be expressed.
  const prices = offers.map((offer) => offer.price as number)
  const currency = offers[0]?.priceCurrency as string | undefined

  const offersNode =
    offers.length === 0
      ? undefined
      : offers.length === 1
        ? offers[0]
        : {
            "@type": "AggregateOffer",
            offerCount: offers.length,
            lowPrice: Math.min(...prices),
            highPrice: Math.max(...prices),
            priceCurrency: currency,
            offers,
          }

  // `sku` at the Product level only makes sense when the product is a single
  // SKU; otherwise it lives on each Offer.
  const productSku =
    product.variants?.length === 1 ? product.variants[0].sku : undefined

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    url: productUrl,
    ...(toPlainText(product.description) || toPlainText(product.subtitle)
      ? {
          description:
            toPlainText(product.description) || toPlainText(product.subtitle),
        }
      : {}),
    ...(images.length ? { image: images } : {}),
    // Infinytree makes the pieces it sells, so the store is the brand. This is
    // not a marketplace reselling third-party goods.
    brand: { "@type": "Brand", name: SITE_NAME },
    ...(productSku ? { sku: productSku } : {}),
    ...(product.material ? { material: product.material } : {}),
    ...(product.weight ? { weight: { "@type": "QuantitativeValue", value: product.weight, unitCode: "GRM" } } : {}),
    ...(product.categories?.[0]?.name
      ? { category: product.categories[0].name }
      : {}),
    ...(offersNode ? { offers: offersNode } : {}),
  }

  return (
    <script
      type="application/ld+json"
      // `<` is escaped so a stray `</script>` in editor-entered product copy
      // cannot break out of the script element.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
      }}
    />
  )
}
