import { Heading, Text } from "@medusajs/ui"
import type { Metadata } from "next"
import TransferActions from "@modules/order/components/transfer-actions"
import TransferImage from "@modules/order/components/transfer-image"
import { translate } from "@/lib/i18n"
import { getLocale } from "@lib/data/locale-actions"
import { NOINDEX_METADATA } from "@lib/util/seo"

// Token-scoped, single-use and tied to one order. Nothing here should be
// crawled or indexed.
export const metadata: Metadata = NOINDEX_METADATA

export default async function TransferPage({
  params,
}: {
  params: Promise<{ id: string; token: string }>
}) {
  const { id, token } = await params
  const locale = await getLocale()

  return (
    <div className="flex flex-col gap-y-4 items-start w-2/5 mx-auto mt-10 mb-20">
      <TransferImage />
      <div className="flex flex-col gap-y-6">
        <Heading level="h1" className="text-xl text-ink">
          {(await translate("transfer.requestHeading", locale)).replace("{id}", id)}
        </Heading>
        <Text className="text-body">
          {(await translate("transfer.requestDescription", locale)).replace("{id}", id)}
        </Text>
        <div className="w-full h-px bg-surface-card" />
        <Text className="text-body">
          {await translate("transfer.acceptDescription", locale)}
        </Text>
        <Text className="text-body">
          {await translate("transfer.notRecognize", locale)}
        </Text>
        <div className="w-full h-px bg-surface-card" />
        <TransferActions id={id} token={token} />
      </div>
    </div>
  )
}
