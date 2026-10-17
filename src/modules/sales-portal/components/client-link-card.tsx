"use client"

import { useTranslation } from "@lib/i18n"
import { clientLinkUrl, linkToPage } from "@lib/util/referral"
import { Button } from "@medusajs/ui"
import Input from "@modules/common/components/input"
import { useRef, useState } from "react"

/** "K7M2QXP9" as "K7M2 QXP9": easier to read out loud */
const spaced = (code: string) => `${code.slice(0, 4)} ${code.slice(4)}`

/** Copies text, or selects it for the rep to copy when the browser won't let us. */
const CopyButton = ({
  text,
  select,
  testId,
}: {
  text: string
  select?: () => void
  testId?: string
}) => {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      select?.()
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="base"
      onClick={copy}
      aria-live="polite"
      data-testid={testId}
    >
      {copied
        ? t("salesPortal.clientLink.copied")
        : t("salesPortal.clientLink.copy")}
    </Button>
  )
}

/**
 * What the rep shares: their link, their code, a way to send it, and a tool
 * that puts the code on any page of the shop (a product, a category).
 */
const ClientLinkCard = ({
  code,
  shopUrl,
}: {
  code: string
  shopUrl: string
}) => {
  const { t } = useTranslation()
  const link = clientLinkUrl(shopUrl, code)
  const linkInput = useRef<HTMLInputElement>(null)

  const [pageInput, setPageInput] = useState("")
  const [pageResult, setPageResult] = useState<
    { url: string } | { error: "invalid" | "other_site" } | null
  >(null)
  const pageLinkInput = useRef<HTMLInputElement>(null)

  const message = t("salesPortal.clientLink.shareMessage").replace("{link}", link)
  const subject = t("salesPortal.clientLink.shareSubject")

  const makePageLink = (event: React.FormEvent) => {
    event.preventDefault()
    const result = linkToPage(pageInput, code, shopUrl)
    setPageResult(result.ok ? { url: result.url } : { error: result.reason })
  }

  return (
    <div className="flex flex-col gap-y-8" data-testid="client-link-card">
      <section className="rounded-md bg-surface-soft p-6 flex flex-col gap-y-4">
        <div>
          <h3 className="text-large-semi">{t("salesPortal.clientLink.yourLink")}</h3>
          <p className="text-small-regular text-muted">
            {t("salesPortal.clientLink.yourLinkHint")}
          </p>
        </div>
        <div className="flex flex-col gap-3 small:flex-row small:items-start">
          <div className="flex-1">
            <Input
              ref={linkInput}
              label={t("salesPortal.clientLink.yourLink")}
              name="client_link"
              value={link}
              readOnly
              onFocus={(event) => event.currentTarget.select()}
              data-testid="client-link-input"
            />
          </div>
          <CopyButton
            text={link}
            select={() => linkInput.current?.select()}
            testId="client-link-copy"
          />
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className="text-small-regular text-muted">
            {t("salesPortal.clientLink.shareTitle")}
          </span>
          <a
            href={`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`}
            className="text-small-regular text-link hover:underline"
            data-testid="client-link-share-email"
          >
            {t("salesPortal.clientLink.shareEmail")}
          </a>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-small-regular text-link hover:underline"
            data-testid="client-link-share-whatsapp"
          >
            {t("salesPortal.clientLink.shareWhatsApp")}
          </a>
        </div>
      </section>

      <section className="rounded-md bg-surface-soft p-6 flex flex-col gap-y-3">
        <div>
          <h3 className="text-large-semi">{t("salesPortal.clientLink.yourCode")}</h3>
          <p className="text-small-regular text-muted max-w-2xl">
            {t("salesPortal.clientLink.yourCodeHint")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <span
            className="text-xl-semi font-mono tracking-widest"
            data-testid="client-link-code"
          >
            {spaced(code)}
          </span>
          <CopyButton text={code} testId="client-link-code-copy" />
        </div>
      </section>

      <section className="rounded-md bg-surface-soft p-6 flex flex-col gap-y-4">
        <div>
          <h3 className="text-large-semi">{t("salesPortal.clientLink.pageTitle")}</h3>
          <p className="text-small-regular text-muted max-w-2xl">
            {t("salesPortal.clientLink.pageHint")}
          </p>
        </div>
        <form
          onSubmit={makePageLink}
          className="flex flex-col gap-3 small:flex-row small:items-start"
        >
          <div className="flex-1">
            <Input
              label={t("salesPortal.clientLink.pagePlaceholder")}
              name="page_address"
              value={pageInput}
              onChange={(event) => {
                setPageInput(event.target.value)
                setPageResult(null)
              }}
              inputMode="url"
              autoComplete="off"
              error={
                pageResult && "error" in pageResult
                  ? t(`salesPortal.clientLink.pageError.${pageResult.error}`)
                  : null
              }
              data-testid="client-link-page-input"
            />
          </div>
          <Button
            type="submit"
            variant="secondary"
            size="base"
            data-testid="client-link-page-make"
          >
            {t("salesPortal.clientLink.pageMake")}
          </Button>
        </form>
        {pageResult && "url" in pageResult && (
          <div className="flex flex-col gap-3 small:flex-row small:items-start">
            <div className="flex-1">
              <Input
                ref={pageLinkInput}
                label={t("salesPortal.clientLink.yourLink")}
                name="page_link"
                value={pageResult.url}
                readOnly
                onFocus={(event) => event.currentTarget.select()}
                data-testid="client-link-page-result"
              />
            </div>
            <CopyButton
              text={pageResult.url}
              select={() => pageLinkInput.current?.select()}
              testId="client-link-page-copy"
            />
          </div>
        )}
      </section>
    </div>
  )
}

export default ClientLinkCard
