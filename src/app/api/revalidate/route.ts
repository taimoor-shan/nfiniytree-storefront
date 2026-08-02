import { revalidateTag } from "next/cache"
import { NextRequest } from "next/server"

import { CACHE_TAGS } from "@lib/data/cache"

/** Set of valid tag values for runtime validation. */
const VALID_TAGS: ReadonlySet<string> = new Set(Object.values(CACHE_TAGS))

/**
 * POST /api/revalidate
 *
 * Called by the Medusa backend (via subscriber or admin API route) to
 * invalidate storefront caches after content changes.
 *
 * Requires the `x-revalidate-secret` header to match the shared
 * `REVALIDATION_SECRET` environment variable.
 *
 * Body: `{ "tags": ["locales", "pages"] }`
 *
 * Only tags listed in `CACHE_TAGS` are accepted — arbitrary tags are
 * silently ignored to prevent abuse.
 */
export async function POST(request: NextRequest): Promise<Response> {
  const secret = request.headers.get("x-revalidate-secret")

  if (!secret || secret !== process.env.REVALIDATION_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  let tags: string[] = []

  try {
    const body = (await request.json()) as { tags?: string[] }
    tags = Array.isArray(body.tags) ? body.tags : []
  } catch {
    return Response.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    )
  }

  const revalidated: string[] = []
  const skipped: string[] = []

  for (const tag of tags) {
    if (VALID_TAGS.has(tag)) {
      // "max" profile = immediate expiration (Next.js 15.3+ requires 2nd arg)
      revalidateTag(tag, "max")
      revalidated.push(tag)
    } else {
      skipped.push(tag)
    }
  }

  return Response.json({
    revalidated,
    skipped,
    message:
      revalidated.length > 0
        ? `Revalidated: ${revalidated.join(", ")}`
        : "No valid tags provided",
  })
}
