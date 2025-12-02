import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { checkFinancialAccess } from "@/lib/access-control";
import { AccessDenied } from "@/components/access/access-denied";
import { InvoicesPageClient } from "./invoices-client";

export default async function InvoicesPage({
  params,
}: {
  params: Promise<{ id: string; projectId: string }>;
}) {
  const { id: orgId, projectId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?returnUrl=/dashboard/invoices");
  }

  // Check if user has financial access (only org owners)
  const accessCheck = await checkFinancialAccess(user.id, orgId);

  if (!accessCheck.hasAccess) {
    return (
      <AccessDenied
        reason={accessCheck.reason || undefined}
        orgId={orgId}
        projectId={projectId}
        resourceType="invoices"
      />
    );
  }

  return <InvoicesPageClient orgId={orgId} projectId={projectId} />;
}
