import { Metadata } from "next"
import { retrievePageBySlug } from "@lib/data/pages"
import { getLocale } from "@lib/data/locale-actions"
import { getDictionary } from "@lib/i18n/dictionaries"
import Hero from "@modules/home/components/hero"
import ContactForm from "@modules/contact/components/contact-form"

const SLUG = "contact"

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) || "en"
  const page = await retrievePageBySlug(SLUG, locale)
  return {
    title: page?.seo_title || page?.title || `Contact Us | Infinytree`,
    description:
      page?.seo_description || page?.excerpt || "Get in touch with Infinytree.",
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

      <div className="content-container py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 max-w-7xl mx-auto">
          {/* Left Column: Contact Information / Webcopy */}
          <div className="flex flex-col gap-y-8">
            {page?.content ? (
              <div
                className="prose max-w-none text-body"
                dangerouslySetInnerHTML={{ __html: page.content }}
              />
            ) : (
              <div className="prose max-w-none text-body">
                <h2 className="text-3xl font-display text-ink mb-6">{dict["contact.getInTouch"]}</h2>
                <p>{dict["contact.getInTouchText"]}</p>
                <div className="mt-8 space-y-4">
                  <div>
                    <strong className="block text-ink font-medium">{dict["contact.email"]}</strong>
                    <a href="mailto:info@infinytree.com" className="hover:text-ink transition-colors">
                      info@infinytree.com
                    </a>
                  </div>
                  <div>
                    <strong className="block text-ink font-medium">{dict["contact.studio"]}</strong>
                    <p>{dict["contact.address"]}<br />{dict["contact.byAppointment"]}</p>
                  </div>
                  <div>
                    <strong className="block text-ink font-medium">{dict["contact.businessHours"]}</strong>
                    <p>{dict["contact.hoursValue"]}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Contact Form */}
          <div className="bg-canvas p-8 sm:p-10 rounded-2xl border border-hairline shadow-sm">
            <h3 className="text-2xl font-display mb-6">{dict["contact.sendMessage"]}</h3>
            <ContactForm />
          </div>
        </div>
      </div>
    </>
  )
}

