import { Metadata } from "next"
import { notFound } from "next/navigation"
import { retrievePageBySlug } from "@lib/data/pages"
import { getLocale } from "@lib/data/locale-actions"

type PageProps = {
  params: Promise<{ countryCode: string; slug: string }>
}

export async function generateMetadata(
  props: PageProps
): Promise<Metadata> {
  const params = await props.params
  const locale = (await getLocale()) || "en"
  const page = await retrievePageBySlug(params.slug, locale)

  if (!page) {
    return {}
  }

  return {
    title: page.seo_title || page.title,
    description: page.seo_description || page.excerpt || undefined,
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
