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
 * Native table only — no quantity controls, no breakpoint switching in the row
 * itself: below `xsmall` (512px) the summary shows the order module's
 * `MobileItemCard` instead (see ItemsPreviewTemplate).
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
            // This link wraps the image and nothing else, so without an `alt` it
            // had no accessible name at all — a screen reader announced it as
            // "link, graphic". The product name gives the link its name and
            // describes the image in one go.
            alt={item.product_title ?? item.title ?? ""}
          />
        </LocalizedClientLink>
      </Table.Cell>

      {/* `anywhere`, not `break-words`: only it lets this column shrink below the
          name's longest word, which a table column otherwise never does — a long
          German compound pushed the prices off a phone's screen. */}
      <Table.Cell className="text-left">
        <Text
          className="txt-medium-plus text-ink [overflow-wrap:anywhere]"
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
