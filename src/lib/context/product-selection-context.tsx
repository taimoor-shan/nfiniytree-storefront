"use client"

import React, { createContext, useContext, useMemo, useState } from "react"

import type { OptionChoice } from "@lib/util/variant-gallery"

/**
 * What the shopper has chosen on a product page, shared by the buy box (which
 * shows the options) and the gallery (which shows the pictures of the choice).
 * They sit in different columns of the page, so the choice lives above both.
 */
type ProductSelection = {
  /** Option id → the value picked; none for an option not yet picked. */
  options: OptionChoice
  setOptions: React.Dispatch<React.SetStateAction<OptionChoice>>
}

const ProductSelectionContext = createContext<ProductSelection | null>(null)

type ProductSelectionProviderProps = {
  /**
   * What the page opens on: the variant the buy box preselects
   * (`getDefaultChoice()`), worked out on the server so the server-rendered
   * gallery already shows that variant's pictures. Opening on nothing and
   * preselecting once the page has loaded would swap the gallery under the
   * shopper's eyes.
   */
  initialOptions: OptionChoice
  children?: React.ReactNode
}

export const ProductSelectionProvider = ({
  initialOptions,
  children,
}: ProductSelectionProviderProps) => {
  const [options, setOptions] = useState<OptionChoice>(initialOptions)
  const value = useMemo(() => ({ options, setOptions }), [options])

  return (
    <ProductSelectionContext.Provider value={value}>
      {children}
    </ProductSelectionContext.Provider>
  )
}

/**
 * The shopper's choice. Outside a provider the buy box keeps a choice of its
 * own: it still works, it just shares nothing with a gallery.
 */
export const useProductSelection = (): ProductSelection => {
  const shared = useContext(ProductSelectionContext)
  const [options, setOptions] = useState<OptionChoice>({})

  return shared ?? { options, setOptions }
}
