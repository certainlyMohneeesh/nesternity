import { ReactNode } from "react";
import { NavigationMenu, NavigationMenuItem, NavigationMenuList } from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UserAvatar } from "@/components/layout/user-avatar";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
import { cn } from "@/lib/utils";
import { SessionProvider } from "@/components/auth/session-context";
import NotificationCenter from "@/components/notifications/notification-center";
import { ThemeProvider } from "@/components/theme-provider/theme-provider";
import { StripeProvider } from "@/components/providers/StripeProvider";
import { Menu, Home, Users, FolderOpen, FileText, FileCheck, Settings, Users2, AlertCircle } from "lucide-react";

// Define nav links without icon components to avoid serialization issues
const navLinks = [
  { href: "/dashboard", label: "Dashboard", iconName: "Home" },
  { href: "/dashboard/clients", label: "Clients", iconName: "Users" },
  { href: "/dashboard/projects", label: "Projects", iconName: "FolderOpen" },
  { href: "/dashboard/teams", label: "Teams", iconName: "Users2" },
  { href: "/dashboard/invoices", label: "Invoices", iconName: "FileCheck" },
  { href: "/dashboard/issues", label: "Issues", iconName: "AlertCircle" },
  { href: "/dashboard/contracts", label: "Contracts", iconName: "FileText" },
  { href: "/dashboard/settings", label: "Settings", iconName: "Settings" },
];

// Icon mapping for client components
const iconMap = {
  Home,
  Users,
  FolderOpen,
  FileText,
  FileCheck,
  AlertCircle,
  Users2,
  Settings,
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <StripeProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="flex min-h-screen bg-background">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex lg:flex-col w-64 border-r bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/60">
              <div className="sticky top-0 flex flex-col h-screen">
                {/* Logo */}
                <div className="flex items-center gap-2 p-6 border-b">
                  <img src="/nesternity.svg" alt="Nesternity" className="w-8 h-8" />
                  <span className="font-bold text-lg">Nesternity CRM</span>
                </div>
                
                {/* Navigation */}
                <nav className="flex-1 p-4 overflow-y-auto">
                  <NavigationMenu orientation="vertical" className="w-full">
                    <NavigationMenuList className="flex flex-col gap-2 w-full">
                      {navLinks.map((link) => {
                        const Icon = iconMap[link.iconName as keyof typeof iconMap];
                        return (
                          <NavigationMenuItem key={link.href} className="w-full">
                            <Link
                              href={link.href}
                              className={cn(
                                "flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-muted group",
                                "relative overflow-hidden"
                              )}
                            >
                              <Icon className="h-4 w-4 flex-shrink-0 transition-colors" />
                              <span className="truncate">{link.label}</span>
                            </Link>
                          </NavigationMenuItem>
                        )
                      })}
                    </NavigationMenuList>
                  </NavigationMenu>
                </nav>
              </div>
            </aside>

            {/* Main content area */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Mobile/Desktop Header */}
              <header className="sticky top-0 z-40 flex items-center justify-between px-4 lg:px-6 py-3 border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
                {/* Mobile Navigation */}
                <div className="flex items-center gap-3">
                  <MobileNavigation navLinks={navLinks} />
                  
                  {/* Desktop Logo */}
                  <div className="lg:hidden flex items-center gap-2">
                    <img src="/nesternity.svg" alt="Nesternity" className="w-8 h-8" />
                    <span className="font-bold text-lg">Nesternity</span>
                  </div>
                </div>

                {/* Header Actions */}
                <div className="flex items-center gap-3">
                  <NotificationCenter />
                  <UserAvatar />
                  <Link href="/auth/logout">
                    <Button size="sm" variant="outline" className="hidden sm:inline-flex">
                      Logout
                    </Button>
                  </Link>
                </div>
              </header>

              {/* Main Content */}
              <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
                <div className="max-w-7xl mx-auto">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </ThemeProvider>
      </StripeProvider>
    </SessionProvider>
  );
}
