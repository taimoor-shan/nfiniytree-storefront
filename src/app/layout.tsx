import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import "styles/globals.css"
import { Gelasio, Fraunces, DM_Sans, Inter,Bodoni_Moda } from "next/font/google"

//  const gelasio = Gelasio({
//     subsets: ["latin"],
//     weight: ["400", "500", "600", "700"],
//     variable: "--font-serif",
//     display: "swap",
//   })
 const badoni = Bodoni_Moda({
    subsets: ["latin"],
    // weight: ["400", "500", "600", "700"],
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

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light">
       <body className={`${badoni.variable} ${dmSans.variable}`}>
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
