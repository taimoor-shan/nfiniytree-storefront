/**
 * Editor HTML (CMS pages and blog posts) fitted to the page it is shown in.
 */

import { parseMarketSegment } from "@lib/i18n/market"
import { isTeamCardPath } from "@lib/team/card-path"

const LEADING_H1 = /^\s*<h1(?:\s[^>]*)?>([\s\S]*?)<\/h1>\s*/i

const plainText = (html: string) =>
  html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()

/**
 * The page template owns the h1, so a body that brings its own would put two on
 * the page. The rich-text editor offers h1 to authors, and a body pasted from
 * a document often starts with one.
 *
 * Drops a leading h1 that only repeats the title and demotes any other h1 to
 * h2. h2 and h3 are left alone, so no heading level is skipped. A body that
 * already starts at h2 comes back unchanged.
 */
export function normalizeBodyHeadings(html: string, title: string): string {
  const leading = html.match(LEADING_H1)
  const body =
    leading && plainText(leading[1]) === plainText(title)
      ? html.slice(leading[0].length)
      : html

  return body.replace(/<h1(\s[^>]*)?>/gi, "<h2$1>").replace(/<\/h1>/gi, "</h2>")
}

const ROOT_RELATIVE_HREF = /(<a\s[^>]*?\bhref\s*=\s*)(["'])(\/(?!\/)[^"']*)\2/gi

/**
 * Editors link to the shop with root-relative paths (`/products/olive-tree`),
 * which are the same in every language. On the page they would answer with a
 * redirect into a market, so they are given the page's own market prefix
 * (`/de-at/products/olive-tree`), keeping the reader in their language and
 * search engines on the final address.
 *
 * Left alone: paths that already start with a market or country
 * (`/en-hu/...`, `/hu/...`), files (`/static/a.jpg`, `/team/x.vcf`) and team
 * cards (`/team/<name>`), which the proxy serves without a market.
 */
export function localizeBodyLinks(html: string, market: string): string {
  return html.replace(ROOT_RELATIVE_HREF, (match, start, quote, path) => {
    const pathname = path.split(/[?#]/)[0]
    const first = pathname.split("/")[1] ?? ""

    if (
      pathname.includes(".") ||
      parseMarketSegment(first) ||
      isTeamCardPath(pathname)
    ) {
      return match
    }

    const rest = path === "/" ? "" : path
    return `${start}${quote}/${market}${rest}${quote}`
  })
}
