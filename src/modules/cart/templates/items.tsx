import repeat from "@lib/util/repeat"
import { HttpTypes } from "@medusajs/types"
import { Heading, Table } from "@medusajs/ui"

import { DesktopItemRow, MobileItemCard } from "@modules/cart/components/item"
import SkeletonLineItem from "@modules/skeletons/components/skeleton-line-item"
import SkeletonMobileItemCard from "@modules/skeletons/components/skeleton-mobile-item-card"
import { translate } from "@/lib/i18n"
import { getLocale } from "@lib/data/locale-actions"
import { getCartCountryCode } from "@lib/util/country-locale"

type ItemsTemplateProps = {
  cart?: HttpTypes.StoreCart
  /** URL country — fallback when the cart has no shipping country yet. */
  countryCode?: string
}

const ItemsTemplate = async ({ cart, countryCode }: ItemsTemplateProps) => {
  // Commercial context wins: format per the country Medusa priced the
  // cart for; fall back to the URL country for carts without one.
  const cc = getCartCountryCode(cart) ?? countryCode
  const locale = await getLocale()
  const items = cart?.items

  // Two separate trees split at `small` (1024px): stacked mobile cards
  // below, a native table above. They never share markup or classes, so
  // changing a size in one layout cannot desync the other. The desktop
  // table's columns are kept aligned with the header by the browser's
  // table algorithm — cells are sized by their content, not by classes.
  return (
    <div>
      <div className="pb-3 flex items-center">
        <Heading className="text-[2rem] leading-[2.75rem]">{await translate("nav.cart", locale)}</Heading>
      </div>

      {items ? (
        <>
          <div className="flex flex-col small:hidden">
            {items
              .sort((a, b) => {
                return (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
              })
              .map((item) => {
                return (
                  <MobileItemCard
                    key={item.id}
                    item={item}
                    currencyCode={cart?.currency_code}
                    countryCode={cc}
                  />
                )
              })}
          </div>

          <Table className="hidden small:table">
            <Table.Header className="border-t-0">
              <Table.Row className="text-body txt-medium-plus">
                <Table.HeaderCell>{await translate("cart.item", locale)}</Table.HeaderCell>
                <Table.HeaderCell></Table.HeaderCell>
                <Table.HeaderCell>{await translate("cart.quantity", locale)}</Table.HeaderCell>
                <Table.HeaderCell>{await translate("cart.price", locale)}</Table.HeaderCell>
                <Table.HeaderCell className="text-right">
                  {await translate("cart.total", locale)}
                </Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {items.map((item) => {
                return (
                  <DesktopItemRow
                    key={item.id}
                    item={item}
                    currencyCode={cart?.currency_code}
                    countryCode={cc}
                  />
                )
              })}
            </Table.Body>
          </Table>
        </>
      ) : (
        <>
          <div className="flex flex-col small:hidden">
            {repeat(5).map((i) => {
              return <SkeletonMobileItemCard key={i} />
            })}
          </div>
          <Table className="hidden small:table">
            <Table.Body>
              {repeat(5).map((i) => {
                return <SkeletonLineItem key={i} />
              })}
            </Table.Body>
          </Table>
        </>
      )}
    </div>
  )
}

export default ItemsTemplate
