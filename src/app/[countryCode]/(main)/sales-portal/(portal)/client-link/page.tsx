import { getPortalClientLink } from "@lib/data/sales-portal"
import { getLocale } from "@lib/data/locale-actions"
import { translate } from "@lib/i18n"
import { getBaseURL } from "@lib/util/env"
import ClientLinkCard from "@modules/sales-portal/components/client-link-card"
import ReferredClientsTable from "@modules/sales-portal/components/referred-clients-table"
import SessionMessage from "@modules/sales-portal/components/session-message"
import { getPortalTranslator } from "@modules/sales-portal/lib/translator"
import { Metadata } from "next"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  return {
    title: await translate("salesPortal.clientLink.title", locale),
    description: await translate("metadata.salesPortalDescription", locale),
  }
}

export default async function SalesPortalClientLinkPage({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params
  const { t, locale } = await getPortalTranslator()

  const result = await getPortalClientLink(locale)

  // Each page checks the session itself: a layout isn't re-run on client-side navigation
  if (!result.ok) {
    return <SessionMessage reason={result.reason} countryCode={countryCode} t={t} />
  }
  const link = result.data.client_link
  const { registered, ordered, paid } = link.summary

  return (
    <div className="flex flex-col gap-y-12" data-testid="client-link-page">
      <section>
        <h2 className="text-xl-semi mb-2">{t("salesPortal.clientLink.title")}</h2>
        <p className="max-w-2xl text-base-regular text-muted">
          {link.rate === null
            ? t("salesPortal.clientLink.introNoRate")
            : t("salesPortal.clientLink.intro").replace("{rate}", String(link.rate))}
        </p>
        {!link.active && (
          <p
            role="status"
            className="mt-4 max-w-2xl rounded-md bg-accent-amber/25 p-4 text-small-regular text-ink"
            data-testid="client-link-off"
          >
            {t("salesPortal.clientLink.off")}
          </p>
        )}
      </section>

      <ClientLinkCard code={link.code} shopUrl={getBaseURL()} />

      <section>
        <h3 className="text-large-semi mb-1">{t("salesPortal.clientLink.clientsTitle")}</h3>
        {link.referred.length > 0 && (
          <p className="mb-4 text-small-regular text-muted" data-testid="client-link-summary">
            {t("salesPortal.clientLink.summary")
              .replace("{registered}", String(registered))
              .replace("{ordered}", String(ordered))
              .replace("{paid}", String(paid))}
          </p>
        )}
        <ReferredClientsTable referred={link.referred} locale={locale} t={t} />
      </section>

      <section className="max-w-2xl">
        <h3 className="text-large-semi mb-2">{t("salesPortal.clientLink.rulesTitle")}</h3>
        <ul className="list-disc pl-5 flex flex-col gap-y-2 text-small-regular text-muted">
          {[1, 2, 3, 4, 5].map((n) => (
            <li key={n}>{t(`salesPortal.clientLink.rule${n}`)}</li>
          ))}
        </ul>
      </section>
    </div>
  )
}
