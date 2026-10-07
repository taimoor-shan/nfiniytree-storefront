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

/** The current month ("2026-10") in Budapest time, which the plugin counts months in. */
export const currentPeriod = (now = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
  })
    .format(now)
    .slice(0, 7)

/** "7 Oct" for a day in the current year, "7 Oct 2027" otherwise. */
export const formatDay = (iso: string, locale: string, now = new Date()) => {
  const date = new Date(iso)
  const sameYear =
    new Intl.DateTimeFormat("en", { timeZone: TIME_ZONE, year: "numeric" }).format(date) ===
    new Intl.DateTimeFormat("en", { timeZone: TIME_ZONE, year: "numeric" }).format(now)

  return new Intl.DateTimeFormat(locale, {
    timeZone: TIME_ZONE,
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  }).format(date)
}

/** The payouts made in a calendar year, per currency: counted by the month they were paid in. */
export const payoutsInYear = (
  payouts: { period: string; currency_code: string }[],
  year: string
): Record<string, number> => {
  const counts: Record<string, number> = {}
  for (const payout of payouts) {
    if (payout.period.startsWith(`${year}-`)) {
      counts[payout.currency_code] = (counts[payout.currency_code] ?? 0) + 1
    }
  }

  return counts
}
