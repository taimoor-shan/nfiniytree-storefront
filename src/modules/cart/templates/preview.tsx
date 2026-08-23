"use client"

import repeat from "@lib/util/repeat"
import { HttpTypes } from "@medusajs/types"
import { Table, clx } from "@medusajs/ui"

import { PreviewItemRow } from "@modules/cart/components/item"
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
  const hasOverflow = items && items.length > 4

  return (
    <div
      className={clx({
        "pl-[1px] overflow-y-scroll overflow-x-hidden no-scrollbar max-h-[420px]":
          hasOverflow,
      })}
    >
      <Table>
        <Table.Body data-testid="items-table">
          {items
            ? items
                .sort((a, b) => {
                  return (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
                })
                .map((item) => {
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
