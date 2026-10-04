import { convertToLocale } from "@lib/util/money"

/** Commission months and dates follow Budapest time, as the plugin does. */
const TIME_ZONE = "Europe/Budapest"

export const formatMoney = (
  amount: number,
  currencyCode: string,
  countryCode: string
) => convertToLocale({ amount, currency_code: currencyCode, countryCode })

export const formatDate = (iso: string, locale: string) =>
  new Intl.DateTimeFormat(locale, {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(iso))

/** "2026-11" as a month name. */
export const formatMonth = (period: string, locale: string) =>
  new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
  }).format(new Date(`${period}-01T00:00:00Z`))

export const formatRate = (rate: number | null) =>
  rate === null ? "–" : `${rate}%`
