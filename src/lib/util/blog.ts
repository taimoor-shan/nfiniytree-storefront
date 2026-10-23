/**
 * Small helpers for the blog. Pure, so they run under
 * `npx tsx src/lib/util/blog.test.ts`.
 */

/** Posts are dated in the shop's own time zone, wherever the server runs. */
const SITE_TIME_ZONE = "Europe/Budapest"

/**
 * A locale `Intl` understands. English is the plain "en", for which the
 * storefront means British spelling and day-first dates.
 */
export const intlLocale = (locale?: string | null): string =>
  !locale || locale === "en" ? "en-GB" : locale

/** "23 October 2026", in the visitor's language. Empty for a missing date. */
export const formatPostDate = (
  iso: string | null | undefined,
  locale?: string | null
): string => {
  if (!iso) {
    return ""
  }

  const date = new Date(iso)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  try {
    return new Intl.DateTimeFormat(intlLocale(locale), {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: SITE_TIME_ZONE,
    }).format(date)
  } catch {
    // An unknown locale code: show the date in English rather than fail.
    return new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: SITE_TIME_ZONE,
    }).format(date)
  }
}

/** Fills `{name}` placeholders in a dictionary string. */
export const fillTemplate = (
  template: string,
  values: Record<string, string | number>
): string =>
  Object.entries(values).reduce(
    (text, [key, value]) => text.split(`{${key}}`).join(String(value)),
    template
  )

/** The page number from `?page=`, never below 1 and never a fraction. */
export const parsePageNumber = (page?: string | null): number => {
  const parsed = Number.parseInt(page ?? "", 10)

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}
