import "../styles/globals.css";
import { Inter } from "next/font/google";
import { ReactNode } from "react";
import CookieConsent from "@/components/CookieConsent";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/providers/query-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "Nesternity",
  description: "Modern SaaS CRM Dashboard for teams and projects.",
  keywords: "CRM, SaaS, Dashboard, Teams, Projects, Invoices, Tasks, Boards",
  openGraph: {
    title: "Nesternity",
    description: "Modern SaaS CRM Dashboard for teams and projects.",
    url: "https://nesternity.cyth.me",
    siteName: "Nesternity",
    images: [
      {
        url: "/nesternity_W.png",
        width: 1200,
        height: 630,
        alt: "Nesternity CRM Dashboard",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@nesternity",
    title: "Nesternity",
    description: "Modern SaaS CRM Dashboard for teams and projects.",
    image: "/nesternity_W.png",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/nesternity_W.png",
  },
  alternates: {
    canonical: "https://nesternity.cyth.me",
  },
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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#18181b" />
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Nesternity CRM",
              url: "https://nesternity.cyth.me",
              logo: "https://nesternity.cyth.me/nesternity_l.png",
              sameAs: [
                "https://twitter.com/nesternity",
                "https://www.linkedin.com/company/nesternity",
              ],
            }),
          }}
        />
      </head>
      <body className="font-sans semi-bold bg-background text-foreground min-h-screen">
        <QueryProvider>
          {children}
        </QueryProvider>
        <CookieConsent />
        <Toaster position="bottom-center" richColors closeButton />
      </body>
    </html>
  );
}