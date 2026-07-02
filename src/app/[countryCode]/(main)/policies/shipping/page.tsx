import { Metadata } from "next"
import { retrievePageBySlug } from "@lib/data/pages"

const SLUG = "shipping-policy"
const FALLBACK_TITLE = "Shipping Policy"

export async function generateMetadata(): Promise<Metadata> {
  const page = await retrievePageBySlug(SLUG)
  return {
    title: page?.seo_title || page?.title || `${FALLBACK_TITLE} | Infinytree`,
    description:
      page?.seo_description || page?.excerpt || "Shipping zones, delivery times and costs.",
  }
}

export default async function ShippingPolicyPage() {
  const page = await retrievePageBySlug(SLUG)

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
              {FALLBACK_TITLE}
            </h1>
            <div className="mt-6 space-y-4 text-body">
              <p>This page is being updated. Please check back soon.</p>
              <p>
                For shipping questions, contact us at:{" "}
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
