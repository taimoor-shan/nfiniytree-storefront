import { NextResponse } from "next/server"
import type { ConsentRecord } from "@/components/cookie-consent"

/**
 * Consent traceability endpoint.
 *
 * OpenConsent posts a ConsentRecord here after the visitor answers the cookie
 * banner. The record is `src/components/cookie-consent/types.ts →
 * ConsentRecord` (visitorId, consentId, consentVersion, categories, action,
 * timestamp, expiresAt, url, language, scope, …).
 *
 * Persistence is intentionally left to the deployment (Supabase/Postgres is
 * the pattern in the OpenConsent docs): this route currently validates the
 * payload and acknowledges it, logging the record in development. Wire your
 * backend of choice into the block below.
 */
export async function POST(request: Request) {
  try {
    const record = (await request.json()) as Partial<ConsentRecord>

    // Minimal validation — required fields for a usable audit trail.
    if (
      !record.visitorId ||
      !record.consentId ||
      !record.consentVersion ||
      !record.categories ||
      !record.action ||
      !record.timestamp
    ) {
      return NextResponse.json(
        { error: "Invalid consent record: missing required fields" },
        { status: 400 }
      )
    }

    if (process.env.NODE_ENV === "development") {
      console.log("[consent]", JSON.stringify(record, null, 2))
    }

    // TODO(deployment): persist the record, e.g.
    //   INSERT INTO consent_records (...) VALUES (...);

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Invalid JSON body",
      },
      { status: 400 }
    )
  }
}
