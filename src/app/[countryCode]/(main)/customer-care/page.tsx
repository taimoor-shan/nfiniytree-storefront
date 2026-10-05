import { Metadata } from "next"
import { notFound } from "next/navigation"
import { retrievePageBySlug } from "@lib/data/pages"
import { getLocale } from "@lib/data/locale-actions"
import { getSeoAlternates, resolveDescription } from "@lib/util/page-metadata"
import { NOINDEX_METADATA, SITE_NAME } from "@lib/util/seo"

const SLUG = "customer-care"

type CustomerCarePageProps = {
  params: Promise<{ countryCode: string }>
}

const LEADING_H1 = /^\s*<h1(?:\s[^>]*)?>([\s\S]*?)<\/h1>\s*/i

const plainText = (html: string) =>
  html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()

/**
 * The page shell owns the h1 on every CMS page here, and the bodies authored so
 * far start at h2 (see the note in `contact/page.tsx`). This body was written as
 * a standalone document instead: it opens with an h1 that repeats the page
 * title and uses h1 for each of its sections, which on top of the shell's own
 * would put eight h1s on the page.
 *
 * Drops that leading h1 when it only repeats the title, and demotes any other h1
 * to h2. h2 and h3 are left alone, so no heading level gets skipped. If the
 * body is later edited to start at h2, this changes nothing.
 */
function normalizeBodyHeadings(html: string, title: string): string {
  const leading = html.match(LEADING_H1)
  const body =
    leading && plainText(leading[1]) === plainText(title)
      ? html.slice(leading[0].length)
      : html

  return body
    .replace(/<h1(\s[^>]*)?>/gi, "<h2$1>")
    .replace(/<\/h1>/gi, "</h2>")
}

export async function generateMetadata(
  props: CustomerCarePageProps
): Promise<Metadata> {
  const { countryCode } = await props.params
  const locale = (await getLocale()) || "en"
  const page = await retrievePageBySlug(SLUG, locale)

  // A missing CMS record renders a 404 below; without this it would inherit the
  // root layout's title and canonical and look like an indexable page.
  if (!page) {
    return NOINDEX_METADATA
  }

  const title = page.seo_title || page.title
  // Blank-but-present CMS fields are truthy, so `resolveDescription` skips them,
  // and as a last resort derives the description from the page body.
  const description = resolveDescription(
    [page.seo_description, page.excerpt],
    page.content
  )

  return {
    title,
    description,
    alternates: await getSeoAlternates(countryCode, "/customer-care"),
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      ...(description ? { description } : {}),
      url: `/${countryCode}/customer-care`,
      images: page.featured_image ? [{ url: page.featured_image }] : [],
    },
  }
}

export default async function CustomerCarePage() {
  const locale = (await getLocale()) || "en"
  const page = await retrievePageBySlug(SLUG, locale)

  if (!page) {
    notFound()
  }

  const content = page.content
    ? normalizeBodyHeadings(page.content, page.title)
    : null

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
      {content && (
        <section className="content-container py-12 lg:py-20">
          <div className="max-w-3xl mx-auto">
            <div
              className="prose prose-lg max-w-none
                prose-headings:font-display prose-headings:text-ink
                prose-p:text-body prose-p:leading-relaxed
                prose-a:text-primary-text prose-a:no-underline hover:prose-a:underline
                prose-strong:text-ink
                prose-li:text-body
                prose-img:rounded-lg"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        </section>
      )}
    </div>
  )
}
