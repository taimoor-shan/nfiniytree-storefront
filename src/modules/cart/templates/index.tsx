import ItemsTemplate from "./items"
import Summary from "./summary"
import EmptyCartMessage from "../components/empty-cart-message"
import SignInPrompt from "../components/sign-in-prompt"
import Divider from "@modules/common/components/divider"
import WithdrawalNotice from "@modules/common/components/withdrawal-notice"
import { HttpTypes } from "@medusajs/types"
import { translate } from "@/lib/i18n"
import { getLocale } from "@lib/data/locale-actions"

const CartTemplate = async ({
  cart,
  customer,
  countryCode,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
  /** URL country — price formatting falls back to it when the cart has no shipping country yet. */
  countryCode?: string
}) => {
  const locale = await getLocale()

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
              <ItemsTemplate cart={cart} countryCode={countryCode} />
              <WithdrawalNotice
                variant="banner"
                title={await translate("withdrawal.noticeTitle", locale)}
                importantPrefix={await translate("withdrawal.importantPrefix", locale)}
                legalText={await translate("withdrawal.legalText", locale)}
                decree={await translate("withdrawal.decree", locale)}
                seeOurDetails={await translate("withdrawal.seeOurDetails", locale)}
                policyLinkLabel={await translate("withdrawal.policyLinkLabel", locale)}
              />
            </div>
            <div className="relative">
              <div className="flex flex-col gap-y-8 sticky top-24">
                {cart && cart.region && (
                  <>
                    <div className="bg-canvas p-6 border border-hairline rounded-sm">
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
