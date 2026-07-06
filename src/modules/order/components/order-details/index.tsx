import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"
import { translate } from "@/lib/i18n"
import { getLocale } from "@lib/data/locale-actions"

type OrderDetailsProps = {
  order: HttpTypes.StoreOrder
  showStatus?: boolean
}

const OrderDetails = async ({ order, showStatus }: OrderDetailsProps) => {
  const locale = await getLocale()
  const formatStatus = (str: string) => {
    const formatted = str.split("_").join(" ")

    return formatted.slice(0, 1).toUpperCase() + formatted.slice(1)
  }

  const weHaveSent = (await translate("order.weHaveSent", locale)).replace(
    "{email}",
    order.email ?? ""
  )
  const orderDate = await translate("order.orderDate", locale)
  const orderNumber = await translate("order.number", locale)
  const orderStatus = await translate("order.status", locale)
  const paymentStatus = await translate("order.paymentStatus", locale)

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
          <>
            <Text>
              {orderStatus}{" "}
              <span className="text-body " data-testid="order-status">
                {formatStatus(order.fulfillment_status)}
              </span>
            </Text>
            <Text>
              {paymentStatus}{" "}
              <span
                className="text-body "
                sata-testid="order-payment-status"
              >
                {formatStatus(order.payment_status)}
              </span>
            </Text>
          </>
        )}
      </div>
    </div>
  )
}

export default OrderDetails
