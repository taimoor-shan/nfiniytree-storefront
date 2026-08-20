import { retrieveCustomer } from "@lib/data/customer"
import { HttpTypes } from "@medusajs/types"
import ProductActions from "@modules/products/components/product-actions"

/**
 * Renders the product actions (buy box).
 *
 * This used to re-fetch the product by id with `listProducts`, even though the
 * page had *already* fetched the identical object: `page.tsx` queries by handle
 * with `countryCode`, this queried by id with `regionId: region.id` — both
 * resolve to the same region and both use the same `fields` string, so the
 * response was byte-identical. That redundant roundtrip ran inside a Suspense
 * boundary whose fallback rendered a *disabled* Add to Cart button, which is
 * what made the button appear inert for seconds after the page painted.
 *
 * The product now comes in as a prop. What is left is `retrieveCustomer()`,
 * which short-circuits to `null` without any network call when there are no
 * auth cookies — so for anonymous shoppers this boundary now resolves
 * immediately, and the only cost for signed-in shoppers is one fast lookup for
 * an email prefill that does not gate the button.
 */
export default async function ProductActionsWrapper({
  product,
  region,
}: {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
}) {
  const customer = await retrieveCustomer()

  if (!product) {
    return null
  }

  return (
    <ProductActions
      product={product}
      region={region}
      customerEmail={customer?.email}
    />
  )
}
