import { Metadata } from "next"
import { notFound } from "next/navigation"
import { retrievePageBySlug } from "@lib/data/pages"
import { getLocale } from "@lib/data/locale-actions"
import { getDictionary } from "@lib/i18n/dictionaries"
import { Sparkles, Droplets, TreePine, Building2 } from "lucide-react"

type AboutPageProps = {
  params: Promise<{ countryCode: string }>
}

export async function generateMetadata(props: AboutPageProps): Promise<Metadata> {
  const locale = (await getLocale()) || "en"
  const page = await retrievePageBySlug("about", locale)

  if (!page) {
    return {
      title: "About | Infinytree",
      description: "Handmade artificial botanical masterpieces for luxury interiors.",
    }
  }

  return {
    title: page.seo_title || page.title || "About",
    description:
      page.seo_description ||
      page.excerpt ||
      "Handmade artificial botanical masterpieces for luxury interiors.",
  }
}

export default async function AboutPage(props: AboutPageProps) {
  const locale = (await getLocale()) || "en"
  const dict = await getDictionary(locale)
  const page = await retrievePageBySlug("about", locale)

  if (!page) {
    notFound()
  }

  const showHero = page.featured_image
  const showContent = page.content

  const promisePillars = [
    {
      icon: Sparkles,
      title: dict["features.oneOfAKind.title"],
      description: dict["features.oneOfAKind.description"],
    },
    {
      icon: Droplets,
      title: dict["features.maintenanceFree.title"],
      description: dict["features.maintenanceFree.description"],
    },
    {
      icon: TreePine,
      title: dict["features.authenticMaterials.title"],
      description: dict["features.authenticMaterials.description"],
    },
    {
      icon: Building2,
      title: dict["features.luxurySpaces.title"],
      description: dict["features.luxurySpaces.description"],
    },
  ]

  return (
    <div>
      {/* Hero — editorial overlay on featured image */}
      {showHero ? (
        <section className="relative h-[55vh] min-h-[380px] w-full overflow-hidden">
          <img
            src={page.featured_image!}
            alt={page.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/20" />
          <div className="absolute inset-0 flex flex-col justify-end pb-16">
            <div className="content-container">
              <div className="max-w-3xl">
                <p className="text-primary text-xs uppercase tracking-[0.2em] font-medium mb-4">
                  {dict["about.handmadeCollection"]}
                </p>
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
        /* Fallback when no featured image — minimal centered header */
        <section className="pt-20 pb-8 lg:pt-28 lg:pb-12">
          <div className="content-container text-center">
            <p className="text-primary text-xs uppercase tracking-[0.2em] font-medium mb-4">
              {dict["about.handmadeCollection"]}
            </p>
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

      {/* Content + Promise sidebar */}
      <section className="content-container py-12 lg:py-20">
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24">
          {/* Main content */}
          {showContent && (
            <div className="flex-1 min-w-0">
              <div
                className="prose prose-lg max-w-none
                  prose-headings:font-display prose-headings:text-ink
                  prose-p:text-body prose-p:leading-relaxed
                  prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-ink
                  prose-li:text-body
                  prose-img:rounded-lg"
                dangerouslySetInnerHTML={{ __html: page.content! }}
              />
            </div>
          )}

          {/* Promise sidebar */}
          <aside className="lg:w-80 xl:w-96 shrink-0">
            <div className="sticky top-24 space-y-6">
              <p className="text-xs uppercase tracking-[0.2em] text-body">
                {dict["about.thePromise"]}
              </p>
              <div className="space-y-5">
                {promisePillars.map(({ icon: Icon, title, description }) => (
                  <div key={title} className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-surface-card flex items-center justify-center shrink-0 mt-0.5">
                      <Icon size={18} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-ink mb-1">
                        {title}
                      </h3>
                      <p className="text-sm text-body leading-relaxed">
                        {description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <hr className="border-hairline" />

              {/* Location note */}
              <div>
                <p className="text-xs text-body leading-relaxed">
                  {dict["about.locationNote"]}
                </p>
                <a
                  href="mailto:info@infinytree.com"
                  className="inline-block mt-3 text-xs text-primary font-medium hover:underline"
                >
                  info@infinytree.com
                </a>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* Closing — craftsmanship note */}
      {/* <section className="border-t border-hairline bg-surface-card">
        <div className="content-container py-10 lg:py-14 text-center">
          <p className="font-display text-xl lg:text-2xl text-ink italic mb-2">
            &ldquo;Where nature meets craftsmanship.&rdquo;
          </p>
          <p className="text-sm text-body">
            Every Infinytree piece is handmade — unique, maintenance-free, and
            designed to last.
          </p>
        </div>
      </section> */}
    </div>
  )
}
