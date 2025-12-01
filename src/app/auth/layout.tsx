"use client";
import Script from "next/script";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            {/* Force light mode script - runs before React hydration */}
            <Script
                id="force-light-mode"
                strategy="beforeInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
            (function() {
              // Remove dark class immediately
              document.documentElement.classList.remove('dark');
              
              // Prevent dark class from being added
              const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                  if (mutation.attributeName === 'class') {
                    if (document.documentElement.classList.contains('dark')) {
                      document.documentElement.classList.remove('dark');
                    }
                  }
                });
              });
              
              observer.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ['class']
              });
              
              // Set light mode in localStorage to prevent next-themes from applying dark
              try {
                localStorage.setItem('theme', 'light');
              } catch (e) {}
            })();
          `,
                }}
            />

            <div className="light bg-white min-h-screen" suppressHydrationWarning>
                <style jsx global>{`
          /* Force light mode styles for auth pages */
          html, html.dark {
            color-scheme: light !important;
          }
          
          html body,
          html.dark body {
            background-color: white !important;
            color: black !important;
          }
        `}</style>
                {children}
            </div>
        </>
    );
}
