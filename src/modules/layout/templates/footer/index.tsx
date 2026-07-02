import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { retrieveStore } from "@lib/data/store"
import { clx } from "@medusajs/ui"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import NewsletterForm from "@modules/layout/components/newsletter-form"

export default async function Footer() {
  const store = await retrieveStore()
  const storeName = store?.name || "Infinytree"
  const { collections } = await listCollections({
    fields: "*products",
  })
  const productCategories = await listCategories()

  return (
    <footer className="border-t border-hairline w-full bg-surface-soft pb-8">
      <div className="pt-20 lg:grid lg:grid-cols-12 lg:grid-rows-[auto_auto] lg:gap-x-8 lg:pt-28 max-w-[1440px] mx-auto content-container">
        <div className="lg:mt-0 lg:col-span-4 lg:row-span-1">
          <LocalizedClientLink href="/" className="inline-flex items-center gap-3 text-3xl font-display text-ink hover:text-ink">
            <img src="/logo-full.png" alt="Logo" className="w-48 object-contain" />
            {/* <span>{storeName}</span> */}
          </LocalizedClientLink>
          <p className="text-base mb-2 mt-4 text-body">Stay updated on the latest from {storeName}</p>
          <NewsletterForm />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:col-span-4 lg:col-start-6 lg:row-span-full mt-12 lg:mt-0">
          <div className="grid grid-cols-2 gap-8 lg:gap-2">
            <div>
              <h3 className="text-lg md:text-xl text-ink mb-4">Shop</h3>
              <ul className="space-y-4">
                {collections?.slice(0, 6).map((c) => (
                  <li key={c.id}>
                    <LocalizedClientLink className="text-primary hover:underline underline-offset-4 text-md" href={`/collections/${c.handle}`}>
                      {c.title}
                    </LocalizedClientLink>
                  </li>
                ))}
                {productCategories?.slice(0, 6).map((c) => {
                    if (c.parent_category) return null;
                    return (
                        <li key={c.id}>
                            <LocalizedClientLink className="text-primary hover:underline underline-offset-4 text-md" href={`/categories/${c.handle}`}>
                                {c.name}
                            </LocalizedClientLink>
                        </li>
                    )
                })}
              </ul>
            </div>
            <div>
              <h3 className="text-lg md:text-xl text-ink mb-4">Company</h3>
              <ul className="space-y-4">
                {/* <li><LocalizedClientLink className="text-body hover:underline underline-offset-4 text-md" href="/policies/privacy">Privacy Policy</LocalizedClientLink></li> */}
                <li><LocalizedClientLink className="text-primary hover:underline underline-offset-4" href="/policies/returns">Returns & Refunds</LocalizedClientLink></li>
                <li><LocalizedClientLink className="text-primary hover:underline underline-offset-4 text-base" href="/policies/shipping">Shipping Policy</LocalizedClientLink></li>
                {/* <li><LocalizedClientLink className="text-body hover:underline underline-offset-4 text-md" href="/policies/terms">Terms & Conditions</LocalizedClientLink></li> */}
                <li><LocalizedClientLink className="text-primary hover:underline underline-offset-4 text-base" href="/policies/imprint">Imprint</LocalizedClientLink></li>
                <li><LocalizedClientLink className="text-primary hover:underline underline-offset-4 text-base" href="/contact">Contact</LocalizedClientLink></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center lg:items-start mt-12 lg:mt-0 max-w-full sm:max-w-[66%] lg:max-w-full text-center lg:text-left mx-auto lg:mx-0 lg:col-start-10 lg:col-span-3 lg:row-span-full">
          <LocalizedClientLink className="w-full" href="/store">
            <img 
              src="/footer-image.jpg" 
              alt={`${storeName} Collection`}
              className="w-full h-auto object-cover rounded-sm"
              loading="lazy"
            />
          </LocalizedClientLink>
        </div>

        <div className="mt-12 pt-8 lg:pt-0 lg:col-span-5 lg:row-start-2 lg:self-end">
          <ul className="flex space-x-6 items-center mb-8">
            <li>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:opacity-75 transition-opacity" aria-label="Facebook">
                <svg viewBox="0 0 11 22" fill="none" xmlns="http://www.w3.org/2000/svg" className="fill-current text-ink h-[24px] w-auto">
                  <path clipRule="evenodd" d="M7.32 21.667V10.999h2.947l.39-3.676H7.32l.005-1.84c0-.96.091-1.473 1.47-1.473h1.841V.333H7.69c-3.54 0-4.786 1.784-4.786 4.783v2.207H.696v3.676h2.207v10.668H7.32Z"></path>
                </svg>
              </a>
            </li>
            <li>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:opacity-75 transition-opacity" aria-label="Instagram">
                <svg viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" className="fill-current text-ink h-[24px] w-auto">
                  <path clipRule="evenodd" d="M11.012.333c-2.899 0-3.263.013-4.401.065C5.474.45 4.699.63 4.02.893a5.227 5.227 0 0 0-1.892 1.23 5.236 5.236 0 0 0-1.232 1.89C.633 4.69.452 5.466.401 6.602.351 7.739.337 8.103.337 11s.013 3.26.065 4.397c.052 1.136.232 1.91.495 2.589a5.226 5.226 0 0 0 1.232 1.89 5.227 5.227 0 0 0 1.89 1.23c.679.264 1.455.444 2.59.496 1.14.052 1.503.065 4.402.065s3.262-.013 4.4-.065c1.137-.052 1.913-.232 2.592-.495a5.223 5.223 0 0 0 1.89-1.232 5.234 5.234 0 0 0 1.232-1.889c.262-.678.442-1.454.496-2.589.05-1.137.064-1.5.064-4.397 0-2.897-.013-3.26-.064-4.398-.054-1.136-.234-1.91-.496-2.59a5.234 5.234 0 0 0-1.232-1.889 5.217 5.217 0 0 0-1.89-1.23C17.323.63 16.546.45 15.41.398 14.27.346 13.909.333 11.009.333h.003Zm-.974 1.78h.973c2.897 0 3.24.011 4.385.063 1.058.049 1.632.225 2.014.374.507.196.868.431 1.247.81.38.38.615.742.812 1.248.149.382.326.955.374 2.013.052 1.143.063 1.486.063 4.38 0 2.895-.011 3.238-.063 4.381-.049 1.057-.225 1.631-.374 2.013a3.352 3.352 0 0 1-.812 1.246c-.38.38-.74.614-1.247.81-.382.15-.956.326-2.014.375-1.144.052-1.488.063-4.385.063s-3.24-.011-4.384-.063c-1.058-.05-1.632-.226-2.015-.374a3.36 3.36 0 0 1-1.248-.811c-.38-.38-.615-.74-.812-1.247-.148-.382-.325-.955-.374-2.013-.052-1.143-.062-1.486-.062-4.382s.01-3.238.062-4.38c.049-1.058.226-1.632.374-2.014a3.36 3.36 0 0 1 .812-1.247c.38-.38.742-.615 1.248-.812.382-.15.957-.325 2.015-.374 1-.045 1.389-.059 3.41-.06v.002Zm6.755 1.776a1.334 1.334 0 1 0-.001 2.669 1.334 1.334 0 0 0 0-2.67v.001Zm-5.781 1.778A5.336 5.336 0 0 0 5.673 11a5.335 5.335 0 0 0 5.337 5.332 5.334 5.334 0 1 0 0-10.666Zm0 1.777A3.557 3.557 0 1 1 7.452 11a3.557 3.557 0 0 1 3.558-3.556Z"></path>
                </svg>
              </a>
            </li>
            <li>
              <a href="https://tiktok.com" target="_blank" rel="noreferrer" className="hover:opacity-75 transition-opacity" aria-label="TikTok">
                <svg viewBox="0 0 22 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="fill-current text-ink h-[24px] w-auto">
                  <path clipRule="evenodd" d="M21.774 5.667V9.8c-2.135 0-4.136-.667-5.87-1.867v8.4c0 4.134-3.47 7.6-7.74 7.6A8.162 8.162 0 0 1 3.763 22.6l-.267-.133c-1.868-1.334-3.069-3.6-3.069-6 0-4.134 3.469-7.6 7.739-7.6h1.067v4.266C8.965 13 8.565 13 8.165 13c-2.002 0-3.603 1.6-3.603 3.467 0 1.333.667 2.533 1.868 3.066.534.267 1.068.4 1.601.4 1.868 0 3.47-1.466 3.47-3.333V.067h4.136c0 .4 0 .666.133 1.066V1.4c.4 1.467 1.2 2.667 2.535 3.467l.267.133c1.2.4 2.135.667 3.202.667Z"></path>
                </svg>
              </a>
            </li>
            <li>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:opacity-75 transition-opacity" aria-label="Twitter">
                <svg viewBox="0 0 22 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="fill-current text-ink h-[22px] w-auto">
                  <path clipRule="evenodd" d="m10.747 4.8.046.763-.77-.093c-2.808-.358-5.26-1.572-7.343-3.61L1.662.848l-.262.747c-.556 1.665-.201 3.424.956 4.606.617.654.478.747-.586.358-.37-.124-.694-.217-.725-.17-.108.108.262 1.524.555 2.084.401.779 1.219 1.541 2.113 1.992l.756.358-.894.016c-.864 0-.895.015-.803.342.309 1.012 1.528 2.086 2.885 2.552l.956.327-.833.498a8.688 8.688 0 0 1-4.134 1.152c-.694.015-1.264.078-1.264.124 0 .156 1.881 1.027 2.977 1.37 3.285 1.011 7.188.575 10.118-1.152 2.083-1.23 4.165-3.672 5.137-6.038.525-1.26 1.049-3.564 1.049-4.668 0-.716.046-.81.91-1.666.51-.498.987-1.042 1.08-1.198.154-.296.139-.296-.648-.031-1.311.467-1.496.405-.848-.296.478-.498 1.049-1.4 1.049-1.665 0-.046-.232.031-.494.171-.278.156-.895.39-1.357.53l-.833.264-.756-.513c-.417-.28-1.003-.592-1.311-.685-.787-.218-1.99-.187-2.7.062-1.928.7-3.147 2.506-3.008 4.482Z"></path>
                </svg>
              </a>
            </li>
          </ul>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 text-xs text-muted">
            <p>© {new Date().getFullYear()} {storeName}. All rights reserved.</p>
            <LocalizedClientLink href="/policies/terms" className="hover:text-ink transition-colors">Terms and Conditions</LocalizedClientLink>
            <LocalizedClientLink href="/policies/privacy" className="hover:text-ink transition-colors">Privacy Policy</LocalizedClientLink>
          </div>
        </div>
      </div>
    </footer>
  )
}
