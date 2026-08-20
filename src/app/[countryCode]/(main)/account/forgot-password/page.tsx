import ForgotPassword from "@modules/account/components/forgot-password"
import { Metadata } from "next"
import { translate } from "@lib/i18n"
import { getLocale } from "@lib/data/locale-actions"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  return {
    title: await translate("metadata.forgotPasswordTitle", locale),
    description: await translate("metadata.forgotPasswordDescription", locale),
  }
}

export default function ForgotPasswordPage() {
  return <ForgotPassword />
}
