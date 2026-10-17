/**
 * Digital business cards for the team.
 *
 * Each person has one public page, `/team/<slug>`, written in German, and a
 * contact file visitors can save to their phone, `/team/<slug>.vcf`. The page,
 * the contact file and the tests all read the same record, so the number a
 * visitor sees is always the number that gets saved.
 *
 * Pure functions only: nothing here touches the request, the backend or React.
 */

export type BusinessCard = {
  /** The address segment: `/team/<slug>` is the page, `/team/<slug>.vcf` the contact file. */
  slug: string
  firstName: string
  lastName: string
  organisation: string
  /** The job title as the card shows it, e.g. "Sales Director". */
  role: string
  /** Where the role is based, from the specific to the general: `["Tirol", "Österreich"]`. */
  place: readonly string[]
  /** The direct line in international format, no spaces: `+436648241498`. */
  phone: string
  /** The same number as people read it. */
  phoneDisplay: string
  email: string
}

export const MARTIN_WOLF: BusinessCard = {
  slug: "martin-wolf",
  firstName: "Martin",
  lastName: "Wolf",
  organisation: "InfinYtree",
  role: "Sales Director",
  place: ["Tirol", "Österreich"],
  phone: "+436648241498",
  phoneDisplay: "+43 664 8241498",
  email: "martin@infinytree.com",
}

export const fullName = (card: BusinessCard) =>
  `${card.firstName} ${card.lastName}`

/** The title line saved to the phone: `Sales Director – Tirol, Österreich`. */
export const cardTitle = (card: BusinessCard) =>
  `${card.role} – ${card.place.join(", ")}`

export const pagePath = (card: BusinessCard) => `/team/${card.slug}`

export const vcardPath = (card: BusinessCard) => `${pagePath(card)}.vcf`

/** The name the saved file gets: `Martin_Wolf_InfinYtree.vcf`. */
export const vcardFileName = (card: BusinessCard) =>
  `${card.firstName}_${card.lastName}_${card.organisation}.vcf`

export const telHref = (card: BusinessCard) => `tel:${card.phone}`

export const mailtoHref = (card: BusinessCard) => `mailto:${card.email}`

/** WhatsApp wants the number as digits only, without the `+`. */
export const whatsappHref = (card: BusinessCard) =>
  `https://wa.me/${card.phone.replace(/\D/g, "")}`

/**
 * A vCard text value: backslash, semicolon, comma and line breaks must be
 * escaped, or "Tirol, Österreich" reads as two values (RFC 2426, section 4).
 */
export const escapeVCardText = (value: string) =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n")

/**
 * The card as a vCard 3.0 file, the version every phone's contacts app reads.
 * Lines end in CRLF, the last one included, as the format requires.
 * `siteUrl` is the shop's canonical address without a trailing slash.
 */
export function buildVCard(card: BusinessCard, siteUrl: string): string {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${escapeVCardText(card.lastName)};${escapeVCardText(card.firstName)};;;`,
    `FN:${escapeVCardText(fullName(card))}`,
    `ORG:${escapeVCardText(card.organisation)}`,
    `TITLE:${escapeVCardText(cardTitle(card))}`,
    `TEL;TYPE=WORK,CELL:${card.phone}`,
    `EMAIL;TYPE=WORK:${card.email}`,
    `URL:${siteUrl}/`,
    "END:VCARD",
  ]

  return `${lines.join("\r\n")}\r\n`
}
