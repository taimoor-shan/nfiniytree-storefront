import {
  CHRISTOPH_THOMANN,
  buildVCard,
  vcardFileName,
} from "@lib/team/business-card"
import { getSiteUrl } from "@lib/util/seo"

/**
 * `/team/christoph-thomann.vcf`: the contact file behind "Kontakt speichern",
 * served the way Martin Wolf's is, and for the same reasons (see
 * `src/app/team/martin-wolf.vcf/route.ts`).
 */
export function GET() {
  return new Response(buildVCard(CHRISTOPH_THOMANN, getSiteUrl()), {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `inline; filename="${vcardFileName(CHRISTOPH_THOMANN)}"`,
    },
  })
}
