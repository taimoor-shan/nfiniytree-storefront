import { getAuthHeaders } from "@lib/data/cookies"
import { getLocale } from "@lib/data/locale-actions"
import { translate } from "@lib/i18n/dictionaries"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const backendUrl =
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
  const publishableKey =
    process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

  const authHeaders = await getAuthHeaders()

  const response = await fetch(`${backendUrl}/store/orders/${id}/invoice`, {
    headers: {
      "x-publishable-api-key": publishableKey,
      ...authHeaders,
    },
  })

  if (!response.ok) {
    const locale = await getLocale()
    return new Response(
      await translate("invoice.proformaDownloadFailed", locale),
      { status: response.status }
    )
  }

  const pdfBuffer = await response.arrayBuffer()

  return new Response(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="INV-${id.slice(-8)}.pdf"`,
      "Content-Length": pdfBuffer.byteLength.toString(),
    },
  })
}
