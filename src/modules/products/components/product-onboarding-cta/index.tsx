import { Button, Container, Text } from "@medusajs/ui"
import { cookies as nextCookies } from "next/headers"
import { translate } from "@/lib/i18n"
import { getLocale } from "@lib/data/locale-actions"

async function ProductOnboardingCta() {
  const cookies = await nextCookies()
  const locale = await getLocale()

  const isOnboarding = cookies.get("_medusa_onboarding")?.value === "true"

  if (!isOnboarding) {
    return null
  }

  return (
    <Container className="max-w-4xl h-full bg-surface-card w-full p-8">
      <div className="flex flex-col gap-y-4 center">
        <Text className="text-ink text-xl">
          {await translate("onboarding.demoProductCreated", locale)}
        </Text>
        <Text className="text-body text-small-regular">
          {await translate("onboarding.continueSetupText", locale)}
        </Text>
        <a href="http://localhost:7001/a/orders?onboarding_step=create_order_nextjs">
          <Button className="w-full">{await translate("onboarding.continueSetup", locale)}</Button>
        </a>
      </div>
    </Container>
  )
}

export default ProductOnboardingCta
