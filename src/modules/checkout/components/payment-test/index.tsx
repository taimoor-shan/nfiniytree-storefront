import { Badge } from "@medusajs/ui"

const PaymentTest = ({ className }: { className?: string }) => {
  return (
    <Badge color="orange" className={className}>
      Your order will be reserved — payment handled separately
    </Badge>
  )
}

export default PaymentTest
