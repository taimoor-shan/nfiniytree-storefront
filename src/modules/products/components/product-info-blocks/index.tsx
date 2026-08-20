"use client"

import { useState, useEffect } from "react"
import { HttpTypes } from "@medusajs/types"
import {
  getLocalizedMetadata,
  resolvePotLabel,
  resolvePotSpecs,
  resolveSpecField,
} from "@lib/i18n/metadata"
import { useTranslation } from "@/lib/i18n"

type ProductInfoBlocksProps = {
  product: HttpTypes.StoreProduct
  /** Locale for metadata resolution, provided by the server. */
  locale?: string
}

function getLocaleFromCookie(): string {
  if (typeof document === "undefined") return "en"
  const match = document.cookie.match(/(?:^|;\s*)_medusa_locale=([^;]*)/)
  return match ? decodeURIComponent(match[1]) || "en" : "en"
}

const ProductInfoBlocks = ({ product, locale: localeProp }: ProductInfoBlocksProps) => {
  // Use the server-provided locale during SSR/hydration so the rendered
  // tree matches.  Falls back to cookie detection when no prop is given.
  const [locale, setLocale] = useState<string>(
    () => localeProp || getLocaleFromCookie()
  )

  useEffect(() => {
    const cookieLocale = getLocaleFromCookie()
    if (cookieLocale !== "en" && cookieLocale !== locale) {
      setLocale(cookieLocale)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (localeProp !== undefined) setLocale(localeProp)
  }, [localeProp])

  const { t } = useTranslation()

  useEffect(() => {
    const handler = () => setLocale(getLocaleFromCookie())
    document.addEventListener("localechange", handler)
    return () => document.removeEventListener("localechange", handler)
  }, [])

  const rawMetadata = (product.metadata as Record<string, any>) || {}
  const metadata = getLocalizedMetadata(rawMetadata, locale)

  const keyFeaturesRaw = metadata?.key_features
  let parsedKeyFeatures: string[] = []

  if (Array.isArray(keyFeaturesRaw)) {
    parsedKeyFeatures = keyFeaturesRaw
  } else if (typeof keyFeaturesRaw === "string") {
    try {
      const wrapped = keyFeaturesRaw.trim().startsWith("[")
        ? keyFeaturesRaw
        : `[${keyFeaturesRaw}]`
      const parsed = JSON.parse(wrapped)
      if (Array.isArray(parsed)) {
        parsedKeyFeatures = parsed
      }
    } catch (e) {
      parsedKeyFeatures = keyFeaturesRaw
        .split(/\n|,(?=\s*")/)
        .map((s) => s.replace(/^"|"$/g, "").trim())
        .filter((s) => s.length > 0)
    }
  }

  const care = metadata?.care_instructions as string | undefined

  const potRaw = metadata?.pot
  let parsedPot: Record<string, any> | undefined = undefined
  if (typeof potRaw === "object" && potRaw !== null && !Array.isArray(potRaw)) {
    parsedPot = potRaw
  } else if (typeof potRaw === "string") {
    try {
      const parsed = JSON.parse(potRaw)
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        !Array.isArray(parsed)
      ) {
        parsedPot = parsed
      }
    } catch (e) {
      // Not valid JSON, ignore
    }
  }

  // Build tree specs (labels are managed by the backend)
  const treeSpecs: Record<string, string> = {}
  if (product.height) treeSpecs["Height"] = `${product.height}`
  if (product.width) treeSpecs["Width"] = `${product.width}`
  if (product.length) treeSpecs["Depth"] = `${product.length}`
  if (product.weight) treeSpecs["Weight"] = `${product.weight} g`
  if (product.material) treeSpecs["Material"] = product.material
  if (product.origin_country)
    treeSpecs["Country of origin"] = product.origin_country

  // Build pot specs — backend-provided labels are used as-is; fields
  // without a label fall back to the translated field key.
  const potSpecs = resolvePotSpecs(parsedPot, (label) => resolvePotLabel(t, label))
  const potSize = resolveSpecField(parsedPot?.size, "Size")?.value

  const hasKeyFeatures = parsedKeyFeatures.length > 0
  const hasCare = Boolean(care)
  const hasTreeSpecs = Object.keys(treeSpecs).length > 0
  const hasPotSpecs = potSpecs.length > 0

  return (
    <div className="flex flex-col small:flex-row gap-x-12 gap-y-8">
      {/* Key Features */}
      {hasKeyFeatures && (
        <div className="flex-1">
          <h3 className="font-semibold text-primary text-base mb-4">
            {t("product.keyFeatures")}
          </h3>
          <ul className="list-disc pl-4 flex flex-col gap-y-2 marker:text-primary text-sm text-body">
            {parsedKeyFeatures.map((feature, i) => (
              <li key={i}>{feature}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Specifications */}
      {(hasTreeSpecs || hasPotSpecs) && (
        <div className="flex-1">
          <h3 className="font-semibold text-primary text-base mb-4">
            {t("product.specifications")}
          </h3>
          {hasTreeSpecs && (
            <div>
              {hasPotSpecs && (
                <span className="font-semibold text-ink text-sm block mb-2">
                  {t("product.treeIncludingPot")}
                </span>
              )}
              <div className="flex flex-col gap-y-2 text-sm">
                {Object.entries(treeSpecs).map(([key, value], i) => (
                  <div key={i} className="flex gap-x-2">
                    <span className="font-semibold text-ink">
                      {key}:
                    </span>
                    <span className="text-body">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {hasPotSpecs && (
            <div className={hasTreeSpecs ? "mt-4 pt-4 border-t border-hairline" : ""}>
              <span className="font-semibold text-ink text-sm block mb-2">
                {potSize ? `${t("product.potOnly")} (${potSize})` : t("product.potOnly")}
              </span>
              <div className="flex flex-col gap-y-2 text-sm">
                {potSpecs.map((spec, i) => (
                  <div key={i} className="flex gap-x-2">
                    <span className="font-semibold text-ink">
                      {spec.label}:
                    </span>
                    <span className="text-body">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Maintenance & Care */}
      {hasCare && (
        <div className="flex-1">
          <h3 className="font-semibold text-primary text-base mb-4">
            {t("product.maintenanceCare")}
          </h3>
          <p className="text-sm text-body leading-loose">{care}</p>
        </div>
      )}
    </div>
  )
}

export default ProductInfoBlocks
