"use client"

import { resetOnboardingState } from "@lib/data/onboarding"
import { Button, Container, Text } from "@medusajs/ui"
import { useTranslation } from "@lib/i18n/client"

const OnboardingCta = ({ orderId }: { orderId: string }) => {
  const { t } = useTranslation()

  return (
    <Container className="max-w-4xl h-full bg-surface-card w-full">
      <div className="flex flex-col gap-y-4 center p-4 md:items-center">
        <Text className="text-ink text-xl">
          {t("onboarding.testOrderCreated")}
        </Text>
        <Text className="text-body text-small-regular">
          {t("onboarding.completeSetupText")}
        </Text>
        <Button
          className="w-fit"
          size="xlarge"
          onClick={() => resetOnboardingState(orderId)}
        >
          {t("onboarding.completeSetup")}
        </Button>
      </div>
    </Container>
  )
}

export default OnboardingCta
