"use client"

import { updateLineItem } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { guardRepaint } from "@modules/common/components/repaint-guard"
import { useState } from "react"

/**
 * Shared state for the cart line-item rows (desktop table row + mobile card).
 * Kept in one hook so both layouts stay in sync behaviourally without
 * duplicating the quantity-update flow.
 */
const useLineItem = (item: HttpTypes.StoreCartLineItem) => {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const changeQuantity = async (quantity: number) => {
    setError(null)
    setUpdating(true)

    await updateLineItem({
      lineId: item.id,
      quantity,
    })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setUpdating(false)
        // The page must show the new quantity and totals the action sent back
        guardRepaint()
      })
  }

  return { updating, error, changeQuantity }
}

export default useLineItem
