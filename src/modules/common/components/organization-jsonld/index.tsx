import { DEFAULT_OG_IMAGE, getSiteUrl } from "@lib/util/seo"

type OrganizationJsonLdProps = {
  /** The homepage description, in the page's language. */
  description: string
  /** The page's language (`en`, `de`). */
  inLanguage: string
}

/** The countries the shop delivers to (see the shipping policy). */
const AREA_SERVED = ["Hungary", "Austria", "Germany"]

/**
 * Who runs the shop, for Google's picture of the brand: the business as an
 * `OnlineStore` and the site as a `WebSite`, linked by `@id`. Rendered on the
 * homepage, where Google reads the site name.
 *
 * The brand is spelled as its logo spells it ("InfinYtree"); page titles use
 * the plain form, so that is the `alternateName`. The company details are the
 * imprint's (`/policies/imprint`): change both together.
 */
export default function OrganizationJsonLd({
  description,
  inLanguage,
}: OrganizationJsonLdProps) {
  const site = getSiteUrl()

  const organization = {
    "@type": "OnlineStore",
    "@id": `${site}/#organization`,
    name: "InfinYtree",
    alternateName: "Infinytree",
    legalName: "Deltalivings Korlátolt Felelősségű Társaság",
    url: site,
    logo: {
      "@type": "ImageObject",
      url: `${site}/logo-mark.png`,
      width: 481,
      height: 470,
    },
    image: `${site}${DEFAULT_OG_IMAGE.url}`,
    description,
    email: "info@infinytree.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Podmaniczky utca 19. 3. em. 21. ajtó",
      postalCode: "1065",
      addressLocality: "Budapest",
      addressCountry: "HU",
    },
    vatID: "HU32214460",
    taxID: "32214460-2-42",
    areaServed: AREA_SERVED.map((name) => ({ "@type": "Country", name })),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: "info@infinytree.com",
      availableLanguage: ["English", "German"],
      areaServed: AREA_SERVED,
    },
  }

  const website = {
    "@type": "WebSite",
    "@id": `${site}/#website`,
    url: site,
    name: "InfinYtree",
    alternateName: "Infinytree",
    inLanguage,
    publisher: { "@id": `${site}/#organization` },
  }

  return (
    <script
      type="application/ld+json"
      // `<` is escaped so a `</script>` in the copy cannot break out of the
      // script element.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [organization, website],
        }).replace(/</g, "\\u003c"),
      }}
    />
  )
}
