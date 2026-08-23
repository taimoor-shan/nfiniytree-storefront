"use client"

import { Sparkles, Droplets, TreePine, Building2 } from "lucide-react"
import { useTranslation } from "@lib/i18n/client"

type FeaturesProps = {
  /** Category name — when provided, replaces the first feature's title. */
  categoryName?: string
  /** Category description — when provided, replaces the first feature's description. */
  categoryDescription?: string
}

const Features = ({ categoryName, categoryDescription }: FeaturesProps) => {
  const { t } = useTranslation()

  const features = [
    {
      icon: Sparkles,
      title: categoryName || t("features.oneOfAKind.title"),
      description: categoryDescription || t("features.oneOfAKind.description"),
    },
    {
      icon: Droplets,
      title: t("features.maintenanceFree.title"),
      description: t("features.maintenanceFree.description"),
    },
    {
      icon: TreePine,
      title: t("features.authenticMaterials.title"),
      description: t("features.authenticMaterials.description"),
    },
    {
      icon: Building2,
      title: t("features.luxurySpaces.title"),
      description: t("features.luxurySpaces.description"),
    },
  ]

  return (
    <section className="content-container pt-16 lg:pt-24">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
        {features.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-surface-card flex items-center justify-center">
              {/* Decorative. The heading below carries the meaning; lucide
                  renders an <svg> with no title, so without this a screen
                  reader announces an unlabelled graphic before every feature. */}
              <Icon size={24} className="text-ink" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-semibold text-ink">{title}</h3>
            <p className="text-sm text-body leading-relaxed">{description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Features
