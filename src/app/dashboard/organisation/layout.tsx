import { BreadcrumbCombobox } from "@/components/navigation/breadcrumb-combobox";
import { UserNav } from "@/components/navigation/user-nav";

export default function OrganisationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Supabase-style Header. Breadcrumb remains centered in the container, but the UserNav is fixed to the right edge of the viewport */}
      <header className="relative sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center px-4 md:px-8 pr-12 md:pr-20">
          <div className="flex flex-1 items-center">
            {/* Breadcrumb with Combobox */}
            <BreadcrumbCombobox />
          </div>
        </div>

        {/* Place the UserNav outside the centered container so it sits flush to the right edge of the viewport */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 md:right-8">
          <UserNav />
        </div>
      </header>
      
      {/* Main Content Area - Let child layouts handle their own spacing */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}

