import { Metadata } from "next"
import { retrievePageBySlug } from "@lib/data/pages"
import { translate } from "@lib/i18n"
import { getLocale } from "@lib/data/locale-actions"
import { getCmsPageMetadata } from "@lib/util/page-metadata"

const SLUG = "privacy-policy"

type Props = {
  params: Promise<{ countryCode: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode } = await props.params
  return getCmsPageMetadata({
    slug: SLUG,
    path: "/policies/privacy",
    countryCode,
    titleKey: "footer.privacyPolicy",
    descriptionKey: "metadata.privacyDescription",
  })
}

export default async function PrivacyPolicyPage() {
  const locale = (await getLocale()) || "en"
  const page = await retrievePageBySlug(SLUG, locale)

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
              {await translate("footer.privacyPolicy", locale)}
            </h1>
            <div className="mt-6 space-y-4 text-body">
              <p>{await translate("policy.pageBeingUpdated", locale)}</p>
              <p>
                {await translate("policy.forPrivacyRequests", locale)}{" "}
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
