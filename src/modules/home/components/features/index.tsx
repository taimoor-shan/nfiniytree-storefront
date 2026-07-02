import { Sparkles, Droplets, TreePine, Building2 } from "lucide-react"

const features = [
  {
    icon: Sparkles,
    title: "One of a Kind",
    description:
      "Every piece is individually handcrafted — a unique 1/1 creation, never exactly replicated.",
  },
  {
    icon: Droplets,
    title: "Maintenance-Free",
    description:
      "No watering, no sun, no care. Hypoallergenic and free from pollen, mold, and allergens.",
  },
  {
    icon: TreePine,
    title: "Authentic Materials",
    description:
      "Real wood trunks, premium artificial foliage, and luxury designer pots for lasting sophistication.",
  },
  {
    icon: Building2,
    title: "Luxury Spaces",
    description:
      "Designed for hotels, villas, boutiques, offices, and exclusive interiors worldwide.",
  },
]

const Features = () => {
  return (
    <section className="content-container pt-16 lg:pt-24">
      {/* <h2 className="text-2xl lg:text-3xl font-display text-center text-ink mb-12">
        The Infinytree Promise
      </h2> */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
        {features.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-surface-card flex items-center justify-center">
              <Icon size={24} className="text-ink" />
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
