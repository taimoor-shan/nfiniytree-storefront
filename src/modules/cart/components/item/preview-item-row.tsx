import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import { HttpTypes } from "@medusajs/types"
import { Table, Text } from "@medusajs/ui"

type PreviewItemRowProps = {
  item: HttpTypes.StoreCartLineItem
  currencyCode: string
  /** Commercial country of the cart (or URL fallback) — determines price formatting locale. */
  countryCode?: string
}

/**
 * Compact, stateless row for the checkout summary's narrow (360px) table.
 * Native table only — no quantity controls, no breakpoint switching.
 */
const PreviewItemRow = ({
  item,
  currencyCode,
  countryCode,
}: PreviewItemRowProps) => {
  return (
    <Table.Row data-testid="product-row">
      <Table.Cell className="p-4 w-16">
        <LocalizedClientLink
          href={`/products/${item.product_handle}`}
          className="flex"
        >
          <Thumbnail
            thumbnail={item.variant?.thumbnail || item.thumbnail}
            images={item.variant?.images || item.variant?.product?.images}
            size="square"
            className="w-16 h-16"
          />
        </LocalizedClientLink>
      </Table.Cell>

      <Table.Cell className="text-left">
        <Text
          className="txt-medium-plus text-ink break-words"
          data-testid="product-title"
        >
          {item.product_title}
        </Text>
        <LineItemOptions variant={item.variant} data-testid="product-variant" />
      </Table.Cell>

      <Table.Cell>
        <span className="flex flex-col items-end h-full justify-center">
          <span className="flex gap-x-1 ">
            <Text className="text-muted">{item.quantity}x </Text>
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

export default PreviewItemRow
