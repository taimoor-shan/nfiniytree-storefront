import { MARTIN_WOLF } from "@lib/team/business-card"
import { getSiteUrl } from "@lib/util/seo"
import BusinessCardTemplate from "@modules/team/templates/business-card"
import { cardMetadata } from "@modules/team/templates/business-card/metadata"

/**
 * `/team/martin-wolf`: Martin Wolf's digital business card, the page behind the
 * QR code on the printed A3 display. It sits outside the markets and is always
 * German; the proxy serves it directly (`serveTeamCard` in `src/proxy.ts`).
 */

const card = MARTIN_WOLF

export const metadata = cardMetadata(card)

export default function MartinWolfCardPage() {
  return <BusinessCardTemplate card={card} siteUrl={getSiteUrl()} />
}
