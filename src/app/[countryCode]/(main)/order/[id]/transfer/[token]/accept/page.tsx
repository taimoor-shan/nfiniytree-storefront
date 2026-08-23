import { acceptTransferRequest } from "@lib/data/orders"
import { Heading, Text } from "@medusajs/ui"
import type { Metadata } from "next"
import TransferImage from "@modules/order/components/transfer-image"
import { translate } from "@/lib/i18n"
import { getLocale } from "@lib/data/locale-actions"
import { NOINDEX_METADATA } from "@lib/util/seo"

// This route performs a state change (accepting the transfer) during render, so
// it must be kept out of any index — a crawler following the link would accept
// the transfer as a side effect. See the audit note: the mutation belongs behind
// a POST, which is a functional change outside this audit's scope.
export const metadata: Metadata = NOINDEX_METADATA

export default async function TransferPage({
  params,
}: {
  params: Promise<{ id: string; token: string }>
}) {
  const { id, token } = await params
  const locale = await getLocale()

  const { success, error } = await acceptTransferRequest(id, token)

  return (
    <div className="flex flex-col gap-y-4 items-start w-2/5 mx-auto mt-10 mb-20">
      <TransferImage />
      <div className="flex flex-col gap-y-6">
        {success && (
          <>
            <Heading level="h1" className="text-xl text-ink">
              {await translate("transfer.transferredTitle", locale)}
            </Heading>
            <Text className="text-body">
              {(await translate("transfer.transferredText", locale)).replace("{id}", id)}
            </Text>
          </>
        )}
        {!success && (
          <>
            <Text className="text-body">
              {await translate("transfer.acceptFail", locale)}
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
