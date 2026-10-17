/**
 * Where the team's business cards live, and how the proxy treats them.
 *
 * `/team/martin-wolf` is printed as a QR code, so it is one address that never
 * moves: it sits outside the markets (no `/at/team/...` twin, no redirect) and
 * is always German. See `serveTeamCard` in `src/proxy.ts`.
 *
 * Pure functions only: the proxy imports this file.
 */

/**
 * The language the cards are written in. Austria's German dictionary also
 * drives `<html lang>` and the cookie banner on these pages.
 */
export const TEAM_CARD_LOCALE = "de-AT"

/**
 * `/team/<name>`, with or without a trailing slash. A path with a file
 * extension, like the contact file `/team/martin-wolf.vcf`, is not a card page
 * (the proxy lets those through before it gets here).
 */
export const isTeamCardPath = (pathname: string): boolean =>
  /^\/team\/[^/.]+\/?$/.test(pathname)
