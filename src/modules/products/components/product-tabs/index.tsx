"use client"

import { useState, useEffect } from "react"
import { HttpTypes } from "@medusajs/types"
import { ArrowLeftRight, ArrowUpDown, Move3d } from "lucide-react"
import { isSimpleProduct } from "@lib/util/product"
import { useTranslation } from "@lib/i18n/client"
import { getLocalizedMetadata } from "@lib/i18n/metadata"

type ProductTabsProps = {
  product: HttpTypes.StoreProduct
  /**
   * Locale for metadata resolution, provided by the server so SSR and
   * the client agree on the first render.  Falls back to cookie-based
   * detection when not passed.
   */
  locale?: string
}

/** Read the _medusa_locale cookie client-side. */
function getLocaleFromCookie(): string {
  if (typeof document === "undefined") return "en"
  const match = document.cookie.match(/(?:^|;\s*)_medusa_locale=([^;]*)/)
  return match ? decodeURIComponent(match[1]) || "en" : "en"
}

const ProductTabs = ({ product, locale: localeProp }: ProductTabsProps) => {
  const { t } = useTranslation()

  // Use the server-provided locale during SSR/hydration so the rendered
  // tree matches.  The state is kept mutable so locale-change events
  // (dispatched by the language switcher) trigger a re-render.
  const [locale, setLocale] = useState<string>(
    () => localeProp || getLocaleFromCookie()
  )

  // Sync with the cookie on mount (handles the edge case where the
  // cookie changes between SSR and hydration, e.g. a very slow page).
  useEffect(() => {
    const cookieLocale = getLocaleFromCookie()
    if (cookieLocale !== "en" && cookieLocale !== locale) {
      setLocale(cookieLocale)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep the state in sync when the prop changes (e.g. client-side
  // navigation between products with different locale props).
  useEffect(() => {
    if (localeProp !== undefined) setLocale(localeProp)
  }, [localeProp])

  // React to locale changes from the language switcher.
  useEffect(() => {
    const handler = () => setLocale(getLocaleFromCookie())
    document.addEventListener("localechange", handler)
    return () => document.removeEventListener("localechange", handler)
  }, [])

  // Resolve locale-aware metadata once with the definitive locale.
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
        : `[${keyFeaturesRaw}]`;
      const parsed = JSON.parse(wrapped);
      if (Array.isArray(parsed)) {
        parsedKeyFeatures = parsed;
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
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        parsedPot = parsed
      }
    } catch (e) {
      // Not valid JSON, ignore
    }
  }

  const sections: { label: string; component: React.ReactNode }[] = []

  sections.push({
    label: t("product.specifications"),
    component: (
      <SpecificationsTab
        product={product}
        pot={parsedPot}
        isConfigured={!isSimpleProduct(product)}
      />
    ),
  })

  if (parsedKeyFeatures.length > 0) {
    sections.push({
      label: t("product.keyFeatures"),
      component: <KeyFeaturesTab features={parsedKeyFeatures} />,
    })
  }

  if (care) {
    sections.push({
      label: t("product.maintenanceCare"),
      component: <CareTab instructions={care} />,
    })
  }

  if (sections.length === 0) return null

  return (
    <div className="w-full divide-y divide-ui-border-base border-y border-hairline">
      {sections.map((section, i) => (
        <div key={i}>
          <h2 className="pt-4 text-2xl font-medium text-ink">
            {section.label}
          </h2>
          {section.component}
        </div>
      ))}
    </div>
  )
}

const KeyFeaturesTab = ({ features }: { features: string[] }) => {
  return (
    <div className="text-sm py-4">
      <ul className="list-disc pl-4 flex flex-col gap-y-2 marker:text-primary">
        {features.map((feature, i) => (
          <li key={i} className="text-body text-base">
            {feature}
          </li>
        ))}
      </ul>
    </div>
  )
}

const CareTab = ({ instructions }: { instructions: string }) => {
  return (
    <div className=" py-4">
      <p className="text-base leading-loose">{instructions}</p>
    </div>
  )
}



type SpecificationsTabProps = {
  product: HttpTypes.StoreProduct
  pot?: Record<string, any>
  isConfigured?: boolean
}

const SpecificationsTab = ({ product, pot, isConfigured }: SpecificationsTabProps) => {
  const { t } = useTranslation()

  // Dimension icons keyed by translation key
  const dimensionIcons: Record<string, React.ReactNode> = {
    [t("product.height")]: <ArrowUpDown className="h-8 w-8" />,
    [t("product.width")]: <ArrowLeftRight className="h-8 w-8" />,
    [t("product.depth")]: <Move3d className="h-8 w-8" />,
  }

  // Build tree specs from native Medusa fields
  const treeSpecs: Record<string, string> = {}

  if (product.height) {
    treeSpecs[t("product.height")] = `${product.height}`
  }
  if (product.width) {
    treeSpecs[t("product.width")] = `${product.width}`
  }
  if (product.length) {
    treeSpecs[t("product.depth")] = `${product.length}`
  }

  if (product.weight) {
    treeSpecs[t("product.weight")] = `${product.weight} g`
  }
  if (product.material) {
    treeSpecs[t("product.material")] = product.material
  }
  if (product.origin_country) {
    treeSpecs[t("product.countryOfOrigin")] = product.origin_country
  }

  // Build pot specs from metadata.pot
  const potSpecs: Record<string, string> = {}
  if (pot) {
    const unit = pot.unit || "cm"
    
    // Combine width and depth into Size if both exist
    if (pot.width && pot.depth) {
      potSpecs["Size"] = `${pot.width} ${unit} × ${pot.depth} ${unit}`
    } else {
      if (pot.width) potSpecs["Width"] = `${pot.width} ${unit}`
      if (pot.depth) potSpecs["Depth"] = `${pot.depth} ${unit}`
    }

    if (pot.height) {
      potSpecs["Height"] = `${pot.height} ${unit}`
    }
    if (pot.material) {
      potSpecs["Material"] = pot.material
    }
    if (pot.finish) {
      potSpecs["Finish"] = pot.finish
    }
    if (pot.care) {
      potSpecs["Care"] = pot.care
    }
  }

  const hasTreeSpecs = Object.keys(treeSpecs).length > 0
  const hasPotSpecs = Object.keys(potSpecs).length > 0

  return (
    <div className="text-base py-4">
      {/* Tree specifications */}
      {hasTreeSpecs && (
        <div>
          {hasPotSpecs && (
            <span className="font-semibold text-primary text-base mb-4 block">
              {t("product.treeIncludingPot")}
            </span>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4 text-sm">
            {Object.entries(treeSpecs).map(([key, value], i) => (
              <div key={i} className="flex gap-x-2 items-center">
                 {dimensionIcons[key]}
                  <div key={i} className="flex flex-col gap-y-1">
                <span className="font-semibold text-ink flex items-center gap-x-1.5">
                 
                  {key}
                </span>
                
                <p className="text-body">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pot specifications */}
      {hasPotSpecs && (
        <div className={hasTreeSpecs ? "mt-8 pt-8 border-t border-hairline" : ""}>
          <span className="font-semibold text-primary text-base mb-4 block">
            {pot.size ? `${t("product.potOnly")} (${pot.size})` : t("product.potOnly")}
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4 text-sm">
            {Object.entries(potSpecs).map(([key, value], i) => (
              <div key={i} className="flex flex-col gap-y-1">
                <span className="font-semibold text-ink">{key}</span>
                <p className="text-body text-base">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasTreeSpecs && !hasPotSpecs && (
        <p className="text-muted">{t("product.noSpecifications")}</p>
      )}

      {/* {isConfigured && <WithdrawalNotice variant="inline" />} */}
    </div>
  )
}

export default ProductTabs
