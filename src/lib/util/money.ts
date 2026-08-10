import { isEmpty } from "./isEmpty"

type ConvertToLocaleParams = {
  amount: number
  currency_code: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  locale?: string
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
  locale = "en-US",
}: ConvertToLocaleParams) => {
  if (!currency_code || isEmpty(currency_code)) {
    return amount.toString()
  }

  const upper = currency_code.toUpperCase()
  const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.has(upper)

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency_code,
    minimumFractionDigits:
      minimumFractionDigits ?? (isZeroDecimal ? 0 : undefined),
    maximumFractionDigits:
      maximumFractionDigits ?? (isZeroDecimal ? 0 : undefined),
  }).format(amount)
}
