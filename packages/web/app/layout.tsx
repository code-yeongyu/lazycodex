import type { Metadata, Viewport } from "next"
import type { JSX, ReactNode } from "react"
import "./globals.css"


const SITE_URL = "https://lazycodex.ai"
const SITE_NAME = "LazyCodex AI"
const TAGLINE = "Codex for no-brainers"
const DESCRIPTION =
  "LazyCodex AI. You don't need to think. Just prompt with ultrawork. Coming June 2026. Currently on OpenCode."

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2a2dbf",
  colorScheme: "dark",
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${TAGLINE}. Coming June 2026.`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "lazycodex",
    "codex",
    "opencode",
    "oh-my-openagent",
    "omo",
    "ai agent",
    "code agent",
    "agent harness",
    "sisyphus",
    "lazyvim",
  ],
  authors: [{ name: "Yeongyu Kim", url: "https://github.com/code-yeongyu" }],
  creator: "Yeongyu Kim",
  publisher: "Sisyphus Labs",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${TAGLINE}. Coming June 2026.`,
    description: DESCRIPTION,
    // og:image supplied by app/opengraph-image.tsx (file-based convention).
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${TAGLINE}`,
    description: DESCRIPTION,
    creator: "@code_yeongyu",
    // twitter:image supplied by app/twitter-image.tsx.
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "developer tools",
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SITE_NAME,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "macOS, Linux, Windows",
  url: SITE_URL,
  description: DESCRIPTION,
  author: {
    "@type": "Person",
    name: "Yeongyu Kim",
    url: "https://github.com/code-yeongyu",
  },
  publisher: {
    "@type": "Organization",
    name: "Sisyphus Labs",
    url: "https://sisyphuslabs.ai",
  },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/PreOrder",
    availabilityStarts: "2026-06-01",
  },
  potentialAction: {
    "@type": "ViewAction",
    target: "https://github.com/code-yeongyu/lazycodex",
  },
}

export default function RootLayout({
  children,
}: {
  readonly children: ReactNode
}): JSX.Element {
  return (
    <html lang="en">
      <body className="min-h-[100dvh] font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  )
}
