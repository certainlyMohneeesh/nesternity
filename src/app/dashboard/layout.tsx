import { ReactNode } from "react";
import { SessionProvider } from "@/components/auth/session-context";
import { ThemeProvider } from "@/components/theme-provider/theme-provider";
import { StripeProvider } from "@/components/providers/StripeProvider";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <StripeProvider>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} themes={["light"]}>
          {children}
        </ThemeProvider>
      </StripeProvider>
    </SessionProvider>
  );
}
