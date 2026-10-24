import FillImage from "@modules/common/components/fill-image"

import Prose from "../components/prose"
import type { PageTemplateProps } from "./types"

/** Title, intro, image and text in one centered column. */
export default function DefaultPage({ page }: PageTemplateProps) {
  return (
    <div className="content-container py-12 lg:py-20">
      <div className="mx-auto flex max-w-3xl flex-col gap-y-8">
        <header className="flex flex-col gap-y-3">
          <h1 className="font-display text-3xl leading-tight text-ink lg:text-[2.75rem]">
            {page.title}
          </h1>
          {page.excerpt && (
            <p className="text-lg leading-relaxed text-body">{page.excerpt}</p>
          )}
        </header>
        {page.featured_image && (
          <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-surface-card">
            <FillImage
              src={page.featured_image}
              alt={page.title}
              sizes="(max-width: 767px) 100vw, 768px"
              eager
            />
          </div>
        )}
        <Prose html={page.content} title={page.title} />
      </div>
    </div>
  )
}
