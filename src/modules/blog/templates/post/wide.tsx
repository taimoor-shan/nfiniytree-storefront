import FillImage from "@modules/common/components/fill-image"
import {
  BackToBlog,
  Breadcrumbs,
  CategoryChips,
  PostBody,
  PostMeta,
  RelatedPosts,
  ShopCta,
} from "../../components/post-parts"
import StandardPost from "./standard"
import type { PostTemplateProps } from "./types"

/**
 * A full-width image across the top with the title over it, then the text.
 * Without a featured image there is nothing to put the title over, so it falls
 * back to the standard layout.
 */
export default function WidePost(props: PostTemplateProps) {
  const { post, dict, locale, related } = props

  if (!post.featured_image) {
    return <StandardPost {...props} />
  }

  return (
    <article>
      <header className="relative h-[55vh] min-h-[380px] w-full overflow-hidden">
        <FillImage
          src={post.featured_image}
          alt={post.featured_image_alt || post.title}
          sizes="100vw"
          eager
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/20" />
        <div className="absolute inset-0 flex flex-col justify-end pb-12 lg:pb-16">
          <div className="content-container">
            <div className="flex max-w-3xl flex-col gap-y-4">
              <CategoryChips post={post} />
              <h1
                className="font-display text-3xl leading-tight text-on-dark lg:text-5xl"
                data-testid="blog-post-title"
              >
                {post.title}
              </h1>
              {post.excerpt && (
                <p className="max-w-xl text-lg leading-relaxed text-on-dark/80">
                  {post.excerpt}
                </p>
              )}
              <PostMeta post={post} dict={dict} locale={locale} onDark />
            </div>
          </div>
        </div>
      </header>
      <div className="content-container py-10 lg:py-16">
        <div className="mx-auto max-w-3xl">
          <Breadcrumbs post={post} dict={dict} />
          <PostBody post={post} />
          <ShopCta dict={dict} />
          <BackToBlog dict={dict} />
        </div>
      </div>
      <RelatedPosts posts={related} dict={dict} locale={locale} />
    </article>
  )
}
