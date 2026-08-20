import { Metadata } from "next"

import LoginTemplate from "@modules/account/templates/login-template"
import { translate } from "@lib/i18n"
import { getLocale } from "@lib/data/locale-actions"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  return {
    title: await translate("metadata.signInTitle", locale),
    description: await translate("metadata.signInDescription", locale),
  }
}

export default function Login() {
  return <LoginTemplate />
}
