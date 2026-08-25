import { Metadata } from "next"
import { retrievePageBySlug } from "@lib/data/pages"
import { getLocale } from "@lib/data/locale-actions"
import { getDictionary, translate } from "@lib/i18n/dictionaries"
import { getSeoAlternates, resolveDescription } from "@lib/util/page-metadata"
import { SITE_NAME } from "@lib/util/seo"
import Hero from "@modules/home/components/hero"
import ContactForm from "@modules/contact/components/contact-form"

const SLUG = "contact"

type ContactPageProps = {
  params: Promise<{ countryCode: string }>
}

export async function generateMetadata(
  props: ContactPageProps
): Promise<Metadata> {
  const { countryCode } = await props.params
  const locale = (await getLocale()) || "en"
  const page = await retrievePageBySlug(SLUG, locale)

  const title =
    page?.seo_title ||
    page?.title ||
    (await translate("metadata.contactTitle", locale))
  // Whitespace-only CMS fields are truthy, so a plain `||` chain let a blank
  // `seo_description` beat the translated fallback and ship an empty
  // description. `resolveDescription` treats blank as absent.
  const description =
    resolveDescription([page?.seo_description, page?.excerpt]) ||
    (await translate("metadata.contactDescription", locale))

  return {
    title,
    description,
    alternates: await getSeoAlternates(countryCode, "/contact"),
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description,
      url: `/${countryCode}/contact`,
      images: page?.featured_image ? [{ url: page.featured_image }] : [],
    },
  }
}

export default async function ContactPage() {
  const locale = (await getLocale()) || "en"
  const dict = await getDictionary(locale)
  const page = await retrievePageBySlug(SLUG, locale)

  // Use the fetched page data for the hero, or fallback to sensible defaults
  const heroData = {
    title: page?.title || dict["contact.fallbackTitle"],
    excerpt: page?.excerpt || dict["contact.fallbackExcerpt"],
    featured_image: page?.featured_image || null,
  }

  return (
    <>
      {/* <Hero page={heroData} /> */}

      <div className="content-container lg:py-24 pb-14 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 max-w-7xl mx-auto">
          {/* Left Column: Contact Information / Webcopy */}
          <div className="flex flex-col gap-y-8">
            {page?.content ? (
              <>
                {/* The page shell owns the h1 on every CMS page here — the
                    backend's contact/about/customer-service bodies all start
                    at h2, so authored content never supplies one. `about` and
                    `customer-service` render it from `page.title`; contact
                    rendered it from <Hero>, which is commented out above, so
                    this branch would ship with no h1 at all. Kept outside the
                    `prose` wrapper, as those two pages do, so the `.prose h1`
                    rule in globals.css does not restyle it; the column's
                    `gap-y-8` supplies the space below. */}
                <h1 className="text-3xl font-display text-ink">
                  {page.title || dict["contact.getInTouch"]}
                </h1>
                <div
                  className="prose max-w-none text-body"
                  dangerouslySetInnerHTML={{ __html: page.content }}
                />
              </>
            ) : (
              <div className="prose max-w-none text-body">
                {/* Was an h2, which left this page with zero h1 — its only one
                    came from the commented-out <Hero> — and an outline opening
                    at h2. Promoted in place, but the tag swap alone would have
                    changed the look: `.prose h1` in globals.css is specificity
                    (0,1,1), so it beats these utilities and would have applied
                    `md:text-5xl leading-tight mb-4`, blowing the heading up to
                    3rem on desktop. The `!` modifiers pin the original 2rem
                    size, 1.5 line-height (inherited from preflight's `html`
                    rule — this config's `text-3xl` sets font-size only, so
                    `.prose h1`'s `line-height: 1.25`, and `1` above 768px,
                    would otherwise tighten it) and 1.5rem bottom margin, while
                    `mt-8` restores the top margin `.prose h2` had been giving
                    it. Computed styles are identical to the previous h2. */}
                <h1 className="!text-3xl !leading-normal !mb-6 font-display text-ink">{dict["contact.getInTouch"]}</h1>
                <p>{dict["contact.getInTouchText"]}</p>
                <div className="mt-8 space-y-6">
                  <div>
                    <strong className="block text-ink font-medium mb-1">{dict["contact.email"]}</strong>
                    <a href="mailto:info@infinytree.com" className="hover:text-ink transition-colors">
                      info@infinytree.com
                    </a>
                  </div>
                  <div>
                    <strong className="block text-ink font-medium mb-1">{dict["contact.companyName"]}</strong>
                    <p>{dict["contact.address"]}<br />{dict["contact.byAppointment"]}</p>
                  </div>
                  <div>
                    <strong className="block text-ink font-medium mb-1">{dict["contact.taxNumberLabel"]}</strong>
                    <p>{dict["contact.taxNumber"]}</p>
                  </div>
                  <div>
                    <strong className="block text-ink font-medium mb-1">{dict["contact.businessHours"]}</strong>
                    <p>{dict["contact.hoursValue"]}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Contact Form */}
          <div className="bg-canvas py-6 px-8 sm:py-8 sm:px-10 rounded-sm border border-hairline">
            <h2 className="text-2xl font-display mb-6">{dict["contact.sendMessage"]}</h2>
            <ContactForm />
          </div>
        </div>
      </div>
    </>
  )
}

