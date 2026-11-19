import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getLocale } from "@lib/data/locale-actions"
import { translate } from "@lib/i18n"
import { NOINDEX_METADATA } from "@lib/util/seo"
import NewsletterStatus from "@modules/layout/components/newsletter-status"

type Props = {
  params: Promise<{ countryCode: string; action: string }>
  searchParams: Promise<{ token?: string }>
}

const ACTIONS = { confirm: "newsletter.confirmTitle", unsubscribe: "newsletter.unsubscribeTitle" } as const

const isAction = (value: string): value is keyof typeof ACTIONS => value in ACTIONS

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { action } = await props.params
  const locale = (await getLocale()) || "en"
  return {
    ...NOINDEX_METADATA,
    title: isAction(action) ? await translate(ACTIONS[action], locale) : undefined,
  }
}

/** `/newsletter/confirm?token=` and `/newsletter/unsubscribe?token=`, the links in the emails. */
export default async function NewsletterActionPage(props: Props) {
  const { action } = await props.params
  if (!isAction(action)) {
    notFound()
  }
  const { token } = await props.searchParams
  const locale = (await getLocale()) || "en"

  return (
    <div className="content-container py-16 max-w-xl">
      <h1 className="text-3xl font-display text-ink mb-6">
        {await translate(ACTIONS[action], locale)}
      </h1>
      <NewsletterStatus action={action} token={token ?? ""} />
    </div>
  )
}
