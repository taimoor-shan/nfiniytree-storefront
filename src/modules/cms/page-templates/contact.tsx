import { getDictionary } from "@lib/i18n"
import ContactForm from "@modules/contact/components/contact-form"

import Prose from "../components/prose"
import type { PageTemplateProps } from "./types"

/** The page's text on the left and the contact form on the right. */
export default async function ContactPage({ page, locale }: PageTemplateProps) {
  const dict = await getDictionary(locale)

  return (
    <div className="content-container pb-14 pt-6 lg:py-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-16 lg:grid-cols-2">
        <div className="flex flex-col gap-y-8">
          <h1 className="font-display text-3xl text-ink">{page.title}</h1>
          {page.excerpt && (
            <p className="text-lg leading-relaxed text-body">{page.excerpt}</p>
          )}
          <Prose html={page.content} title={page.title} />
        </div>

        <div className="rounded-sm border border-hairline bg-canvas px-8 py-6 sm:px-10 sm:py-8">
          <h2 className="mb-6 font-display text-2xl">
            {dict["contact.sendMessage"]}
          </h2>
          <ContactForm />
        </div>
      </div>
    </div>
  )
}
