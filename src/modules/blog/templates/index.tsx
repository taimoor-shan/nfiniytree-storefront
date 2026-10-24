import { Suspense } from "react"

import type { BlogCategory } from "@/types/blog"
import type { Dictionary } from "@lib/i18n"
import { listBlogCategories } from "@lib/data/blog"
import { toParagraphs } from "@lib/util/category-seo"

import CategoryNav from "../components/category-nav"
import PaginatedPosts from "./paginated-posts"

const PostGridSkeleton = () => (
  <ul
    className="grid w-full grid-cols-1 gap-x-6 gap-y-10 xsmall:grid-cols-2 small:grid-cols-3"
    aria-hidden="true"
  >
    {Array.from({ length: 6 }, (_, index) => (
      <li key={index} className="animate-pulse">
        <div className="aspect-[16/10] rounded-lg bg-surface-card" />
        <div className="mt-4 h-3 w-1/4 rounded bg-surface-card" />
        <div className="mt-3 h-6 w-4/5 rounded bg-surface-card" />
        <div className="mt-3 h-4 w-full rounded bg-surface-card" />
      </li>
    ))}
  </ul>
)

/** The blog's front page, and a category's page when `category` is given. */
export default async function BlogListTemplate({
  dict,
  locale,
  page,
  category,
}: {
  dict: Dictionary
  locale: string
  page: number
  category?: BlogCategory
}) {
  const categories = await listBlogCategories(locale)

  return (
    <div
      className="content-container py-10 lg:py-16"
      data-testid="blog-container"
    >
      <header className="mb-8 max-w-3xl">
        <h1
          className="mb-4 font-display text-3xl leading-tight text-ink lg:text-[2.75rem]"
          data-testid="blog-page-title"
        >
          {category ? category.name : dict["blog.title"]}
        </h1>
        {category ? (
          category.description && (
            <div
              className="flex flex-col gap-3 text-lg leading-relaxed text-body"
              data-testid="blog-category-description"
            >
              {toParagraphs(category.description).map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          )
        ) : (
          <p className="text-lg leading-relaxed text-body">
            {dict["blog.subtitle"]}
          </p>
        )}
      </header>

      <CategoryNav
        categories={categories}
        activeHandle={category?.handle}
        allLabel={dict["blog.allPosts"]}
        ariaLabel={dict["blog.categories"]}
      />

      <Suspense fallback={<PostGridSkeleton />}>
        <PaginatedPosts
          page={page}
          category={category?.handle}
          locale={locale}
          dict={dict}
        />
      </Suspense>
    </div>
  )
}
