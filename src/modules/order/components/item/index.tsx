import { HttpTypes } from "@medusajs/types"
import { Table, Text } from "@medusajs/ui"

import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import Thumbnail from "@modules/products/components/thumbnail"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
  currencyCode: string
  /** Order's shipping country — historical orders keep their own formatting. */
  countryCode?: string
}

const Item = ({ item, currencyCode, countryCode }: ItemProps) => {
  return (
    <Table.Row className="w-full" data-testid="product-row">
      <Table.Cell className="!pl-0 p-4 w-24">
        <div className="flex w-24">
          {/* Wrapper matches the Thumbnail's default square size (w-24) so the
              declared sizes agree with the w-24 cell, instead of relying on
              flex-shrink to rescue a w-16 box around a w-24 image. */}
          {/* Decorative — the product name is in the very next table cell, so
              announcing it again on the image would double it up. */}
          <Thumbnail thumbnail={item.variant?.thumbnail || item.product?.thumbnail || item.thumbnail} images={item.variant?.images || item.product?.images || []} size="square" alt="" />
        </div>
      </Table.Cell>

      <Table.Cell className="text-left">
        <Text
          className="txt-medium-plus text-ink"
          data-testid="product-name"
        >
          {item.product_title}
        </Text>
        <LineItemOptions variant={item.variant} data-testid="product-variant" />
      </Table.Cell>

      <Table.Cell className="!pr-0">
        <span className="!pr-0 flex flex-col items-end h-full justify-center">
          <span className="flex gap-x-1 ">
            <Text className="text-muted">
              <span data-testid="product-quantity">{item.quantity}</span>x{" "}
            </Text>
            <LineItemUnitPrice
              item={item}
              style="tight"
              currencyCode={currencyCode}
              countryCode={countryCode}
            />
          </span>

          <LineItemPrice
            item={item}
            style="tight"
            currencyCode={currencyCode}
            countryCode={countryCode}
          />
        </span>
      </Table.Cell>
    </Table.Row>
  )
}

export default Item
