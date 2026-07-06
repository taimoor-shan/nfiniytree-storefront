import { Metadata } from "next"

import InteractiveLink from "@modules/common/components/interactive-link"
import { translate } from "@lib/i18n"
import { getLocale } from "@lib/data/locale-actions"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  return {
    title: "404",
    description: await translate("common.somethingWentWrong", locale),
  }
}

export default async function NotFound() {
  const locale = await getLocale()

  return (
    <div className="flex flex-col gap-4 items-center justify-center min-h-[calc(100vh-64px)]">
      <h1 className="text-2xl-semi text-ink">{await translate("common.pageNotFound", locale)}</h1>
      <p className="text-small-regular text-ink">
        {await translate("common.somethingWentWrong", locale)}
      </p>
      <InteractiveLink href="/">{await translate("common.goToFrontpage", locale)}</InteractiveLink>
    </div>
  )
}
