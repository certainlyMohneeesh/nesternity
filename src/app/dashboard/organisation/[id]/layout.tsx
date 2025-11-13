"use client";

export default function OrganisationDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout inherits the header from parent organisation layout
  // The BreadcrumbCombobox in parent layout automatically updates based on pathname
  // Add container padding for pages without their own layout (like the projects list page)
  return (
    <div className="container max-w-screen-2xl px-4 md:px-8 py-6">
      {children}
    </div>
  );
}
