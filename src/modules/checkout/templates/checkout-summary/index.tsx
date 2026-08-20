import { Heading } from "@medusajs/ui"

import ItemsPreviewTemplate from "@modules/cart/templates/preview"
import DiscountCode from "@modules/checkout/components/discount-code"
import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import { getTaxRate } from "@lib/util/tax-rate"
import { getLocale } from "@lib/data/locale-actions"
import { translate } from "@lib/i18n/dictionaries"

const CheckoutSummary = async ({ cart }: { cart: any }) => {
  const locale = await getLocale()

  return (
    <div className="sticky top-0 flex flex-col-reverse small:flex-col gap-y-8 py-8 small:py-0 ">
      <div className="w-full bg-canvas flex flex-col">
        <Divider className="my-6 small:hidden" />
        <Heading
          level="h2"
          className="flex flex-row text-3xl-regular items-baseline"
        >
          {await translate("cart.inYourCart", locale)}
        </Heading>
        <Divider className="my-6" />
        <CartTotals totals={cart} taxRate={getTaxRate(cart)} />
        <ItemsPreviewTemplate cart={cart} />
        <div className="my-6">
          <DiscountCode cart={cart} />
        </div>
      </div>
    </div>
  )
}

export default CheckoutSummary
