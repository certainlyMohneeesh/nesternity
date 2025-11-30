"use client";

import { useState } from "react";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users2,
  FileText,
  FileSignature,
  Receipt,
  AlertCircle,
  ChevronRight
} from "lucide-react";
import { useFinancialAccess } from "@/hooks/use-financial-access";

const projectNavLinks = [
  { href: "", label: "Dashboard", icon: LayoutDashboard },
  { href: "/teams", label: "Teams", icon: Users2 },
  { href: "/proposals", label: "Proposals", icon: FileText, requiresFinancialAccess: true },
  { href: "/contracts", label: "Contracts", icon: FileSignature, requiresFinancialAccess: true },
  { href: "/invoices", label: "Invoices", icon: Receipt, requiresFinancialAccess: true },
  { href: "/issues", label: "Issues", icon: AlertCircle },
];

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check if user has financial access
  const { hasAccess: hasFinancialAccess, loading: accessLoading } = useFinancialAccess(params.id as string);

  // Filter nav links based on access
  const visibleNavLinks = projectNavLinks.filter(link => {
    if (link.requiresFinancialAccess) {
      return hasFinancialAccess;
    }
    return true;
  });

  const baseHref = `/dashboard/organisation/${params.id}/projects/${params.projectId}`;

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      {/* Supabase-style Sidebar (appears on hover) */}
      <div
        className={cn(
          "fixed left-0 top-14 h-[calc(100vh-3.5rem)] z-40 transition-all duration-200 ease-in-out",
          "bg-background border-r",
          sidebarOpen ? "w-56" : "w-0 lg:w-12"
        )}
        onMouseEnter={() => setSidebarOpen(true)}
        onMouseLeave={() => setSidebarOpen(false)}
      >
        <nav className="flex flex-col gap-1 p-2">
          {visibleNavLinks.map((link) => {
            const Icon = link.icon;
            const href = `${baseHref}${link.href}`;
            const isActive = link.href === ""
              ? pathname === baseHref
              : pathname.startsWith(href);

            return (
              <Link
                key={link.href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  isActive && "bg-accent text-accent-foreground",
                  !sidebarOpen && "lg:justify-center"
                )}
                title={!sidebarOpen ? link.label : undefined}
              >
                <Icon className={cn("h-4 w-4 flex-shrink-0")} />
                <span className={cn(
                  "truncate transition-opacity duration-200",
                  !sidebarOpen && "lg:hidden opacity-0"
                )}>
                  {link.label}
                </span>
                {isActive && sidebarOpen && (
                  <ChevronRight className="ml-auto h-4 w-4" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content with responsive margin and padding */}
      <div className={cn(
        "flex-1 transition-all duration-200",
        sidebarOpen ? "ml-56" : "ml-0 lg:ml-12"
      )}>
        <div className="container max-w-screen-2xl px-4 md:px-8 py-6">
          {children}
        </div>
      </div>
    </div>
  );
}

