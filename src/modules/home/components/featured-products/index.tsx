import { Fragment } from "react"
import { HttpTypes } from "@medusajs/types"
import ProductRail from "@modules/home/components/featured-products/product-rail"

export default async function FeaturedProducts({
  collections,
  region,
  countryCode,
}: {
  collections: HttpTypes.StoreCollection[]
  region: HttpTypes.StoreRegion
  /** URL country — determines price formatting locale. */
  countryCode: string
}) {
  // `Fragment`, not `<li>`. These render straight into <main> with no <ul>/<ol>
  // anywhere, so each one was an orphan list item — invalid HTML, and screen
  // readers got a stray one-item list per collection. The element was only ever
  // a key holder: `ProductRail` returns a full-width `content-container`
  // section that owns its own <ul> for the actual product grid. A Fragment
  // keeps the key and drops the bogus semantics without touching layout.
  return collections.map((collection) => (
    <Fragment key={collection.id}>
      <ProductRail collection={collection} region={region} countryCode={countryCode} />
    </Fragment>
  ))
}
