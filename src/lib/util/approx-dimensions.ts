/**
 * Approximate dimensions of a piece, for the ones whose size is a range
 * ("160–180") rather than the single number of Medusa's height, width and
 * length fields. Kept in the product's metadata as `approx_dimensions`:
 *
 *   {"height": "160–180", "width": "140–170", "depth": "80–100", "unit": "cm"}
 *
 * The admin's metadata editor stores that as JSON text; `getLocalizedMetadata`
 * parses it before it gets here, so an object is what arrives.
 */
export type ApproxDimensions = {
  height?: string
  width?: string
  depth?: string
  unit: string
}

const asText = (value: unknown): string | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) return String(value)
  if (typeof value !== "string") return undefined
  return value.trim() || undefined
}

export function parseApproxDimensions(value: unknown): ApproxDimensions | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null
  }

  const source = value as Record<string, unknown>
  const dimensions: ApproxDimensions = {
    height: asText(source.height),
    width: asText(source.width),
    depth: asText(source.depth),
    unit: asText(source.unit) ?? "cm",
  }

  return dimensions.height || dimensions.width || dimensions.depth
    ? dimensions
    : null
}

/**
 * What a spec row shows: the exact figure when the product has one (its
 * height, width or length field), otherwise the range marked as approximate.
 * `approxLabel` is the translated "approx.".
 */
export function formatDimension({
  exact,
  range,
  unit,
  approxLabel,
}: {
  exact?: number | null
  range?: string
  unit: string
  approxLabel: string
}): { text: string; approximate: boolean } | null {
  if (exact) return { text: `${exact} ${unit}`, approximate: false }
  if (range) return { text: `${approxLabel} ${range} ${unit}`, approximate: true }
  return null
}
