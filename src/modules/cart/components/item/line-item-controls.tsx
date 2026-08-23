"use client"

import CartItemSelect from "@modules/cart/components/cart-item-select"
import ErrorMessage from "@modules/checkout/components/error-message"
import DeleteButton from "@modules/common/components/delete-button"
import Spinner from "@modules/common/icons/spinner"
import { HttpTypes } from "@medusajs/types"

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
  const suffix = mobile ? "-mobile" : ""
  const maxQuantity = Math.min(
    item.variant?.manage_inventory ? 10 : MAX_QUANTITY,
    MAX_QUANTITY
  )

  return (
    <>
      <div className="flex flex-wrap gap-2 items-center">
        <DeleteButton id={item.id} data-testid={`product-delete-button${suffix}`} />
        <CartItemSelect
          value={item.quantity}
          onChange={(value) => onChange(parseInt(value.target.value))}
          className="h-10 w-14"
          data-testid={`product-select-button${suffix}`}
        >
          {Array.from({ length: maxQuantity }, (_, i) => (
            <option value={i + 1} key={i}>
              {i + 1}
            </option>
          ))}
        </CartItemSelect>
        {updating && <Spinner />}
      </div>
      <ErrorMessage error={error} data-testid={`product-error-message${suffix}`} />
    </>
  )
}

export default LineItemControls
