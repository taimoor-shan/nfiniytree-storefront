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
import type { PostTemplateProps } from "./types"

/** Title and intro above the image, the text in a reading column. */
export default function StandardPost({
  post,
  dict,
  locale,
  market,
  related,
}: PostTemplateProps) {
  return (
    <article>
      <div className="content-container py-10 lg:py-16">
        <div className="mx-auto max-w-3xl">
          <Breadcrumbs post={post} dict={dict} />
          <header className="mb-8 flex flex-col gap-y-4">
            <CategoryChips post={post} />
            <h1
              className="font-display text-3xl leading-tight text-ink lg:text-5xl"
              data-testid="blog-post-title"
            >
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="text-lg leading-relaxed text-body lg:text-xl">
                {post.excerpt}
              </p>
            )}
            <PostMeta post={post} dict={dict} locale={locale} />
          </header>
          {post.featured_image && (
            <div className="relative mb-10 aspect-[16/9] overflow-hidden rounded-lg bg-surface-card">
              <FillImage
                src={post.featured_image}
                alt={post.featured_image_alt || post.title}
                sizes="(max-width: 767px) 100vw, 768px"
                eager
              />
            </div>
          )}
          <PostBody post={post} market={market} />
          <ShopCta dict={dict} />
          <BackToBlog dict={dict} />
        </div>
      </div>
      <RelatedPosts posts={related} dict={dict} locale={locale} />
    </article>
  )
}
