import type { Metadata } from "next"

import {
  cardDescription,
  fullName,
  pagePath,
  type BusinessCard,
} from "@lib/team/business-card"
import { NOINDEX_METADATA, SITE_NAME } from "@lib/util/seo"

import badge from "./infinytree-badge.jpg"

// Setting `openGraph` on a page replaces the shop-wide share image, so the card
// names its own: the round logo, a square that sits well in a chat preview.
const shareImage = {
  url: badge.src,
  width: badge.width,
  height: badge.height,
  alt: "InfinYtree Logo",
}

/**
 * The head of a card's page: title, description, canonical address and the
 * preview a chat app shows when the link is shared. Every card gets the same
 * treatment, so it is written once here and each `page.tsx` calls it.
 */
export function cardMetadata(card: BusinessCard): Metadata {
  const title = `${fullName(card)} | ${card.organisation}`
  const description = cardDescription(card)

  return {
    title,
    description,
    alternates: { canonical: pagePath(card) },
    // A card is reached by its QR code or a shared link, not from search
    // results, and it carries a direct mobile number: `noindex` keeps it out of
    // the index. Remove this line to let search engines list the cards.
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
}
