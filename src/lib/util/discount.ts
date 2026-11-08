/**
 * The discount on an order, as the customer should read it.
 *
 * Medusa gives two figures. `discount_total` counts the VAT on the discount,
 * `discount_subtotal` does not. The rows around it (products, delivery) are
 * net and the VAT has a row of its own, so only `discount_subtotal` makes the
 * rows add up to the total; the larger figure made an order look cheaper than
 * it was charged. The same goes for the pro-forma invoice and the order email.
 */

type Adjustment = { code?: string | null } | null
type Line = { adjustments?: Adjustment[] | null }

export type DiscountSource = {
  items?: Line[] | null
  shipping_methods?: Line[] | null
  discount_subtotal?: number | null
  discount_total?: number | null
}

/**
 * The promotion codes behind an order's discount: each once, in the order the
 * lines show them (products first, then delivery).
 */
export function getDiscountCodes(order?: DiscountSource | null): string[] {
  const codes = new Set<string>()

  const collect = (lines?: Line[] | null) =>
    lines?.forEach((line) =>
      line?.adjustments?.forEach((adjustment) => {
        const code =
          typeof adjustment?.code === "string" ? adjustment.code.trim() : ""
        if (code) codes.add(code)
      })
    )

  collect(order?.items)
  collect(order?.shipping_methods)

  return Array.from(codes)
}

/**
 * The discount without the VAT on it. An answer that carries no net figure
 * (an older backend) falls back to the one with VAT.
 */
export function getNetDiscount(order?: DiscountSource | null): number {
  const net = order?.discount_subtotal
  if (typeof net === "number") return net

  const gross = order?.discount_total
  return typeof gross === "number" ? gross : 0
}

/** "Discount (CODE)": the label with the codes that explain it, or the plain label. */
export function discountLabel(
  label: string,
  codes?: readonly string[] | null
): string {
  return codes?.length ? `${label} (${codes.join(", ")})` : label
}
