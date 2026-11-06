import { CHRISTOPH_THOMANN } from "@lib/team/business-card"
import { getSiteUrl } from "@lib/util/seo"
import BusinessCardTemplate from "@modules/team/templates/business-card"
import { cardMetadata } from "@modules/team/templates/business-card/metadata"

/**
 * `/team/christoph-thomann`: Christoph Thomann's digital business card, made
 * like Martin Wolf's (`/team/martin-wolf`): outside the markets, always German,
 * served directly by the proxy (`serveTeamCard` in `src/proxy.ts`).
 */

const card = CHRISTOPH_THOMANN

export const metadata = cardMetadata(card)

export default function ChristophThomannCardPage() {
  return <BusinessCardTemplate card={card} siteUrl={getSiteUrl()} />
}
