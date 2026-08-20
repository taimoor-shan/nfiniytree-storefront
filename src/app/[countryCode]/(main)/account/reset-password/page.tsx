import ResetPassword from "@modules/account/components/reset-password"
import { Metadata } from "next"
import { translate } from "@lib/i18n"
import { getLocale } from "@lib/data/locale-actions"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  return {
    title: await translate("metadata.resetPasswordTitle", locale),
    description: await translate("metadata.resetPasswordDescription", locale),
  }
}

export default function ResetPasswordPage() {
  return <ResetPassword />
}
