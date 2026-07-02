import ItemsTemplate from "./items"
import Summary from "./summary"
import EmptyCartMessage from "../components/empty-cart-message"
import SignInPrompt from "../components/sign-in-prompt"
import Divider from "@modules/common/components/divider"
import WithdrawalNotice from "@modules/common/components/withdrawal-notice"
import { HttpTypes } from "@medusajs/types"

const hasConfiguredItems = (cart: HttpTypes.StoreCart | null): boolean => {
  return (
    cart?.items?.some(
      (item: any) => (item.variant?.options?.length || 0) > 1
    ) ?? false
  )
}

const CartTemplate = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  return (
    <div className="py-12">
      <div className="content-container" data-testid="cart-container">
        {cart?.items?.length ? (
          <div className="grid grid-cols-1 small:grid-cols-[1fr_360px] gap-x-40">
            <div className="flex flex-col py-6 gap-y-6">
              {!customer && (
                <>
                  <SignInPrompt />
                  <Divider />
                </>
              )}
              <ItemsTemplate cart={cart} />
              {hasConfiguredItems(cart) && (
                <WithdrawalNotice variant="banner" />
              )}
            </div>
            <div className="relative">
              <div className="flex flex-col gap-y-8 sticky top-24">
                {cart && cart.region && (
                  <>
                    <div className="bg-canvas p-4">
                      <Summary cart={cart as any} />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <EmptyCartMessage />
          </div>
        )}
      </div>
    </div>
  )
}

export default CartTemplate
