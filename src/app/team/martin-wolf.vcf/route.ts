import { MARTIN_WOLF, buildVCard, vcardFileName } from "@lib/team/business-card"
import { getSiteUrl } from "@lib/util/seo"

/**
 * `/team/martin-wolf.vcf`: the contact file behind "Kontakt speichern".
 *
 * Served inline as `text/vcard`, which is what makes an iPhone open its "new
 * contact" sheet straight away; Android and desktop browsers download the file
 * and hand it to the contacts app. The `.vcf` is in the folder name on purpose:
 * a path with a file extension goes through the proxy untouched, so no market
 * redirect and no backend call stand between a visitor and the file.
 */
export function GET() {
  return new Response(buildVCard(MARTIN_WOLF, getSiteUrl()), {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `inline; filename="${vcardFileName(MARTIN_WOLF)}"`,
    },
  })
}
