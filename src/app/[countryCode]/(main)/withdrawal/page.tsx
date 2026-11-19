import { Metadata } from "next"
import { getLocale } from "@lib/data/locale-actions"
import { translate } from "@lib/i18n"
import { getSeoAlternates } from "@lib/util/page-metadata"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import WithdrawalForm from "@modules/withdrawal/components/withdrawal-form"

type Props = {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ order?: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode } = await props.params
  const locale = (await getLocale()) || "en"
  return {
    title: await translate("withdrawal.metaTitle", locale),
    alternates: await getSeoAlternates(countryCode, "/withdrawal"),
  }
}

/**
 * "Withdraw from contract": the online withdrawal function EU law requires
 * since 19 June 2026. Linked from every page's footer and from the order
 * pages (which fill in the order number).
 */
export default async function WithdrawalPage(props: Props) {
  const { order } = await props.searchParams
  const locale = (await getLocale()) || "en"
  const [title, intro, termsLink] = await Promise.all([
    translate("withdrawal.title", locale),
    translate("withdrawal.intro", locale),
    translate("withdrawal.termsLink", locale),
  ])
  const [introBefore, introAfter] = intro.split("{terms}")

  return (
    <div className="content-container py-12 max-w-2xl">
      <h1 className="text-3xl font-display text-ink mb-4">{title}</h1>
      <p className="text-body mb-8">
        {introBefore}
        <LocalizedClientLink href="/policies/terms" className="underline underline-offset-2">
          {termsLink}
        </LocalizedClientLink>
        {introAfter}
      </p>
      <WithdrawalForm orderNumber={order?.replace(/[^\d]/g, "").slice(0, 12) || undefined} />
    </div>
  )
}
