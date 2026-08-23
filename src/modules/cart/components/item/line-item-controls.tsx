"use client"

import CartItemSelect from "@modules/cart/components/cart-item-select"
import ErrorMessage from "@modules/checkout/components/error-message"
import DeleteButton from "@modules/common/components/delete-button"
import Spinner from "@modules/common/icons/spinner"
import { HttpTypes } from "@medusajs/types"
import { useTranslation } from "@lib/i18n/client"

type LineItemControlsProps = {
  item: HttpTypes.StoreCartLineItem
  updating: boolean
  error: string | null
  onChange: (quantity: number) => Promise<void>
  /** Suffixes data-testids so the mobile card and desktop row never duplicate them. */
  mobile?: boolean
}

// TODO: Update this to grab the actual max inventory — right now BOTH
// branches resolve to 10, so this is a hardcoded cap, not real inventory data.
const MAX_QUANTITY = 10

const LineItemControls = ({
  item,
  updating,
  error,
  onChange,
  mobile = false,
}: LineItemControlsProps) => {
  const { t } = useTranslation()
  const suffix = mobile ? "-mobile" : ""
  const maxQuantity = Math.min(
    item.variant?.manage_inventory ? 10 : MAX_QUANTITY,
    MAX_QUANTITY
  )

  return (
    <>
      <div
        className={
          mobile
            ? "flex flex-wrap gap-2 items-center"
            : "flex flex-wrap gap-2 items-center w-28"
        }
      >
        <DeleteButton
          id={item.id}
          itemLabel={item.product_title ?? undefined}
          data-testid={`product-delete-button${suffix}`}
        />
        <CartItemSelect
          value={item.quantity}
          onChange={(value) => onChange(parseInt(value.target.value))}
          className="h-10 w-14"
          label={
            item.product_title
              ? t("a11y.quantityFor").replace("{product}", item.product_title)
              : undefined
          }
          data-testid={`product-select-button${suffix}`}
        >
          {Array.from({ length: maxQuantity }, (_, i) => (
            <option value={i + 1} key={i}>
              {i + 1}
            </option>
          ))}
        </CartItemSelect>
        {/* The spinner was the only feedback for a quantity change, which
            is invisible to a screen reader. Announce the state change too. */}
        <span
          role="status"
          aria-live="polite"
          className={updating ? undefined : "sr-only"}
        >
          {updating ? (
            <>
              <Spinner />
              <span className="sr-only">{t("a11y.cartUpdating")}</span>
            </>
          ) : null}
        </span>
      </div>
      <ErrorMessage error={error} data-testid={`product-error-message${suffix}`} />
    </>
  )
}

export default LineItemControls
