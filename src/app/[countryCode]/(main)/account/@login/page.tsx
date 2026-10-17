import { Metadata } from "next"

import LoginTemplate from "@modules/account/templates/login-template"
import { translate } from "@lib/i18n"
import { getLocale } from "@lib/data/locale-actions"
import { getReferrer } from "@lib/data/referral"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  return {
    title: await translate("metadata.signInTitle", locale),
    description: await translate("metadata.signInDescription", locale),
  }
}

export default async function Login() {
  const referrer = await getReferrer()

  return <LoginTemplate referrerName={referrer?.name ?? null} />
}
