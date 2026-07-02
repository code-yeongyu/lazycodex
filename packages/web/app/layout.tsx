import type { Metadata, Viewport } from "next"
import type { JSX, ReactNode } from "react"
import "./globals.css"


const SITE_URL = "https://lazycodex.ai"
const SITE_NAME = "LazyCodex"
const TAGLINE = "Codex agent harness for complex codebases"
const DESCRIPTION =
  "LazyCodex installs the OmO agent harness inside Codex: project memory, planning, parallel agents, skills, hooks, routing, and verified completion for complex codebases."

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f4f6ee",
  colorScheme: "light",
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${TAGLINE}`,
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
    "complex codebases",
    "verified completion",
    "project memory",
    "lazyvim",
  ],
  authors: [{ name: "Yeongyu Kim", url: "https://github.com/code-yeongyu" }],
  creator: "Yeongyu Kim",
  publisher: "Yeongyu Kim",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${TAGLINE}`,
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
    name: "LazyCodex",
    url: SITE_URL,
  },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
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
