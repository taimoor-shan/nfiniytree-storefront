import { PortalOrder } from "@/types/sales-portal"
import { clx } from "@medusajs/ui"
import { formatDate, formatMoney, formatRate } from "../lib/format"
import { PortalT } from "../lib/translator"
import { DataTable, Td, Th } from "./data-table"

const OrdersTable = ({
  orders,
  countryCode,
  locale,
  t,
}: {
  orders: PortalOrder[]
  countryCode: string
  locale: string
  t: PortalT
}) => {
  if (!orders.length) {
    return (
      <p className="text-base-regular text-muted" data-testid="portal-orders-empty">
        {t("salesPortal.orders.empty")}
      </p>
    )
  }

  return (
    <DataTable data-testid="portal-orders">
      <thead>
        <tr>
          <Th>{t("salesPortal.col.order")}</Th>
          <Th>{t("salesPortal.col.paidOn")}</Th>
          <Th right>{t("salesPortal.col.netValue")}</Th>
          <Th right>{t("salesPortal.col.rate")}</Th>
          <Th right>{t("salesPortal.col.commission")}</Th>
          <Th>{t("salesPortal.col.status")}</Th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => (
          <tr
            key={order.order_number}
            className={clx(order.status === "reversed" && "text-muted")}
            data-testid="portal-order"
          >
            <Td>#{order.order_number}</Td>
            <Td>{formatDate(order.paid_at, locale)}</Td>
            <Td right>
              {formatMoney(order.net_value, order.currency_code, countryCode)}
            </Td>
            <Td right>{formatRate(order.rate)}</Td>
            <Td
              right
              className={clx(
                "font-semibold",
                order.status === "reversed" && "line-through"
              )}
            >
              {formatMoney(order.commission, order.currency_code, countryCode)}
            </Td>
            <Td>{t(`salesPortal.orders.${order.status}`)}</Td>
          </tr>
        ))}
      </tbody>
    </DataTable>
  )
}

export default OrdersTable
