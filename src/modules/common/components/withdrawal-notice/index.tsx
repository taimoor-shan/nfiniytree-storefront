import { Info } from "lucide-react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type WithdrawalNoticeProps = {
  variant?: "inline" | "banner"
  className?: string
}

const WithdrawalNotice = ({
  variant = "inline",
  className = "",
}: WithdrawalNoticeProps) => {
  const legalText = (
    <>
      This product is individually assembled and finalised after your order based
      on your selected configuration. As a non-prefabricated product produced
      according to your individual choices, the 14-day statutory right of
      withdrawal does not apply under{" "}
      <span className="whitespace-nowrap">
        Section 29(1)(c) of Hungarian Government Decree 45/2014 (II. 26.)
      </span>
      .
    </>
  )

  const policyLink = (
    <LocalizedClientLink
      href="/policies/returns"
      className="text-primary underline hover:opacity-80 transition-opacity"
    >
      Returns &amp; Refunds Policy
    </LocalizedClientLink>
  )

  if (variant === "inline") {
    return (
      <div
        className={`mt-6 pt-6 border-t border-hairline ${className}`}
      >
        <div className="bg-surface-card rounded-lg p-4 border-l-2 border-l-primary">
          <p className="text-sm text-body leading-relaxed">
            <span className="font-medium text-ink">Important: </span>
            {legalText}
          </p>
          <p className="text-sm text-muted mt-2">
            See our {policyLink} for full details.
          </p>
        </div>
      </div>
    )
  }

  // banner variant (cart)
  return (
    <div className={`bg-surface-card rounded-lg p-5 ${className}`}>
      <div className="flex items-start gap-x-3">
        <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div>
          <p className="font-medium text-ink text-sm mb-1">
            Withdrawal Right Notice
          </p>
          <p className="text-sm text-body leading-relaxed">{legalText}</p>
          <p className="text-sm text-muted mt-2">
            See our {policyLink} for full details.
          </p>
        </div>
      </div>
    </div>
  )
}

export default WithdrawalNotice
