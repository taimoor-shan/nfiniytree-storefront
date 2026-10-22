"use client"

import repeat from "@lib/util/repeat"
import { HttpTypes } from "@medusajs/types"
import { Table, clx } from "@medusajs/ui"

import { PreviewItemRow } from "@modules/cart/components/item"
import MobileItemCard from "@modules/order/components/item/mobile-item-card"
import SkeletonMobileItemCard from "@modules/skeletons/components/skeleton-mobile-item-card"
import SkeletonPreviewItem from "@modules/skeletons/components/skeleton-preview-item"
import { getCartCountryCode } from "@lib/util/country-locale"

type ItemsTemplateProps = {
  cart: HttpTypes.StoreCart
  /** URL country — fallback when the cart has no shipping country yet. */
  countryCode?: string
}

const ItemsPreviewTemplate = ({ cart, countryCode }: ItemsTemplateProps) => {
  const cc = getCartCountryCode(cart) ?? countryCode
  const items = cart.items
    ? [...cart.items].sort((a, b) => {
        return (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
      })
    : undefined
  const hasOverflow = items && items.length > 4

  // Two separate trees split at `xsmall` (512px), as on the order page: stacked
  // cards below, a native table above. The table's thumbnail and price columns
  // are fixed, so in a phone's 272–327px there is no room left for the name.
  return (
    <div
      className={clx({
        "pl-[1px] overflow-y-scroll overflow-x-hidden no-scrollbar max-h-[420px]":
          hasOverflow,
      })}
    >
      <div className="flex flex-col xsmall:hidden">
        {items
          ? items.map((item) => {
              return (
                <MobileItemCard
                  key={item.id}
                  item={item}
                  currencyCode={cart.currency_code}
                  countryCode={cc}
                  href={`/products/${item.product_handle}`}
                />
              )
            })
          : repeat(5).map((i) => {
              return <SkeletonMobileItemCard key={i} />
            })}
      </div>
      <Table className="hidden xsmall:table">
        <Table.Body data-testid="items-table">
          {items
            ? items.map((item) => {
                return (
                  <PreviewItemRow
                    key={item.id}
                    item={item}
                    currencyCode={cart.currency_code}
                    countryCode={cc}
                  />
                )
              })
            : repeat(5).map((i) => {
                return <SkeletonPreviewItem key={i} />
              })}
        </Table.Body>
      </Table>
    </div>
  )
}

export default ItemsPreviewTemplate
