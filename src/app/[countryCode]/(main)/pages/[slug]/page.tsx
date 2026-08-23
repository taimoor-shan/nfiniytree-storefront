import { Metadata } from "next"
import { notFound } from "next/navigation"
import { retrievePageBySlug } from "@lib/data/pages"
import { getLocale } from "@lib/data/locale-actions"
import { getSeoAlternates, resolveDescription } from "@lib/util/page-metadata"
import { NOINDEX_METADATA, SITE_NAME } from "@lib/util/seo"

type PageProps = {
  params: Promise<{ countryCode: string; slug: string }>
}

export async function generateMetadata(
  props: PageProps
): Promise<Metadata> {
  const params = await props.params
  const locale = (await getLocale()) || "en"
  const page = await retrievePageBySlug(params.slug, locale)

  // A missing CMS record renders a 404 below. Returning bare `{}` let the page
  // inherit the root layout's title and canonical, so a mistyped slug looked to
  // a crawler like a real, indexable page duplicating the homepage.
  if (!page) {
    return NOINDEX_METADATA
  }

  const title = page.seo_title || page.title
  // `page.seo_description || page.excerpt || undefined` left every CMS page
  // whose editor filled in neither field with no meta description at all — and
  // a field holding only whitespace was truthy, so it won the chain and
  // produced a blank one. `resolveDescription` skips blank fields and, as a
  // last resort, derives a description from the page body rather than shipping
  // none. There is no generic string to fall back to here: an arbitrary CMS
  // slug has no known subject, and a boilerplate description repeated across
  // every such page is what this audit set out to remove.
  const description = resolveDescription(
    [page.seo_description, page.excerpt],
    page.content
  )

  return {
    title,
    description,
    alternates: await getSeoAlternates(
      params.countryCode,
      `/pages/${params.slug}`
    ),
    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      title,
      ...(description ? { description } : {}),
      url: `/${params.countryCode}/pages/${params.slug}`,
      ...(page.featured_image ? { images: [{ url: page.featured_image }] } : {}),
    },
  }
}

export default async function Page(props: PageProps) {
  const params = await props.params
  const locale = (await getLocale()) || "en"
  const page = await retrievePageBySlug(params.slug, locale)

  if (!page) {
    notFound()
  }

  return (
    <div className="content-container py-16">
      <div className="flex flex-col gap-y-6">
        <div className="flex flex-col gap-y-2">
          <h1 className="text-2xl font-semibold text-ink">
            {page.title}
          </h1>
          {page.excerpt && (
            <p className="text-body">{page.excerpt}</p>
          )}
        </div>
        {page.featured_image && (
          <div className="overflow-hidden rounded-md border border-hairline">
            <img
              src={page.featured_image}
              alt={page.title}
              className="w-full h-auto object-cover"
            />
          </div>
        )}
        {page.content && (
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        )}
      </div>
    </div>
  )
}
