/**
 * Dates shown to the visitor. Pure, so they run under
 * `npx tsx src/lib/util/date.test.ts`.
 */
import { SITE_TIME_ZONE, intlLocale } from "./blog"

const LONG_DATE: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "long",
  day: "numeric",
}

/**
 * A date in the visitor's language ("31 October 2026", "31. Oktober 2026",
 * "2026. október 31."), dated in the shop's own time zone so the server and
 * the browser print the same day. Empty for a missing or invalid date.
 */
export const formatDate = (
  date: string | Date | null | undefined,
  locale?: string | null,
  options: Intl.DateTimeFormatOptions = LONG_DATE
): string => {
  if (!date) {
    return ""
  }

  const value = new Date(date)

  if (Number.isNaN(value.getTime())) {
    return ""
  }

  try {
    return new Intl.DateTimeFormat(intlLocale(locale), {
      ...options,
      timeZone: SITE_TIME_ZONE,
    }).format(value)
  } catch {
    // An unknown locale code: show the date in English rather than fail.
    return new Intl.DateTimeFormat("en-GB", {
      ...options,
      timeZone: SITE_TIME_ZONE,
    }).format(value)
  }
}
