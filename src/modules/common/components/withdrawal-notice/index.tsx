import { Info } from "lucide-react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type WithdrawalNoticeProps = {
  variant?: "inline" | "banner"
  className?: string
  /** Translated heading — defaults to English */
  title?: string
  /** Translated "Important:" prefix — defaults to English */
  importantPrefix?: string
  /** Translated legal body text with {decree} placeholder — defaults to English */
  legalText?: string
  /** Translated decree reference — defaults to English */
  decree?: string
  /** Translated "See our {policyLink}…" line — defaults to English */
  seeOurDetails?: string
  /** Translated link label — defaults to English */
  policyLinkLabel?: string
}

const DEFAULT_TITLE = "Withdrawal Right Notice"
const DEFAULT_IMPORTANT_PREFIX = "Important: "
const DEFAULT_LEGAL_TEXT =
  "This product is individually assembled and finalised after your order based on your selected configuration. As a non-prefabricated product produced according to your individual choices, the 14-day statutory right of withdrawal does not apply under {decree}."
const DEFAULT_DECREE =
  "Section 29(1)(c) of Hungarian Government Decree 45/2014 (II. 26.)"
const DEFAULT_SEE_OUR_DETAILS = "See our {policyLink} for full details."
const DEFAULT_POLICY_LINK_LABEL = "Returns & Refunds Policy"

/** Split `text` on the first occurrence of `placeholder`. If missing, returns the
 *  full text as the first element so the caller still renders something sensible. */
const splitOn = (
  text: string,
  placeholder: string
): readonly [string, string] => {
  const idx = text.indexOf(placeholder)
  if (idx === -1) return [text, ""] as const
  return [text.slice(0, idx), text.slice(idx + placeholder.length)] as const
}

const WithdrawalNotice = ({
  variant = "inline",
  className = "",
  title = DEFAULT_TITLE,
  importantPrefix = DEFAULT_IMPORTANT_PREFIX,
  legalText = DEFAULT_LEGAL_TEXT,
  decree = DEFAULT_DECREE,
  seeOurDetails = DEFAULT_SEE_OUR_DETAILS,
  policyLinkLabel = DEFAULT_POLICY_LINK_LABEL,
}: WithdrawalNoticeProps) => {
  const [legalBefore, legalAfter] = splitOn(legalText, "{decree}")
  // NOTE: previously this span had `whitespace-nowrap`, which forced the entire
  // decree citation (60+ chars) to render on one line and overflow the container
  // on narrow screens. Removed so it wraps like normal text.
  const legalBody = (
    <>
      {legalBefore}
      {decree}
      {legalAfter}
    </>
  )

  const [seeBefore, seeAfter] = splitOn(seeOurDetails, "{policyLink}")
  const policyLine = (
    <>
      {seeBefore}
      <LocalizedClientLink
        href="/policies/returns"
        className="text-primary-text underline hover:opacity-80 transition-opacity"
      >
        {policyLinkLabel}
      </LocalizedClientLink>
      {seeAfter}
    </>
  )

  if (variant === "inline") {
    return (
      <div className={`mt-6 pt-6 border-t border-hairline ${className}`}>
        <div className="bg-surface-card rounded-lg p-4 border-l-2 border-l-primary min-w-0">
          <p className="text-sm text-body leading-relaxed break-words">
            <span className="font-medium text-ink">{importantPrefix}</span>
            {legalBody}
          </p>
          <p className="text-sm text-muted mt-2 break-words">{policyLine}</p>
        </div>
      </div>
    )
  }

  // banner variant (cart)
  return (
    <div className={`bg-surface-card rounded-lg p-5 min-w-0 ${className}`}>
      <div className="flex items-start gap-x-3">
        {/* Decorative — the notice text immediately to the right says the same. */}
        <Info
          className="h-5 w-5 text-primary-text mt-0.5 shrink-0"
          aria-hidden="true"
        />
        {/* min-w-0 is required here: flex children default to min-width:auto,
            so without it this column can't shrink below its content's
            intrinsic width and text-wrapping utilities are ignored. */}
        <div className="min-w-0 flex-1">
          <p className="font-medium text-ink text-sm mb-1 break-words">
            {title}
          </p>
          <p className="text-sm text-body leading-relaxed break-words">
            {legalBody}
          </p>
          <p className="text-sm text-muted mt-2 break-words">{policyLine}</p>
        </div>
      </div>
    </div>
  )
}

export default WithdrawalNotice