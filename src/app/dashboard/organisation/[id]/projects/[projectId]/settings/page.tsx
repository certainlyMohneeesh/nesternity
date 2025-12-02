import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { checkFinancialAccess } from "@/lib/access-control";
import { AccessDenied } from "@/components/access/access-denied";
import { ProjectSettingsClient } from "./settings-client";

export default async function ProjectSettingsPage({
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
    redirect("/auth/login?returnUrl=/dashboard/settings");
  }

  // Check if user has financial access (only org owners can access project settings)
  const accessCheck = await checkFinancialAccess(user.id, orgId);

  if (!accessCheck.hasAccess) {
    return (
      <AccessDenied
        reason={accessCheck.reason || undefined}
        orgId={orgId}
        projectId={projectId}
        resourceType="project settings"
      />
    );
  }

  return <ProjectSettingsClient orgId={orgId} projectId={projectId} />;
}
