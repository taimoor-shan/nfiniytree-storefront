"use client"

import { useState } from "react"
import { Container, Heading, Text, Button } from "@medusajs/ui"
import { ArrowDownTray, DocumentText } from "@medusajs/icons"

import { getPaymentStatusLabel, isManual, isStripeLike, paymentInfoMap } from "@lib/constants"
import Divider from "@modules/common/components/divider"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { useTranslation } from "@/lib/i18n"

type PaymentDetailsProps = {
  order: HttpTypes.StoreOrder
}

const PaymentDetails = ({ order }: PaymentDetailsProps) => {
  const { t } = useTranslation()
  const [downloading, setDownloading] = useState(false)
  const payment = order.payment_collections?.[0].payments?.[0]
  const showBankTransfer = payment && isManual(payment.provider_id)

  const handleDownloadInvoice = async () => {
    setDownloading(true)
    try {
      const response = await fetch(`/api/orders/${order.id}/invoice`)
      if (!response.ok) throw new Error("Failed to download invoice")
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `INV-${order.display_id}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Invoice download failed:", err)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div>
      <Heading level="h2" className="flex flex-row text-3xl-regular my-6">
        {t("checkout.payment")}
      </Heading>
      <div>
        {payment && (
          <div className="flex items-start gap-x-1 w-full">
            <div className="flex flex-col w-1/3">
              <Text className="txt-medium-plus text-ink mb-1">
                {t("checkout.payment")}
              </Text>
              <Text
                className="txt-medium text-body"
                data-testid="payment-method"
              >
                {isManual(payment.provider_id)
                  ? t("checkout.directBankTransfer")
                  : paymentInfoMap[payment.provider_id]?.title ||
                    payment.provider_id}
              </Text>
              <Text
                className="txt-medium text-body mt-1"
                data-testid="payment-status"
              >
                {t("order.paymentStatus")}:{" "}
                {getPaymentStatusLabel(order.payment_status)}
              </Text>
            </div>
          </div>
        )}

        {/* Download Invoice Button */}
        <div className="mt-6">
          <Button
            variant="secondary"
            onClick={handleDownloadInvoice}
            disabled={downloading}
            data-testid="download-invoice-button"
          >
            {downloading ? (
              <span className="flex items-center gap-x-2">
                <DocumentText />
                {t("order.downloadingInvoice")}
              </span>
            ) : (
              <span className="flex items-center gap-x-2">
                <ArrowDownTray />
                {t("order.downloadInvoice")}
              </span>
            )}
          </Button>
        </div>

        {/* Next Steps for Bank Transfer */}
        {showBankTransfer && (
          <div className="mt-8">
            <Heading level="h3" className="text-xl-regular text-ink mb-4">
              {t("order.nextSteps.heading")}
            </Heading>
            <ol className="flex flex-col gap-y-3 list-decimal list-inside">
              <li className="txt-medium text-body">
                {t("order.nextSteps.step1")}
              </li>
              <li className="txt-medium text-body">
                {t("order.nextSteps.step2")}
              </li>
              <li className="txt-medium text-body">
                {t("order.nextSteps.step3")}
              </li>
              <li className="txt-medium text-body">
                {t("order.nextSteps.step4")}
              </li>
            </ol>
          </div>
        )}
      </div>

      <Divider className="mt-8" />
    </div>
  )
}

export default PaymentDetails
