import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import { cookies } from "next/headers"
import "styles/globals.css"
import { Gelasio, Fraunces, DM_Sans, Inter, Bodoni_Moda } from "next/font/google"
import { getDictionary } from "@lib/i18n/dictionaries"
import { LocaleProvider } from "@lib/i18n/client"

const badoni = Bodoni_Moda({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const locale = cookieStore.get("_medusa_locale")?.value ?? "en"
  const dict = await getDictionary(locale)

  // Extract the language portion for the HTML lang attribute (e.g. "de-AT" → "de")
  const lang = locale.split("-")[0]

  return (
    <html lang={lang} data-mode="light">
      <body className={`${badoni.variable} ${dmSans.variable}`}>
        <LocaleProvider initialLocale={locale} initialDict={dict}>
          <main className="relative">{props.children}</main>
        </LocaleProvider>
      </body>
    </html>
  )
}
