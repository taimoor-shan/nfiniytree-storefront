type TaxLinesOwner = {
  tax_lines?: Array<{ rate?: number | null }> | null
}

type WithTaxLines = {
  items?: TaxLinesOwner[] | null
  shipping_methods?: TaxLinesOwner[] | null
}

/**
 * Derives the uniform tax rate percentage from a cart or order's tax lines.
 * Returns `null` when no tax lines exist or rates differ across items.
 */
export function getTaxRate(totals: WithTaxLines): number | null {
  const rates = new Set<number>()

  const collect = (owner?: TaxLinesOwner | null) =>
    owner?.tax_lines?.forEach((l) => {
      if (typeof l.rate === "number") rates.add(l.rate)
    })

  totals.items?.forEach(collect)
  totals.shipping_methods?.forEach(collect)

  return rates.size === 1 ? [...rates][0] : null
}
