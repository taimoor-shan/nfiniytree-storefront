import { Heading, Text } from "@medusajs/ui"

import InteractiveLink from "@modules/common/components/interactive-link"
import { translate } from "@/lib/i18n"
import { getLocale } from "@lib/data/locale-actions"

const EmptyCartMessage = async () => {
  const locale = await getLocale()

  return (
    <div className="py-48 px-2 flex flex-col justify-center items-start" data-testid="empty-cart-message">
      <Heading
        level="h1"
        className="flex flex-row text-3xl-regular gap-x-2 items-baseline"
      >
        {await translate("nav.cart", locale)}
      </Heading>
      <Text className="text-base-regular mt-4 mb-6 max-w-[32rem]">
        {await translate("cart.emptyText", locale)}
      </Text>
      <div>
        <InteractiveLink href="/store">{await translate("cart.exploreProducts", locale)}</InteractiveLink>
      </div>
    </div>
  )
}

export default EmptyCartMessage
