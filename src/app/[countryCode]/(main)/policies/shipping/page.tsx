import { Metadata } from "next"
import { retrievePageBySlug } from "@lib/data/pages"
import { translate } from "@lib/i18n"
import { getLocale } from "@lib/data/locale-actions"

const SLUG = "shipping-policy"

export async function generateMetadata(): Promise<Metadata> {
  const page = await retrievePageBySlug(SLUG)
  const locale = await getLocale()
  const title = await translate("footer.shippingPolicy", locale)
  return {
    title: page?.seo_title || page?.title || `${title} | Infinytree`,
    description:
      page?.seo_description || page?.excerpt || (await translate("policy.pageBeingUpdated", locale)),
  }
}

export default async function ShippingPolicyPage() {
  const page = await retrievePageBySlug(SLUG)
  const locale = await getLocale()

  return (
    <div className="content-container py-16">
      <div className="max-w-4xl mx-auto">
        {page?.content ? (
          <div
            className="prose max-w-none text-body"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-ink">
              {await translate("footer.shippingPolicy", locale)}
            </h1>
            <div className="mt-6 space-y-4 text-body">
              <p>{await translate("policy.pageBeingUpdated", locale)}</p>
              <p>
                {await translate("policy.forShippingQuestions", locale)}{" "}
                <a
                  href="mailto:info@infinytree.com"
                  className="text-ink underline"
                >
                  info@infinytree.com
                </a>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
