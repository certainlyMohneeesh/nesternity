import { ReactNode } from "react";
import { NavigationMenu, NavigationMenuItem, NavigationMenuList } from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UserAvatar } from "@/components/layout/user-avatar";
import { cn } from "@/lib/utils";
import { SessionProvider } from "@/components/auth/session-context";
import NotificationCenter from "@/components/notifications/notification-center";
import { ThemeProvider } from "@/components/theme-provider/theme-provider";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/clients", label: "Clients" },
  { href: "/dashboard/projects", label: "Projects" },
  { href: "/dashboard/contracts", label: "Contracts" },
  { href: "/dashboard/invoices", label: "Invoices" },
  { href: "/dashboard/settings", label: "Settings" },
  { href: "/dashboard/teams", label: "Teams" },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      {/* <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
      > */}
      <div className="flex min-h-screen bg-background">
        {/* Sidebar */}
        <aside className="hidden md:flex md:flex-col w-64 border-r bg-card p-4">
          <nav>
            <NavigationMenu orientation="vertical" className="w-full">
              <NavigationMenuList className="flex flex-col gap-2">
                {navLinks.map(link => (
                  <NavigationMenuItem key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        "block rounded-md px-4 py-2 text-base font-medium text-foreground hover:bg-muted transition-colors"
                      )}
                    >
                      {link.label}
                    </Link>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </nav>
        </aside>
        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Topbar */}
          <header className="flex items-center justify-between px-4 py-3 border-b bg-card/80 backdrop-blur">
            {/* Logo */}
            <div className="w-12 h-12 rounded-lg flex items-center justify-center">
            <img src="/nesternity.svg" alt="Nesternity" className="w-12 h-12" />
            </div>
            <div className="font-bold text-lg">Nesternity CRM</div>
            <div className="flex items-center gap-4">
              <NotificationCenter />
              <UserAvatar />
              <Link href="/auth/logout">
                <Button size="sm" variant="outline">Logout</Button>
              </Link>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
      {/* </ThemeProvider> */}
    </SessionProvider>
  );
}
