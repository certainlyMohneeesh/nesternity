import "../styles/globals.css";
import { Inter } from "next/font/google";
import { ReactNode } from "react";
import { Metadata, Viewport } from "next";
import CookieConsent from "@/components/CookieConsent";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/next";
import { seoConfig, getStructuredData } from "@/lib/seo";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL(seoConfig.baseUrl),
  title: {
    default: "Nesternity | Modern SaaS CRM Dashboard",
    template: "%s | Nesternity",
  },
  description:
    "Nesternity is a modern SaaS CRM dashboard for teams and projects. Manage invoices, budgets, proposals, contracts, and team collaboration all in one place.",
  keywords: [
    "CRM",
    "project management",
    "team collaboration",
    "invoicing software",
    "budget tracking",
    "SaaS dashboard",
    "freelancer tools",
    "business management",
    "proposal management",
    "contract management",
    "client management",
    "invoice generator",
    "team CRM",
    "project dashboard",
  ],
  authors: [{ name: seoConfig.author, url: seoConfig.baseUrl }],
  creator: seoConfig.author,
  publisher: seoConfig.siteName,
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
    googleBot: "index, follow",
  },
  formatDetection: {
    email: true,
    telephone: true,
    address: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: seoConfig.baseUrl,
    siteName: seoConfig.siteName,
    title: "Nesternity | Modern SaaS CRM Dashboard",
    description:
      "Nesternity is a modern SaaS CRM dashboard for teams and projects. Manage invoices, budgets, proposals, contracts, and team collaboration all in one place.",
    images: [
      {
        url: seoConfig.logo,
        width: 1200,
        height: 630,
        alt: "Nesternity CRM Dashboard",
        type: "image/png",
      },
      {
        url: `${seoConfig.baseUrl}/nesternity_l.png`,
        width: 1200,
        height: 630,
        alt: "Nesternity Logo",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: seoConfig.twitterHandle,
    creator: seoConfig.twitterHandle,
    title: "Nesternity | Modern SaaS CRM Dashboard",
    description:
      "Nesternity is a modern SaaS CRM dashboard for teams and projects. Manage invoices, budgets, proposals, contracts, and team collaboration all in one place.",
    images: [seoConfig.logo],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/nesternity_W.png",
  },
  manifest: "/site.webmanifest",
  alternates: {
    canonical: seoConfig.baseUrl,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: seoConfig.siteName,
  },
  category: "Business",
  classification: "Business Software",
  applicationName: seoConfig.siteName,
};

// Separate viewport export (Next.js 14+ requirement)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#18181b",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={inter.variable}
      suppressHydrationWarning
    >
      <head>
        <meta name="theme-color" content="#18181b" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Nesternity" />

        {/* SEO Meta Tags */}
        <meta name="author" content="Nesternity Team" />
        <meta name="description" content="Nesternity is a modern SaaS CRM dashboard for teams and projects. Manage invoices, budgets, proposals, contracts, and team collaboration all in one place." />
        <meta name="keywords" content="CRM, project management, team collaboration, invoicing software, budget tracking, SaaS dashboard, freelancer tools, business management" />
        <meta name="google-site-verification" content="your-google-verification-code" />
        <meta name="msvalidate.01" content="your-bing-verification-code" />

        {/* DNS prefetch and preconnect */}
        <link rel="dns-prefetch" href="//api.nesternity.cyth.app" />
        <link rel="preconnect" href="https://api.nesternity.cyth.app" crossOrigin="anonymous" />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Nesternity CRM",
              url: "https://nesternity.cyth.app",
              logo: "https://nesternity.cyth.app/nesternity_l.png",
              sameAs: [
                "https://twitter.com/nesternity",
                "https://www.linkedin.com/company/nesternity",
              ],
            }),
          }}
        />
      </head>
      <body className="font-sans semi-bold bg-background text-foreground min-h-screen">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <QueryProvider>
            {children}
          </QueryProvider>
          <CookieConsent />
          <Toaster position="bottom-center" richColors closeButton />
          <Analytics />
        </ThemeProvider>

        {/* Software Application Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Nesternity",
              description:
                "Modern SaaS CRM dashboard for teams and projects. Manage invoices, budgets, proposals, and team collaboration all in one place.",
              url: "https://nesternity.cyth.app",
              image: "https://nesternity.cyth.app/nesternity_W.png",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              browserRequirements: "Requires modern web browser",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
                availability: "https://schema.org/InStock",
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.8",
                ratingCount: "150",
                bestRating: "5",
                worstRating: "1",
              },
            }),
          }}
        />

        {/* FAQ Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "What is Nesternity CRM?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Nesternity is a modern SaaS CRM dashboard that helps teams manage projects, invoices, budgets, proposals, and contracts all in one place.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Is Nesternity free?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes, Nesternity offers a free tier with core features. Premium plans are available for advanced capabilities.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Can multiple team members collaborate?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes, Nesternity is built for team collaboration. You can invite team members, assign roles, and work together on projects.",
                  },
                },
                {
                  "@type": "Question",
                  name: "What payment methods do you accept?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "We accept all major credit cards and digital payment methods through our secure payment processor.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Is my data secure?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes, we use enterprise-grade encryption and comply with GDPR and data protection regulations to ensure your data is secure.",
                  },
                },
              ],
            }),
          }}
        />
      </body>
    </html>
  );
}