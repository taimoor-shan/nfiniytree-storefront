import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"

import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"

type MobileItemCardProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
  currencyCode: string
  /** Order's shipping country — historical orders keep their own formatting. */
  countryCode?: string
  /** Links the thumbnail to the product, as the checkout summary's rows do. */
  href?: string
}

/**
 * An order line, or a line of the checkout summary, below `xsmall` (512px): a
 * plain stacked card built from divs.
 *
 * A separate markup tree from `Item` and the summary's `PreviewItemRow`, the
 * table rows used from `xsmall` up, for the same reason as the cart's (see
 * MobileItemCard there). The table's fixed
 * thumbnail and price cells leave a phone almost no room for the name, and a
 * table column can't shrink below its longest word, so on a phone the table ran
 * wider than the screen and pushed the prices off it. Here the name gets the
 * full width, with the quantity, unit price and total on one line below it.
 */
const MobileItemCard = ({
  item,
  currencyCode,
  countryCode,
  href,
}: MobileItemCardProps) => {
  // Named like every other product image, as in the table row.
  const thumbnail = (
    <Thumbnail
      thumbnail={
        item.variant?.thumbnail || item.product?.thumbnail || item.thumbnail
      }
      images={item.variant?.images || item.product?.images || []}
      size="square"
      className="w-12 h-12 shrink-0"
      alt={item.product_title ?? item.title ?? ""}
    />
  )

  return (
    <div
      className="flex gap-x-3 border-b border-hairline py-4"
      data-testid="product-row-mobile"
    >
      {href ? (
        <LocalizedClientLink href={href} className="shrink-0">
          {thumbnail}
        </LocalizedClientLink>
      ) : (
        thumbnail
      )}

      <div className="flex flex-1 min-w-0 flex-col gap-y-2">
        <div className="flex min-w-0 flex-col">
          <Text
            className="txt-medium-plus text-ink break-words"
            data-testid="product-name-mobile"
          >
            {item.product_title}
          </Text>
          <LineItemOptions
            variant={item.variant}
            data-testid="product-variant-mobile"
          />
        </div>

        {/* Wraps instead of overflowing when a long amount leaves no room for
            both; `ml-auto` keeps the total on the right on either line. */}
        <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
          <span className="flex gap-x-1">
            <Text className="text-muted">
              <span data-testid="product-quantity-mobile">{item.quantity}</span>
              x{" "}
            </Text>
            <LineItemUnitPrice
              item={item}
              style="tight"
              currencyCode={currencyCode}
              countryCode={countryCode}
            />
          </span>

          <span className="ml-auto">
            <LineItemPrice
              item={item}
              style="tight"
              currencyCode={currencyCode}
              countryCode={countryCode}
            />
          </span>
        </div>
      </div>
    </div>
  )
}

export default MobileItemCard
