import type { CmsPage } from "@/types/cms"

/** What every page layout receives. */
export type PageTemplateProps = {
  page: CmsPage
  /** The visitor's language, for text the layout adds around the page. */
  locale: string
}
