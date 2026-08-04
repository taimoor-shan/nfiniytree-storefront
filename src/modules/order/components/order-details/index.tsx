"use client"

import { getPaymentStatusLabel } from "@lib/constants"
import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"
import { useTranslation } from "@/lib/i18n"

type OrderDetailsProps = {
  order: HttpTypes.StoreOrder
  showStatus?: boolean
  isGuest?: boolean
}

const OrderDetails = ({ order, showStatus, isGuest }: OrderDetailsProps) => {
  const { t } = useTranslation()
  const formatStatus = (str: string) => {
    if (!str) return "N/A"
    const formatted = str.split("_").join(" ")
    return formatted.slice(0, 1).toUpperCase() + formatted.slice(1)
  }

  const maskEmail = (email: string) => {
    const [name, domain] = email.split("@")
    if (!domain) return email
    return `${name[0]}***@${domain}`
  }

  const weHaveSent = t("order.weHaveSent").replace(
    "{email}",
    isGuest && order.email ? maskEmail(order.email) : (order.email ?? "")
  )
  const orderDate = t("order.orderDate")
  const orderNumber = t("order.number")
  const orderStatus = t("order.status")
  const paymentStatus = t("order.paymentStatus")

  return (
    <div>
      <Text>{weHaveSent}</Text>
      <Text className="mt-2">
        {orderDate}{" "}
        <span data-testid="order-date">
          {new Date(order.created_at).toDateString()}
        </span>
      </Text>
      <Text className="mt-2 text-primary">
        {orderNumber}{" "}
        <span data-testid="order-id">{order.display_id}</span>
      </Text>

      <div className="flex items-center text-compact-small gap-x-4 mt-4">
        {showStatus && (
          <Text>
            {orderStatus}{" "}
            <span className="text-body " data-testid="order-status">
              {formatStatus(order.fulfillment_status)}
            </span>
          </Text>
        )}
        <Text>
          {paymentStatus}{" "}
          <span
            className="text-body "
            sata-testid="order-payment-status"
          >
            {getPaymentStatusLabel(order.payment_status)}
          </span>
        </Text>
      </div>
    </div>
  )
}

export default OrderDetails
