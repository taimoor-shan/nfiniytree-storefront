"use client"

import { Button, Heading } from "@medusajs/ui"
import { ChevronDown } from "lucide-react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useTranslation } from "@lib/i18n/client"
import Image from "next/image"

type HeroProps = {
  page?: {
    title: string
    excerpt?: string | null
    featured_image?: string | null
  } | null
}

const Hero = ({ page }: HeroProps) => {
  const { t } = useTranslation()
  const title = page?.title || t("hero.fallbackTitle")
  const excerpt = page?.excerpt || t("hero.fallbackExcerpt")

  const backgroundImage = page?.featured_image
    ? `url(${page.featured_image})`
    : undefined

  return (
    <div
      className="h-[600px] lg:h-[calc(100vh-125px)] w-full border-b border-hairline relative bg-surface-card bg-center bg-cover flex items-end justify-center px-6 sm:px-28"
      style={backgroundImage ? { backgroundImage } : undefined}
    >
       {/* <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent pointer-events-none" /> */}
      {/* <Image
          src="/logo.png"
          alt="Logo"
          width={250}
          height={250}
          className="object-contain absolute top-28 left-1/2 -translate-x-1/2"
        /> */}
      <div className="z-10 text-center gap-6 max-w-xl mx-auto flex flex-col items-center mb-8">
        
        <span className="text-center">
          <Heading
            level="h1"
            className="lg:text-5xl text-3xl text-ink mb-5 font-serif text-white font-normal leading-tight"
          >
            {title}
          </Heading>
          <Heading
            level="h2"
            className="text-lg font-normal text-white max-w-lg mx-auto"
          >
            {excerpt}
          </Heading>
        </span>
        <LocalizedClientLink href="/store" passHref>
          <Button size="large" className="mt-2">
            Shop the collection
          </Button>
        </LocalizedClientLink>
      </div>
      {/* <button
        className="absolute bottom-0 left-1/2 -translate-x-1/2 z-20 text-on-dark hover:text-on-dark transition-all duration-1000 animate-bounce"
        onClick={() => {
          window.scrollTo({
            top: window.innerHeight * 0.95,
            behavior: "smooth",
          })
        }}
        aria-label={t("hero.scrollDown")}
      >
        <ChevronDown size={32} />
      </button> */}
    </div>
  )
}

export default Hero
