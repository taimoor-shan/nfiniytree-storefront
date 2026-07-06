import { Button, Heading, Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { translate } from "@/lib/i18n"
import { getLocale } from "@lib/data/locale-actions"

const SignInPrompt = async () => {
  const locale = await getLocale()

  return (
    <div className="flex items-center justify-between">
      <div>
        <Heading level="h2" className="txt-xlarge">
          {await translate("cart.alreadyHaveAccount", locale)}
        </Heading>
        <Text className="txt-medium text-body mt-2">
          {await translate("cart.signInForBetter", locale)}
        </Text>
      </div>
      <div>
        <LocalizedClientLink href="/account">
          <Button variant="secondary" className="h-10" data-testid="sign-in-button">
            {await translate("cart.signIn", locale)}
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default SignInPrompt
