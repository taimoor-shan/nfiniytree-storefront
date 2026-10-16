import { getMarketPrefix } from "@lib/data/market"
import { resetSalesRepPassword } from "@lib/data/sales-portal-actions"
import { getLocale } from "@lib/data/locale-actions"
import { translate } from "@lib/i18n"
import ResetPassword from "@modules/account/components/reset-password"
import { Metadata } from "next"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  return {
    title: await translate("metadata.resetPasswordTitle", locale),
    description: await translate("metadata.resetPasswordDescription", locale),
  }
}

export default async function SalesPortalResetPasswordPage({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params
  const prefix = await getMarketPrefix(countryCode)
  const locale = await getLocale()

  return (
    <div className="w-full flex justify-center px-8 py-16">
      <ResetPassword
        action={resetSalesRepPassword}
        successHref={`/${prefix}/sales-portal`}
        requestNewHref={`/${prefix}/sales-portal/forgot-password`}
        description={await translate("salesPortal.resetPasswordPrompt", locale)}
      />
    </div>
  )
}
