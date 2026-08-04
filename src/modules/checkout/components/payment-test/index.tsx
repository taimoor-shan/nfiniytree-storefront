import { Badge } from "@medusajs/ui"
import { useTranslation } from "@/lib/i18n"

const PaymentTest = ({ className }: { className?: string }) => {
  const { t } = useTranslation()
  return (
    <Badge color="orange" className={className}>
      {t("checkout.orderProcessedInvoice")}
    </Badge>
  )
}

export default PaymentTest
