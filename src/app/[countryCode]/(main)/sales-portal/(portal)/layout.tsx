import { salesRepLogin } from "@lib/data/sales-portal-actions"
import { getPortalMe } from "@lib/data/sales-portal"
import Login from "@modules/account/components/login"
import PortalShell from "@modules/sales-portal/components/portal-shell"
import SessionMessage from "@modules/sales-portal/components/session-message"
import { getPortalTranslator } from "@modules/sales-portal/lib/translator"

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params
  const { t } = await getPortalTranslator()
  const me = await getPortalMe()

  if (!me.ok && me.reason === "signed_out") {
    return (
      <div className="w-full flex justify-center px-8 py-16">
        <Login
          action={salesRepLogin}
          forgotPasswordHref={`/${countryCode}/sales-portal/forgot-password`}
          title={t("salesPortal.signInTitle")}
          description={t("salesPortal.signInPrompt")}
        />
      </div>
    )
  }

  if (!me.ok) {
    return (
      <div className="content-container max-w-5xl mx-auto py-12">
        <SessionMessage
          reason={me.reason === "not_found" ? "error" : me.reason}
          countryCode={countryCode}
          t={t}
        />
      </div>
    )
  }

  return (
    <PortalShell rep={me.data.sales_rep} countryCode={countryCode} t={t}>
      {children}
    </PortalShell>
  )
}
