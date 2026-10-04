import { requestSalesRepPasswordReset } from "@lib/data/sales-portal-actions"
import { getLocale } from "@lib/data/locale-actions"
import { translate } from "@lib/i18n"
import ForgotPassword from "@modules/account/components/forgot-password"
import { Metadata } from "next"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  return {
    title: await translate("metadata.forgotPasswordTitle", locale),
    description: await translate("metadata.forgotPasswordDescription", locale),
  }
}

export default async function SalesPortalForgotPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ email?: string | string[] }>
}) {
  const { countryCode } = await params
  const { email } = await searchParams
  const locale = await getLocale()

  return (
    <div className="w-full flex justify-center px-8 py-16">
      <ForgotPassword
        action={requestSalesRepPasswordReset}
        backHref={`/${countryCode}/sales-portal`}
        description={await translate("salesPortal.forgotPasswordPrompt", locale)}
        defaultEmail={typeof email === "string" ? email : undefined}
      />
    </div>
  )
}
