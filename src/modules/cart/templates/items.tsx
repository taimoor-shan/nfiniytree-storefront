import repeat from "@lib/util/repeat"
import { HttpTypes } from "@medusajs/types"
import { Heading, Table } from "@medusajs/ui"

import Item from "@modules/cart/components/item"
import SkeletonLineItem from "@modules/skeletons/components/skeleton-line-item"
import { translate } from "@/lib/i18n"
import { getLocale } from "@lib/data/locale-actions"

type ItemsTemplateProps = {
  cart?: HttpTypes.StoreCart
}

const ItemsTemplate = async ({ cart }: ItemsTemplateProps) => {
  const locale = await getLocale()
  const items = cart?.items
  return (
    <div>
      <div className="pb-3 flex items-center">
        <Heading className="text-[2rem] leading-[2.75rem]">{await translate("nav.cart", locale)}</Heading>
      </div>
      <Table className="p-4">
        <Table.Header className="border-t-0">
          <Table.Row className="text-body txt-medium-plus">
            <Table.HeaderCell className="">{await translate("cart.item", locale)}</Table.HeaderCell>
            <Table.HeaderCell></Table.HeaderCell>
            <Table.HeaderCell>{await translate("cart.quantity", locale)}</Table.HeaderCell>
            <Table.HeaderCell className="hidden small:table-cell">
              {await translate("cart.price", locale)}
            </Table.HeaderCell>
            <Table.HeaderCell className="text-right">
              {await translate("cart.total", locale)}
            </Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {items
            ? items
                .sort((a, b) => {
                  return (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
                })
                .map((item) => {
                  return (
                    <Item
                      key={item.id}
                      item={item}
                      currencyCode={cart?.currency_code}
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

export default ItemsTemplate
