import FillImage from "@modules/common/components/fill-image"

import Prose from "../components/prose"
import type { PageTemplateProps } from "./types"

/**
 * The featured image fills the top with the title over it, then the text. With
 * no image the title is centered on the page instead.
 */
export default function HeroPage({ page }: PageTemplateProps) {
  return (
    <div>
      {page.featured_image ? (
        <section className="relative h-[55vh] min-h-[380px] w-full overflow-hidden">
          <FillImage
            src={page.featured_image}
            alt={page.title}
            sizes="100vw"
            eager
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/20" />
          <div className="absolute inset-0 flex flex-col justify-end pb-16">
            <div className="content-container">
              <div className="max-w-3xl">
                <h1 className="mb-4 font-display text-3xl leading-tight text-on-dark lg:text-5xl">
                  {page.title}
                </h1>
                {page.excerpt && (
                  <p className="max-w-xl text-lg leading-relaxed text-on-dark/80">
                    {page.excerpt}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="pb-8 pt-20 lg:pb-12 lg:pt-28">
          <div className="content-container text-center">
            <h1 className="mb-4 font-display text-3xl leading-tight text-ink lg:text-5xl">
              {page.title}
            </h1>
            {page.excerpt && (
              <p className="mx-auto max-w-xl text-lg leading-relaxed text-body">
                {page.excerpt}
              </p>
            )}
          </div>
        </section>
      )}

      {page.content && (
        <section className="content-container py-12 lg:py-20">
          <div className="mx-auto max-w-3xl">
            <Prose html={page.content} title={page.title} />
          </div>
        </section>
      )}
    </div>
  )
}
