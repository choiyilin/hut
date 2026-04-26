import type { Metadata } from "next"
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google"
import Script from "next/script"
import { SavedProvider } from "@/features/saved"
import "./globals.css"

// Logo only — kept separate so the serif can stay isolated to the logo mark
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair-face",
  display: "swap",
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
})

// Primary UI font — geometric, personality, heavy weights
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta-face",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
})

export const metadata: Metadata = {
  title: "HUT — Find Your Perfect Home",
  description: "Discover NYC rental apartments in the neighborhoods you actually want to live in.",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <Script
          id="font-awesome"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `var l=document.createElement('link');l.rel='stylesheet';l.href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css';document.head.appendChild(l);`,
          }}
        />
      </head>
      <body className={`${playfair.variable} ${jakarta.variable} font-sans`}>
        <SavedProvider>{children}</SavedProvider>
      </body>
    </html>
  )
}
