import { isEmpty } from "./isEmpty"
import { getFormattingLocale } from "./country-locale"

type ConvertToLocaleParams = {
  amount: number
  currency_code: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  /** Explicit override. Prefer passing `countryCode` — language must NOT drive money formatting. */
  locale?: string
  /** ISO-2 country of the commercial context (URL country, cart/order shipping country). */
  countryCode?: string | null
}

/** ISO-4217 currencies with 0 minor units — no decimal places. */
const ZERO_DECIMAL_CURRENCIES = new Set([
  "HUF", "JPY", "KRW", "TWD", "VND",
  "CLP", "PYG", "UGX", "RWF", "UZS", "KES",
])

export const convertToLocale = ({
  amount,
  currency_code,
  minimumFractionDigits,
  maximumFractionDigits,
  locale,
  countryCode,
}: ConvertToLocaleParams) => {
  if (!currency_code || isEmpty(currency_code)) {
    return amount.toString()
  }

  const upper = currency_code.toUpperCase()
  const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.has(upper)
  const resolvedLocale =
    locale ?? getFormattingLocale({ countryCode, currency_code: upper })

  return new Intl.NumberFormat(resolvedLocale, {
    style: "currency",
    currency: currency_code,
    minimumFractionDigits:
      minimumFractionDigits ?? (isZeroDecimal ? 0 : undefined),
    maximumFractionDigits:
      maximumFractionDigits ?? (isZeroDecimal ? 0 : undefined),
  }).format(amount)
}
