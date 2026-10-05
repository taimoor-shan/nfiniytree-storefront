import { PortalRep } from "@/types/sales-portal"
import React from "react"
import { PortalT } from "../lib/translator"
import PortalNav from "./portal-nav"
import SignOutButton from "./sign-out-button"

const PortalShell = ({
  rep,
  countryCode,
  t,
  children,
}: {
  rep: PortalRep
  countryCode: string
  t: PortalT
  children: React.ReactNode
}) => (
  <div
    className="content-container max-w-5xl mx-auto py-12"
    data-testid="sales-portal"
  >
    <header className="flex flex-col gap-4 border-b border-hairline pb-6 mb-8 small:flex-row small:items-end small:justify-between">
      <div>
        <h1 className="text-large-semi uppercase mb-1">
          {t("salesPortal.title")}
        </h1>
        <p className="text-small-regular text-muted" data-testid="portal-rep">
          {t("salesPortal.signedInAs")} {rep.name} ({rep.email})
        </p>
      </div>
      <div className="flex items-center gap-x-6">
        <PortalNav
          items={[
            { href: "/sales-portal", label: t("salesPortal.nav.overview") },
            {
              href: "/sales-portal/payouts",
              label: t("salesPortal.nav.payouts"),
            },
          ]}
        />
        <SignOutButton countryCode={countryCode} t={t} />
      </div>
    </header>
    {children}
  </div>
)

export default PortalShell
