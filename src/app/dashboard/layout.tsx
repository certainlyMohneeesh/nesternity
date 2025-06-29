import { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <section className="flex min-h-screen">
      {/* Sidebar, Navbar, etc. */}
      <main className="flex-1 p-6">{children}</main>
    </section>
  );
}
