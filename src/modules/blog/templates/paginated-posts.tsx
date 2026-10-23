import type { Dictionary } from "@lib/i18n"
import { listBlogPosts } from "@lib/data/blog"
import { Pagination } from "@modules/store/components/pagination"

import PostCard from "../components/post-card"

export const POSTS_PER_PAGE = 12

export default async function PaginatedPosts({
  page,
  category,
  locale,
  dict,
}: {
  page: number
  /** Category handle; all posts when omitted. */
  category?: string
  locale: string
  dict: Dictionary
}) {
  const { posts, count } = await listBlogPosts({
    locale,
    category,
    limit: POSTS_PER_PAGE,
    offset: (page - 1) * POSTS_PER_PAGE,
  })

  if (!posts.length) {
    return (
      <p className="text-body" data-testid="blog-empty">
        {dict["blog.noPosts"]}
      </p>
    )
  }

  const totalPages = Math.ceil(count / POSTS_PER_PAGE)

  return (
    <>
      <ul
        className="grid w-full grid-cols-1 gap-x-6 gap-y-10 xsmall:grid-cols-2 small:grid-cols-3"
        data-testid="blog-posts-list"
      >
        {posts.map((post, index) => (
          <li key={post.id}>
            {/* The first row is above the fold at every width. */}
            <PostCard
              post={post}
              dict={dict}
              locale={locale}
              eager={index < 3}
            />
          </li>
        ))}
      </ul>
      {totalPages > 1 && (
        <Pagination
          data-testid="blog-pagination"
          page={page}
          totalPages={totalPages}
        />
      )}
    </>
  )
}
