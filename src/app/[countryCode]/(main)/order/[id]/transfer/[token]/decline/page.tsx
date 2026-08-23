import { declineTransferRequest } from "@lib/data/orders"
import { Heading, Text } from "@medusajs/ui"
import type { Metadata } from "next"
import TransferImage from "@modules/order/components/transfer-image"
import { translate } from "@/lib/i18n"
import { getLocale } from "@lib/data/locale-actions"
import { NOINDEX_METADATA } from "@lib/util/seo"

// Same as the accept route: renders a state change, so it must not be crawled.
export const metadata: Metadata = NOINDEX_METADATA

export default async function TransferPage({
  params,
}: {
  params: Promise<{ id: string; token: string }>
}) {
  const { id, token } = await params
  const locale = await getLocale()

  const { success, error } = await declineTransferRequest(id, token)

  return (
    <div className="flex flex-col gap-y-4 items-start w-2/5 mx-auto mt-10 mb-20">
      <TransferImage />
      <div className="flex flex-col gap-y-6">
        {success && (
          <>
            <Heading level="h1" className="text-xl text-ink">
              {await translate("transfer.declinedTitle", locale)}
            </Heading>
            <Text className="text-body">
              {(await translate("transfer.declinedText", locale)).replace("{id}", id)}
            </Text>
          </>
        )}
        {!success && (
          <>
            <Text className="text-body">
              {await translate("transfer.declineFail", locale)}
            </Text>
            {error && (
              <Text className="text-error">
                {(await translate("transfer.errorMessage", locale)).replace("{error}", error)}
              </Text>
            )}
          </>
        )}
      </div>
    </div>
  )
}
