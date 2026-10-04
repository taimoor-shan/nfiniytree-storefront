import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { PortalT } from "../lib/translator"
import SignOutButton from "./sign-out-button"

export type SessionReason = "signed_out" | "no_access" | "not_found" | "error"

/** What to show when a portal page can't load its data. */
const SessionMessage = ({
  reason,
  countryCode,
  t,
}: {
  reason: SessionReason
  countryCode: string
  t: PortalT
}) => {
  const copy: Record<SessionReason, { title: string; text: string }> = {
    signed_out: {
      title: t("salesPortal.title"),
      text: t("salesPortal.sessionExpired"),
    },
    no_access: {
      title: t("salesPortal.noAccess.title"),
      text: t("salesPortal.noAccess.text"),
    },
    not_found: {
      title: t("salesPortal.title"),
      text: t("salesPortal.notFound"),
    },
    error: {
      title: t("salesPortal.title"),
      text: t("salesPortal.loadError"),
    },
  }

  return (
    <div className="max-w-md py-8" data-testid="sales-portal-message">
      <h2 className="text-large-semi mb-4">{copy[reason].title}</h2>
      <p className="text-base-regular text-ink mb-6">{copy[reason].text}</p>
      {reason === "signed_out" && (
        // A full page load: the sign-in form comes from the layout, which a
        // client-side navigation would not run again.
        <a
          href={`/${countryCode}/sales-portal`}
          className="text-link text-small-regular hover:underline"
        >
          {t("salesPortal.signInAgain")}
        </a>
      )}
      {reason === "no_access" && (
        <SignOutButton countryCode={countryCode} t={t} />
      )}
      {(reason === "not_found" || reason === "error") && (
        <LocalizedClientLink
          href="/sales-portal"
          className="text-link text-small-regular hover:underline"
        >
          {t("salesPortal.orders.back")}
        </LocalizedClientLink>
      )}
    </div>
  )
}

export default SessionMessage
