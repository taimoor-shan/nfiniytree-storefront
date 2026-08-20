import { Metadata } from "next"
import { notFound } from "next/navigation"
import { retrievePageBySlug } from "@lib/data/pages"
import { getLocale } from "@lib/data/locale-actions"
import { translate } from "@lib/i18n/dictionaries"

const SLUG = "customer-service"

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) || "en"
  const page = await retrievePageBySlug(SLUG, locale)

  return {
    title:
      page?.seo_title ||
      page?.title ||
      (await translate("metadata.customerServiceTitle", locale)),
    description:
      page?.seo_description ||
      page?.excerpt ||
      (await translate("metadata.customerServiceDescription", locale)),
  }
}

export default async function CustomerServicePage() {
  const locale = (await getLocale()) || "en"
  const page = await retrievePageBySlug(SLUG, locale)

  if (!page) {
    notFound()
  }

  return (
    <div>
      {/* Hero — editorial overlay on featured image */}
      {page.featured_image ? (
        <section className="relative h-[55vh] min-h-[380px] w-full overflow-hidden">
          <img
            src={page.featured_image}
            alt={page.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/20" />
          <div className="absolute inset-0 flex flex-col justify-end pb-16">
            <div className="content-container">
              <div className="max-w-3xl">
                <h1 className="font-display text-3xl lg:text-5xl text-on-dark leading-tight mb-4">
                  {page.title}
                </h1>
                {page.excerpt && (
                  <p className="text-lg text-on-dark/80 leading-relaxed max-w-xl">
                    {page.excerpt}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : (
        /* Fallback when no featured image */
        <section className="pt-20 pb-8 lg:pt-28 lg:pb-12">
          <div className="content-container text-center">
            <h1 className="font-display text-3xl lg:text-5xl text-ink leading-tight mb-4">
              {page.title}
            </h1>
            {page.excerpt && (
              <p className="text-lg text-body max-w-xl mx-auto leading-relaxed">
                {page.excerpt}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Main content */}
      {page.content && (
        <section className="content-container py-12 lg:py-20">
          <div className="max-w-3xl mx-auto">
            <div
              className="prose prose-lg max-w-none
                prose-headings:font-display prose-headings:text-ink
                prose-p:text-body prose-p:leading-relaxed
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                prose-strong:text-ink
                prose-li:text-body
                prose-img:rounded-lg"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          </div>
        </section>
      )}
    </div>
  )
}
