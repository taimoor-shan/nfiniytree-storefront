"use client"

import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"

import LineItemControls from "./line-item-controls"
import useLineItem from "./use-line-item"

type MobileItemCardProps = {
  item: HttpTypes.StoreCartLineItem
  currencyCode: string
  /** Commercial country of the cart (or URL fallback) — determines price formatting locale. */
  countryCode?: string
}

/**
 * The cart row below `small` (1024px): a plain stacked card built from divs.
 *
 * A separate markup tree from DesktopItemRow on purpose — no element here
 * ever switches between table-cell and grid display, and every size is
 * declared exactly once, locally. Changes to one layout cannot desync the
 * other.
 */
const MobileItemCard = ({
  item,
  currencyCode,
  countryCode,
}: MobileItemCardProps) => {
  const { updating, error, changeQuantity } = useLineItem(item)

  return (
    <div
      className="flex gap-x-3 border-b border-hairline py-4"
      data-testid="product-row-mobile"
    >
      <LocalizedClientLink
        href={`/products/${item.product_handle}`}
        className="shrink-0"
      >
        <Thumbnail
          thumbnail={item.variant?.thumbnail || item.thumbnail}
          images={item.variant?.images || item.variant?.product?.images}
          size="square"
          className="w-12 h-12"
          // This link wraps the image and nothing else, so without an `alt` it
          // had no accessible name at all — a screen reader announced it as
          // "link, graphic". The product name gives the link its name and
          // describes the image in one go.
          alt={item.product_title ?? item.title ?? ""}
        />
      </LocalizedClientLink>

      <div className="flex flex-1 min-w-0 flex-col gap-y-2">
        <div className="flex justify-between gap-x-3">
          <div className="flex min-w-0 flex-col">
            <Text
              className="txt-medium-plus text-ink break-words"
              data-testid="product-title-mobile"
            >
              {item.product_title}
            </Text>
            <LineItemOptions
              variant={item.variant}
              data-testid="product-variant-mobile"
            />
          </div>
          <LineItemPrice
            item={item}
            style="tight"
            currencyCode={currencyCode}
            countryCode={countryCode}
          />
        </div>

        <LineItemControls
          item={item}
          updating={updating}
          error={error}
          onChange={changeQuantity}
          mobile
        />
      </div>
    </div>
  )
}

export default MobileItemCard
