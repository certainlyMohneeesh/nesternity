import { BreadcrumbCombobox } from "@/components/navigation/breadcrumb-combobox";
import { UserNav } from "@/components/navigation/user-nav";

export default function OrganisationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Supabase-style Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center px-4 md:px-8">
          <div className="flex flex-1 items-center justify-between space-x-2">
            {/* Breadcrumb with Combobox */}
            <BreadcrumbCombobox />
            
            {/* Right side - User Navigation */}
            <UserNav />
          </div>
        </div>
      </header>
      
      {/* Main Content Area - Let child layouts handle their own spacing */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}

