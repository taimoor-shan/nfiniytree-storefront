import repeat from "@lib/util/repeat"
import { HttpTypes } from "@medusajs/types"
import { Table } from "@medusajs/ui"

import Divider from "@modules/common/components/divider"
import Item, { MobileItemCard } from "@modules/order/components/item"
import SkeletonLineItem from "@modules/skeletons/components/skeleton-line-item"
import SkeletonMobileItemCard from "@modules/skeletons/components/skeleton-mobile-item-card"
import { getOrderCountryCode } from "@lib/util/country-locale"

type ItemsProps = {
  order: HttpTypes.StoreOrder
}

const Items = ({ order }: ItemsProps) => {
  // Historical orders format per their own shipping country.
  const cc = getOrderCountryCode(order)
  const items = order.items?.length
    ? [...order.items].sort((a, b) => {
        return (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
      })
    : undefined

  // Two separate trees split at `xsmall` (512px): stacked cards below, a native
  // table above. As in the cart they never share markup or classes, so one
  // layout's sizes can't throw the other off. The split sits lower than the
  // cart's `small` because these rows carry no quantity controls, so the table
  // fits a narrower screen.
  return (
    <div className="flex flex-col">
      <Divider className="!mb-0" />
      <div
        className="flex flex-col xsmall:hidden"
        data-testid="products-list-mobile"
      >
        {items
          ? items.map((item) => {
              return (
                <MobileItemCard
                  key={item.id}
                  item={item}
                  currencyCode={order.currency_code}
                  countryCode={cc}
                />
              )
            })
          : repeat(5).map((i) => {
              return <SkeletonMobileItemCard key={i} />
            })}
      </div>
      <Table className="hidden xsmall:table">
        <Table.Body data-testid="products-table">
          {items
            ? items.map((item) => {
                return (
                  <Item
                    key={item.id}
                    item={item}
                    currencyCode={order.currency_code}
                    countryCode={cc}
                  />
                )
              })
            : repeat(5).map((i) => {
                return <SkeletonLineItem key={i} />
              })}
        </Table.Body>
      </Table>
    </div>
  )
}

export default Items
