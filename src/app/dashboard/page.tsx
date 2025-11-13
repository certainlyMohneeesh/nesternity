import { redirect } from "next/navigation";

export default function DashboardPage() {
  // Redirect to the new organisation-centric dashboard
  redirect("/dashboard/organisation");
}
