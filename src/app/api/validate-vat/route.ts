/**
 * GET /api/validate-vat?country=XX&vat=YYYY
 *
 * Server-side proxy for TaxID.dev VIES VAT verification.
 *
 * - Runs local format validation first (reuses existing vat.ts)
 * - Then calls TaxID.dev (server-only — API key never touches the browser)
 * - Caches results in-memory (24h active / 1h invalid) via the shared taxid util
 * - Basic per-IP rate limiting to prevent abuse as a free VAT validator
 */

import { NextRequest, NextResponse } from "next/server"
import { validateVatNumber } from "@/lib/util/vat"
import { verifyVatWithTaxID } from "@/lib/util/taxid"

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 10 // requests per window
const RATE_LIMIT_WINDOW_MS = 60_000 // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false
  }

  entry.count++
  return true
}

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  // Rate limit by IP
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { status: "service_unavailable", reason: "rate_limited" },
      { status: 429 }
    )
  }

  const { searchParams } = new URL(req.url)
  const country = searchParams.get("country") || ""
  const vat = searchParams.get("vat") || ""

  if (!country || !vat) {
    return NextResponse.json(
      { status: "invalid", reason: "missing_params" },
      { status: 400 }
    )
  }

  // Step 1 — local format validation (reuses existing utility)
  const formatError = validateVatNumber(country, vat)
  if (formatError) {
    return NextResponse.json({
      status: "invalid",
      reason: "format",
      message: formatError,
    })
  }

  // Step 2 — VIES verification via TaxID.dev
  const result = await verifyVatWithTaxID(country, vat)

  return NextResponse.json(result)
}
