import { getAuthHeaders } from "@lib/data/cookies"

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
    return new Response("Failed to download pro forma invoice", { status: response.status })
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
