import { Metadata } from "next"
import { retrievePageBySlug } from "@lib/data/pages"
import Hero from "@modules/home/components/hero"
import ContactForm from "@modules/contact/components/contact-form"

const SLUG = "contact"
const FALLBACK_TITLE = "Contact Us"

export async function generateMetadata(): Promise<Metadata> {
  const page = await retrievePageBySlug(SLUG)
  return {
    title: page?.seo_title || page?.title || `${FALLBACK_TITLE} | Infinytree`,
    description:
      page?.seo_description || page?.excerpt || "Get in touch with Infinytree.",
  }
}

export default async function ContactPage() {
  const page = await retrievePageBySlug(SLUG)

  // Use the fetched page data for the hero, or fallback to sensible defaults
  const heroData = {
    title: page?.title || FALLBACK_TITLE,
    excerpt: page?.excerpt || "We're here to help. Reach out with any questions about our botanical pieces, custom orders, or interior design collaborations.",
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
                <h2 className="text-3xl font-display text-ink mb-6">Get in Touch</h2>
                <p>
                  At Infinytree, every piece is a unique creation. We invite you to contact us 
                  regarding inquiries about our available pieces, commissioned work, or how our 
                  handcrafted botanical designs can elevate your interior space.
                </p>
                <div className="mt-8 space-y-4">
                  <div>
                    <strong className="block text-ink font-medium">Email</strong>
                    <a href="mailto:info@infinytree.com" className="hover:text-ink transition-colors">
                      info@infinytree.com
                    </a>
                  </div>
                  <div>
                    <strong className="block text-ink font-medium">Studio / Headquarters</strong>
                    <p>Budapest, Hungary<br />(By appointment only)</p>
                  </div>
                  <div>
                    <strong className="block text-ink font-medium">Business Hours</strong>
                    <p>Monday - Friday: 9:00 AM - 5:00 PM (CET)</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Contact Form */}
          <div className="bg-canvas p-8 sm:p-10 rounded-2xl border border-hairline shadow-sm">
            <h3 className="text-2xl font-display mb-6">Send us a message</h3>
            <ContactForm />
          </div>
        </div>
      </div>
    </>
  )
}

