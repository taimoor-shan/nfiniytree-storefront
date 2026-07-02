import React from "react"
import { clx } from "@medusajs/ui"
import { CreditCard } from "lucide-react"

type CardBrandLogosProps = {
  className?: string
  showStripe?: boolean
}

/**
 * Simple card brand text badges — used as trust signals in the review and
 * summary sections. We avoid inline SVG card logos because Stripe's
 * PaymentElement already renders the real brand icons inside the card input.
 */
export const CardBrandLogos = ({ className, showStripe = false }: CardBrandLogosProps) => {
  return (
    <div className={clx("flex items-center gap-1.5 flex-wrap", className)}>
      {["Visa", "Mastercard", "Amex", "Discover"].map((brand) => (
        <span
          key={brand}
          className="inline-flex items-center px-2 py-0.5 rounded border border-hairline bg-surface-card text-[10px] font-medium text-muted uppercase tracking-wider"
        >
          {brand}
        </span>
      ))}
      {showStripe && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-hairline bg-surface-card text-[10px] font-medium text-muted uppercase tracking-wider ml-0.5">
          <CreditCard className="w-3 h-3" />
          Stripe
        </span>
      )}
    </div>
  )
}
