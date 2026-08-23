"use client"

import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import { HttpTypes } from "@medusajs/types"
import { Table, Text } from "@medusajs/ui"

import LineItemControls from "./line-item-controls"
import useLineItem from "./use-line-item"

type DesktopItemRowProps = {
  item: HttpTypes.StoreCartLineItem
  currencyCode: string
  /** Commercial country of the cart (or URL fallback) — determines price formatting locale. */
  countryCode?: string
}

/**
 * The cart row at `small` (1024px) and up: a plain native table row.
 *
 * No explicit widths anywhere on purpose — the browser's table algorithm
 * keeps this row's columns aligned with the header for free, and each cell
 * is sized by its content (the Thumbnail's single square default defines
 * column one). This row must never carry grid/col-start/row-span classes;
 * below the breakpoint the mobile card layout renders instead.
 */
const DesktopItemRow = ({
  item,
  currencyCode,
  countryCode,
}: DesktopItemRowProps) => {
  const { updating, error, changeQuantity } = useLineItem(item)

  return (
    <Table.Row data-testid="product-row">
      <Table.Cell className="py-3">
        <LocalizedClientLink
          href={`/products/${item.product_handle}`}
          className="flex"
        >
          <Thumbnail
            thumbnail={item.variant?.thumbnail || item.thumbnail}
            images={item.variant?.images || item.variant?.product?.images}
            size="square"
            // This link wraps the image and nothing else, so without an `alt` it
            // had no accessible name at all — a screen reader announced it as
            // "link, graphic". The product name gives the link its name and
            // describes the image in one go.
            alt={item.product_title ?? item.title ?? ""}
          />
        </LocalizedClientLink>
      </Table.Cell>

      <Table.Cell className="py-3 text-left">
        <Text
          className="txt-medium-plus text-ink break-words"
          data-testid="product-title"
        >
          {item.product_title}
        </Text>
        <LineItemOptions variant={item.variant} data-testid="product-variant" />
      </Table.Cell>

      <Table.Cell className="py-3">
        <LineItemControls
          item={item}
          updating={updating}
          error={error}
          onChange={changeQuantity}
        />
      </Table.Cell>

      <Table.Cell className="py-3">
        <LineItemUnitPrice
          item={item}
          style="tight"
          currencyCode={currencyCode}
          countryCode={countryCode}
        />
      </Table.Cell>

      <Table.Cell className="py-3 text-right">
        <LineItemPrice
          item={item}
          style="tight"
          currencyCode={currencyCode}
          countryCode={countryCode}
        />
      </Table.Cell>
    </Table.Row>
  )
}

export default DesktopItemRow
