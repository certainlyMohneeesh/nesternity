import "../styles/globals.css";
import { Inter } from "next/font/google";
import { ReactNode } from "react";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "Nesternity CRM",
  description: "Modern SaaS CRM Dashboard",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-mono bg-background text-foreground min-h-screen">
          {/* Navbar, Providers, Toaster, etc. */}
          {children}
      </body>
    </html>
  );
}
