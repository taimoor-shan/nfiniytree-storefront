import Image from "next/image"

import {
  fullName,
  mailtoHref,
  telHref,
  vcardPath,
  whatsappHref,
  type BusinessCard,
} from "@lib/team/business-card"

import badge from "./infinytree-badge.jpg"

/** What the footer link says; it takes the visitor to the shop. */
const WEBSITE_LABEL = "www.infinytree.com"

const eyebrow =
  "font-sans text-[13px] font-medium uppercase leading-[1.75] tracking-[0.16em] text-muted"

const contactRow =
  "block break-words border-b border-hairline px-3 py-3.5 font-sans text-sm text-ink transition-colors hover:bg-surface-soft"

// Grows with the label instead of clipping it when the visitor's text is large.
const actionButton =
  "h-auto min-h-12 w-full px-2.5 py-3 text-center text-[13px] leading-tight"

type Props = {
  card: BusinessCard
  /** The shop's canonical address, without a trailing slash. */
  siteUrl: string
}

/**
 * A team member's digital business card: the page behind the printed QR code.
 * One cream card on the shop's paper background, written in German, mobile
 * first. The visitor can call, write, save the contact or open the shop.
 */
export default function BusinessCardTemplate({ card, siteUrl }: Props) {
  return (
    <main
      id="main"
      className="flex min-h-dvh items-center justify-center bg-[radial-gradient(ellipse_at_5%_5%,theme(colors.canvas),theme(colors.surface-cream-strong)_68%,theme(colors.hairline-strong))] px-4 py-8"
    >
      <article className="w-full max-w-[440px] border border-hairline-strong bg-canvas px-5 pb-7 pt-8 text-center shadow-xl shadow-ink/5 min-[400px]:px-7">
        <Image
          src={badge}
          alt="InfinYtree Logo"
          width={136}
          height={136}
          sizes="136px"
          quality={85}
          loading="eager"
          className="mx-auto mb-8 size-[8rem] rounded-full"
        />

        <p className={eyebrow}>Persönliche Beratung</p>
        <h1 className="my-2 text-[2rem] leading-[1.15] min-[360px]:text-[2.375rem]">
          {fullName(card)}
        </h1>
        <p className={eyebrow}>
          {/* {card.role}
          <br /> */}
          {card.place.join(" · ")}
        </p>

        <hr className="mx-auto my-6 h-px w-14 border-0 bg-hairline-strong" />

        <ul className="mb-8  grid">
          <li>
            <a href={telHref(card)} className={contactRow}>
              <span className="sr-only">Anrufen: </span>
              {card.phoneDisplay}
            </a>
          </li>
          <li>
            <a href={mailtoHref(card)} className={contactRow}>
              <span className="sr-only">E-Mail senden: </span>
              {card.email}
            </a>
          </li>
        </ul>

        <div className="grid gap-3 min-[351px]:grid-cols-2">
          {/* A plain link, not next/link: it points at a file, not a page. */}
          <a href={vcardPath(card)} className={`btn-primary ${actionButton}`}>
            Kontakt speichern
          </a>
          <a
            href={whatsappHref(card)}
            target="_blank"
            rel="noopener noreferrer"
            className={`btn-secondary gap-2 border-hairline-strong ${actionButton}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#22c55e"><path fill="#22c55e" d="M16.6 14c-.2-.1-1.5-.7-1.7-.8c-.2-.1-.4-.1-.6.1c-.2.2-.6.8-.8 1c-.1.2-.3.2-.5.1c-.7-.3-1.4-.7-2-1.2c-.5-.5-1-1.1-1.4-1.7c-.1-.2 0-.4.1-.5c.1-.1.2-.3.4-.4c.1-.1.2-.3.2-.4c.1-.1.1-.3 0-.4c-.1-.1-.6-1.3-.8-1.8c-.1-.7-.3-.7-.5-.7h-.5c-.2 0-.5.2-.6.3c-.6.6-.9 1.3-.9 2.1c.1.9.4 1.8 1 2.6c1.1 1.6 2.5 2.9 4.2 3.7c.5.2.9.4 1.4.5c.5.2 1 .2 1.6.1c.7-.1 1.3-.6 1.7-1.2c.2-.4.2-.8.1-1.2l-.4-.2m2.5-9.1C15.2 1 8.9 1 5 4.9c-3.2 3.2-3.8 8.1-1.6 12L2 22l5.3-1.4c1.5.8 3.1 1.2 4.7 1.2c5.5 0 9.9-4.4 9.9-9.9c.1-2.6-1-5.1-2.8-7m-2.7 14c-1.3.8-2.8 1.3-4.4 1.3c-1.5 0-2.9-.4-4.2-1.1l-.3-.2l-3.1.8l.8-3l-.2-.3c-2.4-4-1.2-9 2.7-11.5S16.6 3.7 19 7.5c2.4 3.9 1.3 9-2.6 11.4"/></svg>
            WhatsApp
          </a>
        </div>

        <a
          href={siteUrl}
          className="mt-5 inline-block px-3 py-3.5 font-sans text-xs uppercase tracking-[0.15em] text-muted transition-colors hover:text-ink"
        >
          {WEBSITE_LABEL}
        </a>
      </article>
    </main>
  )
}
