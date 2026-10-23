import Prose from "../components/prose"
import type { PageTemplateProps } from "./types"

/** One narrow column of text: terms, privacy and other legal pages. */
export default function NarrowPage({ page }: PageTemplateProps) {
  return (
    <div className="content-container py-16">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-2xl font-semibold text-ink">{page.title}</h1>
        <Prose html={page.content} title={page.title} />
      </div>
    </div>
  )
}
