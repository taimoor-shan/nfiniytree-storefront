import { PortalRecruit } from "@/types/sales-portal"
import { formatDay, formatMoney } from "../lib/format"
import { PortalT } from "../lib/translator"
import { DataTable, Td, Th } from "./data-table"
import RecruitActions from "./recruit-actions"
import { RecruitStatusPill } from "./status-badge"

/** What the status pill leaves unsaid: how long the link works, or the Level 2 terms. */
const detail = (recruit: PortalRecruit, locale: string, t: PortalT) => {
  if (recruit.status === "invited" && recruit.expires_at) {
    return t("salesPortal.recruits.expires", { date: formatDay(recruit.expires_at, locale) })
  }
  if (recruit.status === "expired" && recruit.expires_at) {
    return t("salesPortal.recruits.expiredOn", { date: formatDay(recruit.expires_at, locale) })
  }
  if (recruit.level2_rate === null) {
    return null
  }
  if (!recruit.level2_until) {
    return t("salesPortal.recruits.level2Open", { rate: recruit.level2_rate })
  }

  return new Date(recruit.level2_until) > new Date()
    ? t("salesPortal.recruits.level2Until", {
        rate: recruit.level2_rate,
        date: formatDay(recruit.level2_until, locale),
      })
    : t("salesPortal.recruits.level2Ended", { date: formatDay(recruit.level2_until, locale) })
}

const RecruitsTable = ({
  recruits,
  countryCode,
  locale,
  t,
}: {
  recruits: PortalRecruit[]
  countryCode: string
  locale: string
  t: PortalT
}) => {
  if (!recruits.length) {
    return (
      <p className="text-base-regular text-muted" data-testid="portal-recruits-empty">
        {t("salesPortal.recruits.empty")}
      </p>
    )
  }

  const money = (amounts: { currency_code: string; amount: number }[]) =>
    amounts.length
      ? amounts.map((m) => formatMoney(m.amount, m.currency_code, countryCode)).join(" · ")
      : null

  return (
    <DataTable data-testid="portal-recruits">
      <thead>
        <tr>
          <Th>{t("salesPortal.recruits.col.name")}</Th>
          <Th>{t("salesPortal.recruits.col.status")}</Th>
          <Th right>{t("salesPortal.recruits.col.level2")}</Th>
          <Th />
        </tr>
      </thead>
      <tbody>
        {recruits.map((recruit) => {
          const text = detail(recruit, locale, t)
          const month = money(recruit.level2_this_month)
          const total = money(recruit.level2_total)

          return (
            <tr key={recruit.id} data-testid={`portal-recruit-${recruit.status}`}>
              <Td className="min-w-[12rem] whitespace-normal">
                <span className="block font-semibold">{recruit.name}</span>
                <span className="block text-muted">{recruit.email}</span>
              </Td>
              <Td className="min-w-[12rem] whitespace-normal">
                <RecruitStatusPill status={recruit.status} t={t} />
                {text && <span className="mt-1 block text-small-regular text-muted">{text}</span>}
              </Td>
              <Td right>
                {recruit.status === "active" || recruit.level2_total.length ? (
                  <>
                    <span className="block font-semibold">{month ?? "–"}</span>
                    {total && (
                      <span className="block text-small-regular text-muted">
                        {t("salesPortal.recruits.level2Total", { amount: total })}
                      </span>
                    )}
                  </>
                ) : (
                  "–"
                )}
              </Td>
              <Td>
                {(recruit.status === "invited" || recruit.status === "expired") && (
                  <RecruitActions id={recruit.id} />
                )}
              </Td>
            </tr>
          )
        })}
      </tbody>
    </DataTable>
  )
}

export default RecruitsTable
