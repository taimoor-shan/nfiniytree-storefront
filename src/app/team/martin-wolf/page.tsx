import type { Metadata } from "next"

import { MARTIN_WOLF, fullName, pagePath } from "@lib/team/business-card"
import { NOINDEX_METADATA, SITE_NAME, getSiteUrl } from "@lib/util/seo"
import BusinessCardTemplate from "@modules/team/templates/business-card"
import badge from "@modules/team/templates/business-card/infinytree-badge.jpg"

/**
 * `/team/martin-wolf`: Martin Wolf's digital business card, the page behind the
 * QR code on the printed A3 display. It sits outside the markets and is always
 * German; the proxy serves it directly (`serveTeamCard` in `src/proxy.ts`).
 */

const card = MARTIN_WOLF

const title = `${fullName(card)} | ${card.organisation}`
const description = `Digitale Visitenkarte von ${fullName(card)}, ${card.role} ${card.place[0]} bei ${card.organisation}: anrufen, eine E-Mail schreiben oder den Kontakt speichern.`

// Setting `openGraph` on a page replaces the shop-wide share image, so the card
// names its own: the round logo, a square that sits well in a chat preview.
const shareImage = {
  url: badge.src,
  width: badge.width,
  height: badge.height,
  alt: "InfinYtree Logo",
}

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: pagePath(card) },
  // The card is reached by its QR code or a shared link, not from search
  // results, and it carries a direct mobile number: `noindex` keeps it out of
  // the index. Remove this line to let search engines list the page.
  ...NOINDEX_METADATA,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "de_AT",
    title,
    description,
    url: pagePath(card),
    images: [shareImage],
  },
  twitter: {
    card: "summary",
    title,
    description,
    images: [shareImage],
  },
}

export default function MartinWolfCardPage() {
  return <BusinessCardTemplate card={card} siteUrl={getSiteUrl()} />
}
