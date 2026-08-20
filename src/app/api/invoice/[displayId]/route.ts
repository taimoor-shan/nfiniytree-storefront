/**
 * GET /api/invoice/:displayId?token=...
 *
 * Public proxy for downloading a Pro Forma Invoice PDF.
 * Forwards the request to the Medusa backend's guest-invoice endpoint
 * and streams the PDF back with the correct headers.
 *
 * The link is emailed to customers on order confirmation and must work
 * from any browser without authentication — the token in the URL is the
 * only credential.
 */

import { NextRequest, NextResponse } from "next/server"
import { getLocale } from "@lib/data/locale-actions"
import { translate } from "@lib/i18n/dictionaries"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ displayId: string }> }
) {
  const { displayId } = await params
  const token = req.nextUrl.searchParams.get("token")
  const locale = await getLocale()

  if (!token) {
    return NextResponse.json(
      { error: await translate("invoice.tokenRequired", locale) },
      { status: 400 }
    )
  }

  const backendUrl =
    process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

  try {
    const backendRes = await fetch(
      `${backendUrl}/invoice/guest/${displayId}?token=${encodeURIComponent(token)}`,
      { cache: "no-store" }
    )

    if (!backendRes.ok) {
      // Forward the backend's status — typically 404 for bad token / unknown order
      return new NextResponse(
        backendRes.status === 404
          ? await translate("invoice.notFound", locale)
          : await translate("invoice.downloadFailed", locale),
        { status: backendRes.status }
      )
    }

    const pdfBuffer = await backendRes.arrayBuffer()

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          backendRes.headers.get("Content-Disposition") ??
          `attachment; filename="INV-${displayId}.pdf"`,
        "Content-Length": pdfBuffer.byteLength.toString(),
        // Allow caching in the browser so reloads don't hit the backend again
        "Cache-Control": "private, max-age=3600",
      },
    })
  } catch {
    return NextResponse.json(
      { error: await translate("invoice.serviceUnavailable", locale) },
      { status: 502 }
    )
  }
}
