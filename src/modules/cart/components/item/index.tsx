/**
 * Cart line-item rows.
 *
 * Two deliberate layouts that never share markup:
 * - `MobileItemCard` — stacked div card below `small` (1024px)
 * - `DesktopItemRow` — native table row at `small` and up
 * - `PreviewItemRow` — compact native table row for the checkout summary
 *
 * Sizing each layout's elements can never desync the other, because no
 * element or class is shared between them. Shared state lives in
 * `useLineItem`; the quantity/delete controls live in `LineItemControls`.
 */
export { default as DesktopItemRow } from "./desktop-item-row"
export { default as MobileItemCard } from "./mobile-item-card"
export { default as PreviewItemRow } from "./preview-item-row"
